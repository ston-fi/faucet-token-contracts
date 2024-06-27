import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, Sender, SendMode, ShardAccount, Slice } from '@ton/core';
import { beginMessage, codeFromString, emptyCell } from "../../helpers";

import { CommonContractBase } from './abcCommon';


export type ContentConfig = {
    collectionContent: Cell,
    commonContent: Cell;
};

export function contentConfigToCell(config: ContentConfig) {
    return beginCell()
        .storeRef(config.collectionContent)
        .storeRef(config.commonContent)
        .endCell();
}

export type NftMinterOpcodesType = {}


export abstract class NftMinterContractBase<T extends NftMinterOpcodesType> extends CommonContractBase {
    constructor(readonly opCodes: T, readonly address: Address, readonly init?: { code: Cell; data: Cell; }) { 
        super(address, init)
    }
    
    async getCollectionData(provider: ContractProvider) {
        const result = await provider.get('get_collection_data', []);
        const res = {
            index: result.stack.readBigNumber(),
            content: "",
            owner: (null as unknown) as Address
        };
        const cntSlice = result.stack.readCell().beginParse();
        cntSlice.loadUint(8);
        res.content = cntSlice.loadStringTail();
        res.owner = result.stack.readAddress();
        return res;
    }

    async getNftAddress(provider: ContractProvider, index: bigint | number) {
        const getArgs = {
            type: 'int',
            value: BigInt(index)
        } as const;
        const result = await provider.get('get_nft_address_by_index', [getArgs]);
        return result.stack.readAddress();
    }

    async getNftContent(provider: ContractProvider, opts: {
        index: bigint | number,
        individualContent: Cell;
    }) {

        const result = await provider.get('get_nft_content', [{
            type: 'int',
            value: BigInt(opts.index)
        },
        {
            type: 'cell',
            cell: opts.individualContent
        }]);

        const resSlice = result.stack.readCell().beginParse();
        resSlice.loadUint(8);
        return resSlice.loadStringTail();
    }
}
