import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';
import { JettonWalletContractBase } from '../helpers';

export type JettonWalletConfig = {
    balance: bigint,
    ownerAddress: Address,
    jettonMasterAddress: Address,
};

export function jettonWalletConfigToCell(config: JettonWalletConfig): Cell {
    return beginCell()
        .storeCoins(config.balance)
        .storeAddress(config.ownerAddress)
        .storeAddress(config.jettonMasterAddress)
        .endCell();
}

export const jWalletOpcodes = {
    transfer: 0xf8a7ea5,
    internalTransfer: 0x178d4519,
    burn: 0x595f07bc,
} as const;

export class Wallet extends JettonWalletContractBase<typeof jWalletOpcodes> {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell; }) {
        super(jWalletOpcodes, address, init)
    }

    static createFromConfig(config: JettonWalletConfig, code: Cell, workchain = 0) {
        return this.createFromConfigBase(config, jettonWalletConfigToCell, code, workchain)
    }
}
