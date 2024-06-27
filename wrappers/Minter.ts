import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano } from '@ton/core';
import { beginMessage, crc32, emptyCell, JettonMinterContractBase, JettonMinterContractDiscoverable, jMinterOpcodes } from "../helpers";

export type JettonMinterConfig = {
    totalSupply: number | bigint,
    adminAddress: Address,
    content: Cell,
    jettonWalletCode: Cell,
};

export function jettonMinterConfigToCell(config: JettonMinterConfig): Cell {
    return beginCell()
        .storeCoins(config.totalSupply)
        .storeAddress(config.adminAddress)
        .storeRef(config.content)
        .storeRef(config.jettonWalletCode)
        .endCell();
}

export const jMinterDiscOpcodes = {
    ...jMinterOpcodes,
    provideWalletAddress: 0x2c76b973,
    takeWalletAddress: 0xd1735400,
    mint: crc32("mint"),
    change_admin: crc32("change_admin"),
    change_content: crc32("change_content"),
} as const;

export class Minter extends JettonMinterContractBase<typeof jMinterDiscOpcodes> {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell; }) {
        super(jMinterDiscOpcodes, address, init)
    }

    static createFromConfig(config: JettonMinterConfig, code: Cell, workchain = 0) {
        return this.createFromConfigBase(config, jettonMinterConfigToCell, code, workchain)
    }


    async sendProvideWalletAddress(provider: ContractProvider, via: Sender, opts: {
        value: bigint,
        ownerAddress: Address,
        includeAddress?: boolean
    }) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.provideWalletAddress)
                .storeAddress(opts.ownerAddress)
                .storeUint(Number(opts.includeAddress ?? false), 1)
                .endCell()
        });
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(1, 1).endCell(),
            bounce: false
        });
    }

    async sendMintJettons(provider: ContractProvider, via: Sender, value?: bigint,) {
        await provider.internal(via, {
            value: value || toNano("1"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        });
    }

    async sendChngeAdmin(provider: ContractProvider, via: Sender, opts: {
        newAdminAddress: Address
    }, value?: bigint,) {
        await provider.internal(via, {
            value: value || toNano("1"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.change_admin)
                .storeAddress(opts.newAdminAddress)
                .endCell()
        });
    }

    async sendChngeContent(provider: ContractProvider, via: Sender, opts: {
        newContent: Cell
    }, value?: bigint,) {
        await provider.internal(via, {
            value: value || toNano("1"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.change_content)
                .storeRef(opts.newContent)
                .endCell()
        });
    }
}


