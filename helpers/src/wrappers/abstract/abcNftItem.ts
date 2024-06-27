import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    Dictionary,
    ShardAccount
} from '@ton/core';
import { emptyCell, beginMessage } from '../../helpers';
import { CommonContractBase } from './abcCommon';

export type NftData = {
    statusInit: boolean,
    itemIndex: bigint,
    collectionAddress: Address,
    ownerAddress: Address | null,
    content: string,
};

export type TransferNftConfig = {
    newOwner: Address,
    responseAddress: Address | null,
    fwdAmount: bigint | number,
};

export type NftOpcodesType = {
    transfer: number | bigint,
    getStaticData: number | bigint,
    reportStaticData: number | bigint,
}

export type SbtOpcodesType = NftOpcodesType & {
    destroy: number | bigint,
    proveOwnership: number | bigint,
    ownershipProof: number | bigint,
    ownershipProofBounced: number | bigint,
    requestOwner: number | bigint
}

export abstract class NftItemContractBase<T extends NftOpcodesType> extends CommonContractBase {
    constructor(readonly opCodes: T, readonly address: Address, readonly init?: { code: Cell; data: Cell; }) { 
        super(address, init)
    }

    async sendTransfer(provider: ContractProvider, via: Sender, opts: {
        value?: bigint,
        config: TransferNftConfig;
    }, value?: bigint) {
        value = opts.value ?? value
        if (!value) 
            throw new Error("Message must have value")

        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.transfer)
                .storeAddress(opts.config.newOwner)
                .storeAddress(opts.config.responseAddress)
                .storeUint(0, 1)
                .storeCoins(opts.config.fwdAmount)
                .storeUint(1, 1)
                .endCell(),
        });
    }
    
    async sendGetterStaticData(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.getStaticData)
                .endCell(),
        });
    }

    async getNftData(provider: ContractProvider): Promise<NftData> {
        const result = await provider.get('get_nft_data', []);
        return {
            statusInit: Boolean(result.stack.readNumber()),
            itemIndex: result.stack.readBigNumber(),
            collectionAddress: result.stack.readAddress(),
            ownerAddress: result.stack.readAddressOpt(),
            content: (result.stack.readCell()).beginParse().loadStringTail()
        };
    }
}

export abstract class SbtItemContractBase<T extends SbtOpcodesType> extends NftItemContractBase<T> {

    async sendProveOwnership(provider: ContractProvider, via: Sender, opts: {
        value?: bigint,
        dest: Address,
        payload: Cell,
        includeContent?: boolean
    }, value?: bigint) {
        value = opts.value ?? value
        if (!value) 
            throw new Error("Message must have value")

        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.proveOwnership)
                .storeAddress(opts.dest)
                .storeRef(opts.payload)
                .storeUint(opts.includeContent ? 1 : 0, 1)
            .endCell(),
        });
    }
    
    async sendRequestOwner(provider: ContractProvider, via: Sender, opts: {
        value?: bigint,
        dest: Address,
        payload: Cell,
        includeContent?: boolean
    }, value?: bigint) {
        value = opts.value ?? value
        if (!value) 
            throw new Error("Message must have value")

        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.requestOwner)
                .storeAddress(opts.dest)
                .storeRef(opts.payload)
                .storeUint(opts.includeContent ? 1 : 0, 1)
            .endCell(),
        });
    }
    
    async sendDestroy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.destroy)
                .endCell(),
        });
    }
    
    async getRevokeTime(provider: ContractProvider) {
        const result = await provider.get('get_revoked_time', []);
        return result.stack.readBigNumber()
    }

    async getAuthorityAddress(provider: ContractProvider) {
        const result = await provider.get('get_authority_address', []);
        return result.stack.readAddressOpt()
    }
}