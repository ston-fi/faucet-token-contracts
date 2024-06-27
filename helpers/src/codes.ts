import fs from 'fs';
import * as parser from "./parser/confParser";

// reference: https://docs.ton.org/learn/tvm-instructions/tvm-exit-codes
export const tvmErrorCodes = {
    ok: 0,
    okAlt: 1,
    stackUnderflow: 2,
    stackOverflow: 3,
    intOverflow: 4,
    intOutOfRange: 5,
    invalidOpCode: 6,
    typeCheckError: 7,
    cellOverflow: 8,
    cellUnderflow: 9,
    dictError: 10,
    getMethodNotFound11: 11,
    impossible: 12,
    outOfGas: 13,
    outOfGasAlt: -14,
    actionListInvalid: 32, // maybe get method not found
    actionInvalid: 34,
    notEnoughTon: 37,
    notEnoughExtra: 38,
} as const;

// https://github.com/ton-blockchain/token-contract/blob/main/nft/op-codes.fc
export const stdNftOpCodes = {
    nftTransfer: 0x5fcc3d14,
    nftOwnershipAssigned: 0x05138d91,
    nftGetStaticData: 0x2fcb26a2,
    nftReportStaticData: 0x8b771735,
    nftGetRoyaltyParams: 0x693d3950,
    nftReportRoyaltyParams: 0xa8cb00ad,
    nftEditContent: 0x1a0b9d51,
    nftTransferEditorship: 0x1c04412a,
    nftEditorshipAssigned: 0x511a4463,
    excesses: 0xd53276db,
};

// https://github.com/ton-blockchain/token-contract/blob/main/ft/op-codes.fc
export const stdFtOpCodes = {
    ftTransfer: 0xf8a7ea5,
    ftTransferNotification: 0x7362d09c,
    ftBurn: 0x595f07bc,
    ftProvideWalletAddress: 0x2c76b973,
    ftTakeWalletAddress: 0xd1735400,
    excesses: 0xd53276db,
}

export function parseErrors(path: string) {
    const inp = fs.readFileSync(path, 'utf8');
    const entries = parser.parse(inp);
    let res: Record<string, number> = {};
    // console.log(entries)
    for (let item of entries) {
        const typ = item.type;
        const key = item.key;
        const value = Number(item.val);

        if (typ != "error")
            throw new Error(`type '${typ}' is not an error`)
        if (key in res)
            throw new Error(`key '${key}' defined twice`)
        if (!Number.isInteger(value))
            throw new Error(`value '${value}' is not a number`)
        if (Object.values(res).includes(value))
            throw new Error(`value '${value}' defined twice`)

        res[key] = value
    }
    return res
}

export function parseOp(path: string) {
    const inp = fs.readFileSync(path, 'utf8');
    const entries = parser.parse(inp);
    let res: Record<string, number> = {};
    for (let item of entries) {
        const typ = item.type;
        const key = (item.key as string).replace("::", "_");
        const value = Number(item.val);

        if (typ != "op")
            continue
        if (key in res)
            throw new Error(`key '${key}' defined twice`)
        if (!Number.isInteger(value))
            throw new Error(`value '${value}' is not a number`)
        if (Object.values(res).includes(value))
            throw new Error(`value '${value}' defined twice`)

        res[key] = value
    }
    return res
}