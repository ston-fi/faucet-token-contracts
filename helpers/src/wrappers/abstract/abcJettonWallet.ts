import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Dictionary,
    Sender,
    SendMode,
    Slice
} from '@ton/core';

import { beginMessage, codeFromString, emptyCell } from "../../helpers";
import { CommonContractBase } from './abcCommon';

export type JettonWalletData = {
    balance: bigint,
    ownerAddress: Address,
    jettonMasterAddress: Address,
    jettonWalletCode?: Cell,
};

export type WalletOpcodesType = {
    transfer: number | bigint,
    internalTransfer: number | bigint,
    burn: number | bigint,
}

export abstract class JettonWalletContractBase<T extends WalletOpcodesType> extends CommonContractBase {
    constructor(readonly opCodes: T, readonly address: Address, readonly init?: { code: Cell; data: Cell; }) { 
        super(address, init)
    }

    async sendTransfer(provider: ContractProvider, via: Sender, opts: {
        value?: bigint,
        jettonAmount: number | bigint,
        toAddress: Address,
        responseAddress: Address | null,
        fwdAmount: number | bigint,
        fwdPayload: Cell | Slice,
    }, value?: bigint) {
        if (!this.opCodes.transfer) 
            throw new Error("Not Implemented")

        value = opts.value ?? value
        if (!value) 
            throw new Error("Message must have value")

        let msg_builder = beginMessage(this.opCodes.transfer)
            .storeCoins(opts.jettonAmount)
            .storeAddress(opts.toAddress)
            .storeAddress(opts.responseAddress)
            .storeDict(Dictionary.empty(Dictionary.Keys.Uint(1), Dictionary.Values.Uint(1)))
            .storeCoins(opts.fwdAmount);

        let msg: Cell;

        if (opts.fwdPayload instanceof Cell) {
            msg = msg_builder
                .storeUint(1, 1)
                .storeRef(opts.fwdPayload)
                .endCell();
        } else {
            msg = msg_builder
                .storeUint(0, 1)
                .storeSlice(opts.fwdPayload)
                .endCell();
        }

        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg,
        });
    }

    async sendInternalTransfer(provider: ContractProvider, via: Sender, opts: {
        value?: bigint,
        jettonAmount: number | bigint,
        fromAddress: Address,
        responseAddress: Address | null,
        fwdAmount: number | bigint,
        fwdPayload: Cell | Slice,
    }, value?: bigint) {
        if (!this.opCodes.internalTransfer) 
            throw new Error("Not Implemented")

        value = opts.value ?? value
        if (!value) 
            throw new Error("Message must have value")

        let msg_builder = beginMessage(this.opCodes.internalTransfer)
            .storeCoins(opts.jettonAmount)
            .storeAddress(opts.fromAddress)
            .storeAddress(opts.responseAddress)
            .storeCoins(opts.fwdAmount);

        let msg: Cell;

        if (opts.fwdPayload instanceof Cell) {
            msg = msg_builder.storeRef(opts.fwdPayload).endCell();
        } else {
            msg = msg_builder.storeSlice(opts.fwdPayload).endCell();
        }

        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg,
        });
    }

    async sendBurn(provider: ContractProvider, via: Sender, opts: {
        value?: bigint,
        jettonAmount: number | bigint,
        responseAddress: Address | null,
    }, value?: bigint) {
        if (!this.opCodes.burn) 
            throw new Error("Not Implemented")

        value = opts.value ?? value
        if (!value) 
            throw new Error("Message must have value") 

        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.burn)
                .storeCoins(opts.jettonAmount)
                .storeAddress(opts.responseAddress)
                .endCell(),
        });
    }

    async getWalletData(provider: ContractProvider): Promise<JettonWalletData> {
        const result = await provider.get('get_wallet_data', []);
        return {
            balance: result.stack.readBigNumber(),
            ownerAddress: result.stack.readAddress(),
            jettonMasterAddress: result.stack.readAddress(),
            jettonWalletCode: result.stack.readCell(),
        };
    }
}
