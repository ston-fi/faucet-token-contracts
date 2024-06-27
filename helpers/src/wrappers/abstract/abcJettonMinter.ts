import {
    Address,
    beginCell,
    Builder,
    Cell,
    ContractProvider,
    Dictionary,
    Sender,
    SendMode,
    Slice
} from '@ton/core';

import { sha256_sync } from '@ton/crypto';
import fs from 'fs';
import { beginMessage, emptyCell, toSnakeCase } from "../../helpers";
import { CommonContractBase } from './abcCommon';

export type MintMsgConfig = {
    op: number | bigint,
    queryId?: number | bigint,
    jettonAmount: number | bigint,
    jettonMinterAddress: Address,
    responseAddress?: Address,
    fwdAmount?: bigint,
    payload?: Cell | Slice;
};
export function mintMsgConfigToCell(config: MintMsgConfig): Cell {
    let res = beginCell()
        .storeUint(config.op, 32)
        .storeUint(config.queryId ?? 0, 64)
        .storeCoins(config.jettonAmount)
        .storeAddress(config.jettonMinterAddress)
        .storeAddress(config.responseAddress ?? null)
        .storeCoins(config.fwdAmount ?? 0);

    if (config.payload instanceof Cell) {
        res.storeUint(1, 1)
            .storeRef(config.payload);
    } else if (config.payload instanceof Slice) {
        res.storeUint(0, 1)
            .storeSlice(config.payload);
    } else {
        res.storeUint(0, 1);
    }

    return res.endCell();
}

export type JettonData = {
    totalSupply: bigint,
    canIncSupply: boolean,
    adminAddress: Address | null,
    contentRaw: Cell,
    jettonWalletCode: Cell,
    content: JettonContent | string;
};

export type JettonContent = {
    uri?: string,
    name?: string,
    description?: string,
    image?: string,
    imageData?: string,
    symbol?: string,
    decimals?: string | number,
};

export function onchainMetadata(params: JettonContent) {
    const cellMaxSizeBytes = Math.floor((1023 - 8) / 8);
    const snakePrefix = 0x00;

    const dict: Dictionary<Buffer, Cell> = Dictionary.empty(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell());

    let key: keyof typeof params;
    for (key in params) {
        if (typeof key === "undefined") {
            continue;
        }

        let encoding: "ascii" | "utf8";
        if (key === "image") {
            encoding = "ascii";
        } else {
            encoding = "utf8";
        }
        const value = params[key]?.toString() as string;

        let bufferToStore: Buffer;
        if (key === "imageData") {
            const file = fs.readFileSync(value);
            bufferToStore = file
        } else {
            bufferToStore = Buffer.from(value, encoding);
        }
        
        const rootB = beginCell().storeUint(snakePrefix, 8);

        let currentB = rootB;
        let builders: Builder[] = [];
        while (bufferToStore.length > 0) {
            builders.push(currentB);
            currentB.storeBuffer(bufferToStore.subarray(0, cellMaxSizeBytes));
            bufferToStore = bufferToStore.subarray(cellMaxSizeBytes);
            if (bufferToStore.length > 0) {
                currentB = beginCell();
            }
        }

        for (let i = builders.length - 1; i > 0; i--) {
            builders[i - 1].storeRef(builders[i].endCell());
        }
        const finalCell = builders[0].endCell();

        dict.set(sha256_sync(toSnakeCase(key)), finalCell);
    }
    return dict;
}

export function metadataCell(content: string | Dictionary<Buffer, Cell>): Cell {
    let res: Cell;
    if (typeof content === "string") {
        res = beginCell()
            .storeUint(0x01, 8)
            .storeStringTail(content)
            .endCell();
    } else {
        res = beginCell()
            .storeUint(0x00, 8)
            .storeDict(content)
            .endCell();
    }
    return res;
}

export type JettonMinterOpcodesType = {
    burnNotification: number | bigint,
    mint: number | bigint,
    changeAdmin: number | bigint,
    changeContent: number | bigint,
    internalTransfer: number | bigint;
};

export abstract class JettonMinterContractBase<T extends JettonMinterOpcodesType> extends CommonContractBase {
    constructor(readonly opCodes: T, readonly address: Address, readonly init?: { code: Cell; data: Cell; }) {
        super(address, init);
    }

    async sendMint(provider: ContractProvider, via: Sender, opts: {
        value?: bigint,
        toAddress: Address,
        fwdAmount: number | bigint,
        masterMsg: Cell | Omit<MintMsgConfig, "op">,
    }, value?: bigint) {
        if (!this.opCodes.mint)
            throw new Error("Not Implemented");

        value = opts.value ?? value;
        if (!value)
            throw new Error("Message must have value");

        const mstMsg = opts.masterMsg instanceof Cell ? opts.masterMsg : mintMsgConfigToCell({
            ...opts.masterMsg,
            op: this.opCodes.internalTransfer
        });

        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.mint)
                .storeAddress(opts.toAddress)
                .storeCoins(opts.fwdAmount)
                .storeRef(mstMsg)
                .endCell()
        });
    }

    async sendBurnNotification(provider: ContractProvider, via: Sender, opts: {
        value?: bigint,
        jettonAmount: number | bigint,
        fromAddress: Address,
        responseAddress: Address,
    }, value?: bigint) {
        if (!this.opCodes.burnNotification)
            throw new Error("Not Implemented");

        value = opts.value ?? value;
        if (!value)
            throw new Error("Message must have value");
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.burnNotification)
                .storeCoins(opts.jettonAmount)
                .storeAddress(opts.fromAddress)
                .storeAddress(opts.responseAddress)
                .endCell()
        });
    }

    async sendChangeAdmin(provider: ContractProvider, via: Sender, opts: {
        value?: bigint,
        newAdminAddress: Address | null,
    }, value?: bigint) {
        if (!this.opCodes.changeAdmin)
            throw new Error("Not Implemented");

        value = opts.value ?? value;
        if (!value)
            throw new Error("Message must have value");

        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.changeAdmin)
                .storeAddress(opts.newAdminAddress)
                .endCell()
        });
    }

    async sendChangeContent(provider: ContractProvider, via: Sender, opts: {
        value?: bigint,
        content: Cell,
    }, value?: bigint) {
        if (!this.opCodes.changeContent)
            throw new Error("Not Implemented");

        value = opts.value ?? value;
        if (!value)
            throw new Error("Message must have value");

        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.changeContent)
                .storeRef(opts.content)
                .endCell()
        });
    }

    async getJettonData(provider: ContractProvider): Promise<JettonData> {
        let res: JettonData = {
            totalSupply: 0n,
            canIncSupply: false,
            adminAddress: null,
            contentRaw: emptyCell(),
            jettonWalletCode: emptyCell(),
            content: ""
        };
        try {
            const result = await provider.get('get_jetton_data', []);
            res = {
                totalSupply: result.stack.readBigNumber(),
                canIncSupply: Boolean(result.stack.readNumber()),
                adminAddress: result.stack.readAddressOpt(),
                contentRaw: result.stack.readCell(),
                jettonWalletCode: result.stack.readCell(),
                content: ""
            };

            const contentSlice = res.contentRaw.beginParse();
            const contentType = contentSlice.loadUint(8);

            if (contentType === 1) {
                res.content = contentSlice.loadStringTail();
            } else {
                const keys = ["uri", "name", "description", "image", "symbol", "decimals"] as const;
                let contentRes: JettonContent = {};

                const dict = contentSlice.loadDict(Dictionary.Keys.Buffer(32), Dictionary.Values.Cell());

                let key: keyof JettonContent;
                for (key of keys) {
                    let val = dict.get(sha256_sync(key));
                    if (typeof val === "undefined") {
                        continue;
                    }

                    let encoding: "utf8" | "ascii";
                    if (key === "image") {
                        encoding = "ascii" as const;
                    } else {
                        encoding = "utf8" as const;
                    }

                    let resRead: Buffer = Buffer.from("");
                    let sc = val.beginParse();
                    if (sc.preloadUint(8) === 0) {
                        sc.loadUint(8);
                    }
                    while (true) {
                        let newData = sc.loadBits(sc.remainingBits);
                        resRead = Buffer.concat([resRead, newData.subbuffer(0, newData.length) as Buffer]);
                        if (sc.remainingRefs === 0) break;
                        sc = sc.loadRef().beginParse();
                    }
                    contentRes[key] = resRead.toString(encoding);
                }
                res.content = contentRes;
            }
        } catch (err) {
            if ((err as any).toString().includes("Exit code: 9")) {
                let ctrState = await provider.getState();
                if (ctrState.state.type === "active") {
                    let data = ctrState.state.data;
                    if (data instanceof Buffer) {
                        let dc = Cell.fromBoc(data)[0].beginParse();
                        let adminAddress = dc.loadAddress();
                        dc.loadUint(8);
                        dc.loadUint(8);
                        dc.loadUint(8);
                        dc.loadAddress();
                        dc.loadAddress();
                        let totalSupply = dc.loadCoins();
                        let myAddress = this.address;
                        let content = `https://lp.ston.fi/0:${myAddress.hash.toString("hex")}.json`;
                        res = {
                            totalSupply: totalSupply,
                            canIncSupply: true,
                            adminAddress: adminAddress,
                            contentRaw: emptyCell(),
                            jettonWalletCode: emptyCell(),
                            content: content
                        };
                    }
                }
            } else {
                throw err;
            }

        }
        return res;
    }

    async getWalletAddress(provider: ContractProvider, ownerAddress: Address) {
        const result = await provider.get('get_wallet_address', [{
            type: 'slice',
            cell: beginCell().storeAddress(ownerAddress).endCell()
        }]);
        return result.stack.readAddress();
    }

}
