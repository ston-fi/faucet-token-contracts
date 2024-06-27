import {
    Address,
    beginCell,
    Cell,
    ContractProvider,
    Sender,
    SendMode,
    Slice,
    toNano
} from '@ton/core';
import { stdFtOpCodes } from '../codes';
import { beginMessage, codeFromString, parseAddress } from '../helpers';
import { JettonMinterContractBase, JettonMinterOpcodesType } from './abstract/abcJettonMinter';
import { JettonWalletContractBase, WalletOpcodesType } from './abstract/abcJettonWallet';

export const PTON_MAINNET_ADDRESS_v1 = parseAddress("EQCM3B12QK1e4yZSf8GtBRT0aLMNyEsBc_DhVfRRtOEffLez")
export const PTON_MINTER_CODE_v1 = codeFromString("b5ee9c7241020a010001f4000114ff00f4a413f4bcf2c80b01020162020302c2d03322c700925f03e0d0d3030171b0925f03e0ed44d0d401f863d1fa4001f86170f841805401fa443058baf2f4fa4031fa003171d721fa0031fa003073a9b400f86201d31fd33f2282106cc43573bae3020282102c76b973bae3025f03840ff2f0040502037a60080902ae6c2182103d648d80f842a012bef2e053fa40307021805401fa443058baf2f47020f8284130c85003fa0201cf1601cf16c9f84322c8cb01f400f400cb00c920f9007074c8cb02ca07cbffc9d082103b9aca00881371db3c060700f2f8428208989680a013bcf2e04bfa40d3003095c821cf16c9916de28210d1735400708018c8cb05f841cf1621fa02cb6acb1f13cb3f21fa4430c0008e2f017020f8284130c85003fa0201cf1601cf16c9f84322c8cb01f400f400cb00c9f9007074c8cb02ca07cbffc9d0cf16947032cb01e2f400c98040fb000000002e778018c8cb055005cf165005fa0213cb6bccccc901fb00006dadbcf6a2686a00fc31e8b8107c142098642801fd0100e78b00e78b64fc2191646580fa007a00658064fc80383a6465816503e5ffe4e8400095af16f6a2686a00fc31e8b8e46583c6858d0e8e8e0e6745e5ee6e8c2e8d2c65ce6e8dedc5cccd25ed4cae8e8dedc5ee8dedc5ae0e4def0f25cd4e6dedd0678b64b83fc5817c21881a209840af77807b")
export const PTON_WALLET_CODE_v1 = codeFromString("b5ee9c7241020b010001e1000114ff00f4a413f4bcf2c80b01020162020302b6d020c700925f04e001d0d3030171b0925f04e0ed44d0fa0001f863fa4001f864fa4001f865d1fa4001f86270f842805401fa443058baf2f4fa4031fa003171d721fa0031fa003073a9b400f861d31fd33ff842f844c705e302443004050139a0f605da89a1f40003f0c7f48003f0c9f48003f0cba3f087f089f08b110a026244302482100f8a7ea5ba8ea35f04821042a0fb43ba8e93f84382103b9aca00a070fb0270f8448306db3ce0840ff2f0e30d060702fc0482100f8a7ea5ba8eec03fa0031fa4031fa4031f40431fa0024c20022c200b0f2e0575341bcf841aa008209312d00a05230bcb0f2e0535121a170fb0213a1f84321a0f86382107362d09cc8cb1f12cb3f01fa02f842cf1601cf1670f84402c9128306db3cc8f843fa02f844cf16f845cf16c9ed547f935f0470e2dc840f08090028708018c8cb055003cf165003fa02cb6ac901fb0001c434f841aa008209312d00a05210bcf2e05303fa00fa40fa4031f40431fa00315152a013a170fb02f84321a1f863f843c2fff2e05582107362d09cc8cb1f13cb3f58fa02f842cf1658cf167001c9128306db3cc8f843fa02f844cf16f845cf16c9ed5408002c718018c8cb055004cf165004fa0212cb6accc901fb000004f2f00000e34071b1")

export const PTON_MAINNET_ADDRESS_v2 = parseAddress("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c") // hole
export const PTON_TESTNET_ADDRESS_v2 = parseAddress("EQDwpyxrmYQlGDViPk-oqP4XK6J11I-bx7fJAlQCWmJB4tVy") // hole
export const PTON_MINTER_CODE_v2 = codeFromString("b5ee9c724101010100020000004cacb9cd") // empty
export const PTON_WALLET_CODE_v2 = codeFromString("b5ee9c724101010100020000004cacb9cd") // empty

export const DEFAULT_PTON_MAINNET_ADDRESS = PTON_MAINNET_ADDRESS_v2

export const pTonMinterOpCodesCommon= {
    burnNotification: 0,
    mint: 0,
    changeAdmin: 0,
    changeContent: 0,
    internalTransfer: 0,
};

export const pTonWalletOpcodesCommon = {
    internalTransfer: 0,
    burn: 0,
    resetGas: 0
};

export abstract class PTonMinterAbc<T extends JettonMinterOpcodesType> extends JettonMinterContractBase<T> {
    protected version: { major: number, minor: number, dev: string } = undefined as unknown as { major: number, minor: number, dev: string }

    abstract sendDeployWallet(provider: ContractProvider, via: Sender, opts: any, value: bigint): Promise<void>

    async getVersion(provider: ContractProvider) {
        if (!this.version) {
            try {
                const result = await provider.get('get_version', []);
                this.version = {
                    major: result.stack.readNumber(),
                    minor: result.stack.readNumber(),
                    dev: result.stack.readString(),
                }
            } catch {
                this.version = {
                    major: 1,
                    minor: 0,
                    dev: "release",
                }
            }
        }
        return this.version
    }

}

export abstract class PTonWalletAbc<T extends WalletOpcodesType & typeof pTonWalletOpcodesCommon> extends JettonWalletContractBase<T> {
    
    async sendResetGas(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.resetGas)
                .endCell(),
        });
    }
}

// ====================================================================================================
// ================================================ v1 ================================================
// ====================================================================================================

export const pTonMinterOpCodesV1 = {
    ...pTonMinterOpCodesCommon,
    deployWallet: 0x6cc43573
} as const;
export const pTonWalletOpcodesV1 = {
    ...pTonWalletOpcodesCommon,
    transfer: stdFtOpCodes.ftTransfer,
    tonTransfer: 0,
    resetGas: 0x42a0fb43,
} as const;

// ====================================================================================================

export type PTonMinterConfigV1 = {
    walletCode?: Cell,
};
export type PTonWalletConfigV1 = {
    balance?: bigint,
    ownerAddress: Address,
    jettonMasterAddress: Address,
};

// ====================================================================================================

export function pTonMinterConfigToCellV1(config?: PTonMinterConfigV1): Cell {
    return beginCell()
    .storeRef(config?.walletCode ?? PTON_WALLET_CODE_v1)
    .endCell();
}
export function pTonWalletConfigToCellV1(config: PTonWalletConfigV1): Cell {
    return beginCell()
        .storeCoins(config.balance ?? 0)
        .storeAddress(config.ownerAddress)
        .storeAddress(config.jettonMasterAddress)
        .endCell();
}

// ====================================================================================================

export class PTonMinterV1 extends PTonMinterAbc<typeof pTonMinterOpCodesV1> {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell; }) { 
        super(pTonMinterOpCodesV1, address, init)
    }

    static createFromConfig(config?: PTonMinterConfigV1, code?: Cell, workchain = 0) {
        return this.createFromConfigBase(config ?? {}, pTonMinterConfigToCellV1, code ?? PTON_MINTER_CODE_v1, workchain)
    }

    async sendDeployWallet(provider: ContractProvider, via: Sender, opts: {
        ownerAddress: Address,
    }, value: bigint) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.deployWallet)
                .storeAddress(opts.ownerAddress)
                .endCell()
        });
    }

    async getVersion(provider: ContractProvider) {
        let ver = await super.getVersion(provider)
        if (ver.major !== 1) throw new Error("this minter is not v1")
        return this.version
    }
}

export class PTonWalletV1 extends PTonWalletAbc<typeof pTonWalletOpcodesV1> {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell; }) { 
        super(pTonWalletOpcodesV1, address, init)
    }

    static createFromConfig(config: PTonWalletConfigV1, code?: Cell, workchain = 0) {
        return this.createFromConfigBase(config, pTonWalletConfigToCellV1, code ?? PTON_WALLET_CODE_v1, workchain)
    }
}

// ====================================================================================================
// ================================================ v2 ================================================
// ====================================================================================================
export const pTonMinterOpCodesV2 = {
    ...pTonMinterOpCodesCommon,
    deployWallet: 0x4f5f4313
} as const;
export const pTonWalletOpcodesV2 = {
    ...pTonWalletOpcodesCommon,
    transfer: stdFtOpCodes.ftTransfer,
    tonTransfer: 0x01f3835d,
    resetGas: 0x29d22935,
} as const;

// ====================================================================================================

export type PTonMinterConfigV2 = {
    id?: number,
    walletCode: Cell,
    content: Cell,
};
export type PTonWalletConfigV2 = {
    balance: bigint,
    ownerAddress: Address,
    minterAddress: Address,
};

// ====================================================================================================

export function pTonMinterConfigToCellV2(config: PTonMinterConfigV2): Cell {
    return beginCell()
        .storeUint(config.id ?? 0, 32)
        .storeRef(config.walletCode ?? PTON_WALLET_CODE_v2)
        .storeRef(config.content)
    .endCell();
}
export function pTonWalletConfigToCellV2(config: PTonWalletConfigV2): Cell {
    return beginCell()
        .storeCoins(config.balance)
        .storeAddress(config.ownerAddress)
        .storeAddress(config.minterAddress)
        .endCell();
}

// ====================================================================================================

export class PTonMinterV2 extends PTonMinterAbc<typeof pTonMinterOpCodesV2> {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell; }) {
        super(pTonMinterOpCodesV2, address, init)
    }

    static createFromConfig(config: PTonMinterConfigV2, code: Cell, workchain = 0) {
        return this.createFromConfigBase(config, pTonMinterConfigToCellV2, code, workchain)
    }

    async sendDeployWallet(provider: ContractProvider, via: Sender, opts: {
        ownerAddress: Address,
        excessesAddress?: Address
    }, value?: bigint) {
        await provider.internal(via, {
            value: value ?? toNano("1"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.deployWallet)
                .storeAddress(opts.ownerAddress)
                .storeAddress(opts.excessesAddress || via.address)
                .endCell()
        });
    }
    
    async getVersion(provider: ContractProvider) {
        let ver = await super.getVersion(provider)
        if (ver.major !== 2) throw new Error("this minter is not v2")
        return this.version
    }
}

export class PTonWalletV2 extends PTonWalletAbc<typeof pTonWalletOpcodesV2> {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell; }) {
        super(pTonWalletOpcodesV2, address, init)
    }

    static createFromConfig(config: PTonWalletConfigV2, code: Cell, workchain = 0) {
        return this.createFromConfigBase(config, pTonWalletConfigToCellV2, code, workchain)
    }

    async sendTonTransfer(provider: ContractProvider, via: Sender, opts: {
        tonAmount: bigint,
        refundAddress: Address,
        fwdPayload: Cell | Slice,
        gas: bigint,
    }) {
        if (!opts.gas) throw new Error("gas is 0")

        let msg_builder = beginMessage(this.opCodes.tonTransfer)
            .storeCoins(opts.tonAmount)
            .storeAddress(opts.refundAddress)

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
            value: opts.tonAmount + opts.gas,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg,
        });
    }
}
