import { Blockchain } from "@ton/sandbox";
import { Address, Cell, Contract, ContractProvider, SendMode, Sender, ShardAccount, contractAddress } from "@ton/core";
import { emptyCell } from "../../helpers";

export abstract class CommonContractBase implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell; }) { }

    static createFromAddress<K extends CommonContractBase>(this: new (address: Address, init?: { code: Cell; data: Cell; }) => K, address: Address) {
        return new this(address) as K;
    }

    protected static createFromConfigBase<K extends CommonContractBase, X>(
        this: new (address: Address, init?: { code: Cell; data: Cell; }) => K, 
        config: X, 
        configToCell: (config: X) => Cell, 
        code: Cell, 
        workchain = 0
    ){
        const data = configToCell(config);
        const init = { code, data };
        return new this(contractAddress(workchain, init), init) as K;
    }

    async readShardAccount(blockchain: Blockchain): Promise<ShardAccount> {
        return (await blockchain.getContract(this.address)).account;
    }

    async setShardAccount(blockchain: Blockchain, shardAccount: ShardAccount) {
        await blockchain.setShardAccount(this.address, shardAccount);
    }
    
    async sendEmpty(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: emptyCell(),
        });
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: emptyCell(),
            bounce: false
        });
    }
}