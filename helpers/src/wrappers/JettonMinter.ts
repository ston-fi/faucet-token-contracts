import {
    Address,
    beginCell,
    Cell,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
} from '@ton/core';

import { beginMessage, codeFromString, emptyCell } from "../helpers";
import { JettonMinterContractBase } from './abstract/abcJettonMinter';

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

export const jMinterOpcodes = {
    burnNotification: 0x7bdd97de,
    mint: 21,
    changeAdmin: 3,
    changeContent: 4,
    internalTransfer: 0x178d4519
} as const;

export const jMinterDiscOpcodes = {
    ...jMinterOpcodes,
    provideWalletAddress: 0x2c76b973,
    takeWalletAddress: 0xd1735400,
} as const;

export class JettonMinterContractDiscoverable extends JettonMinterContractBase<typeof jMinterDiscOpcodes> {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell; }) { 
        super(jMinterDiscOpcodes, address, init)
    }
    
    static createFromConfig(config: JettonMinterConfig, code?: Cell, workchain = 0) {
        return this.createFromConfigBase(config, jettonMinterConfigToCell, code ?? DEFAULT_JETTON_MINTER_CODE_DISCOVERABLE, workchain)
    }

    async sendProvideWalletAddress(provider: ContractProvider, via: Sender, opts: {
        value?: bigint,
        ownerAddress: Address,
        includeAddress?: boolean
    }, value?: bigint) {
        value = opts.value ?? value
        if (!value) 
            throw new Error("Message must have value")

        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginMessage(this.opCodes.provideWalletAddress)
                .storeAddress(opts.ownerAddress)
                .storeUint(Number(opts.includeAddress ?? false), 1)
                .endCell()
        });
    }
}

export class JettonMinterContract extends JettonMinterContractBase<typeof jMinterOpcodes> {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell; }) { 
        super(jMinterOpcodes, address, init)
    }

    static createFromConfig(config: JettonMinterConfig, code?: Cell, workchain = 0) {
        return this.createFromConfigBase(config, jettonMinterConfigToCell, code ?? DEFAULT_JETTON_MINTER_CODE, workchain)
    }
}

export const DEFAULT_JETTON_MINTER_CODE              = codeFromString("b5ee9c7241020b010001ed000114ff00f4a413f4bcf2c80b01020162050202037a600403001faf16f6a2687d007d206a6a183faa9040007dadbcf6a2687d007d206a6a183618fc1400b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064fc80383a6465816503e5ffe4e8400202cc07060093dfc142201b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064907c80383a6465816503e5ffe4e83bc00c646582ac678b28027d0109e5b589666664b8fd80403efd9910e38048adf068698180b8d848adf07d201800e98fe99ff6a2687d007d206a6a18400aa9385d47181a9aa8aae382f9702480fd207d006a18106840306b90fd001812881a28217804502a906428027d012c678b666664f6aa7041083deecbef29385d71811a92e001f1811802600271812f82c207f97840a0908002e5143c705f2e049d43001c85004fa0258cf16ccccc9ed5400303515c705f2e049fa403059c85004fa0258cf16ccccc9ed5400fe3603fa00fa40f82854120870542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d05008c705f2e04a12a1035024c85004fa0258cf16ccccc9ed5401fa403020d70b01c3008e1f8210d53276db708010c8cb055003cf1622fa0212cb6acb1fcb3fc98042fb00915be249da0571")
export const DEFAULT_JETTON_MINTER_CODE_DISCOVERABLE = codeFromString("b5ee9c7241020e010002a3000114ff00f4a413f4bcf2c80b01020162050202037a600403001faf16f6a2687d007d206a6a183faa9040007dadbcf6a2687d007d206a6a183618fc1400b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064fc80383a6465816503e5ffe4e8400202cc07060093b3f0508806e0a84026a8280790a009f404b19e2c039e2d99924591960225e801e80196019241f200e0e9919605940f97ff93a0ef003191960ab19e2ca009f4042796d625999992e3f60101f5d906380492f81f000e8698180b8d8492f81f07d207d2018fd0018b8eb90fd0018fd001839d4da0001698fe99ff6a2687d007d206a6a18400aa9385d47199a9a9b1b289a6382f97024817d207d006a18106840306b90fd001812881a282178048a502819e428027d012c678b666664f6aa7041083deecbef29385d40804f48ee036373701fa00fa40f82854120670542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d05006c705f2e04aa1034545c85004fa0258cf16ccccc9ed5401fa403020d70b01c300915be30de082102c76b9735270bae30235373723c003e3023502c0040d0b0a0900428e185124c705f2e049d4304300c85004fa0258cf16ccccc9ed54e05f05840ff2f00034335035c705f2e04903fa403059c85004fa0258cf16ccccc9ed5401fe365f03820898968015a015bcf2e04b02fa40d3003095c821cf16c9916de28210d1735400708018c8cb055005cf1624fa0214cb6a13cb1f14cb3f23fa443070ba8e33f828440370542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d0cf16966c227001cb01e2f4000c000ac98040fb00003e8210d53276db708010c8cb055003cf1622fa0212cb6acb1fcb3fc98042fb00e5760164")


