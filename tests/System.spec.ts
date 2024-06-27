import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, Dictionary, beginCell, toNano } from '@ton/core';
import { Minter } from '../wrappers/Minter';
import { Wallet } from "../wrappers/Wallet";
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { buildLibFromCell, buildLibs, emptyCell } from '../helpers';
import { createMDGraphLocal } from './helpers';

type SBCtrTreasury = SandboxContract<TreasuryContract>;
type BCWallet = SandboxContract<Wallet>;

// @ts-ignore
BigInt.prototype.toJSON = function () { return this.toString(); };


describe('System', () => {
    let code: { minter: Cell, wallet: Cell },
        admin: SBCtrTreasury,
        alice: SBCtrTreasury,
        bob: SBCtrTreasury,
        aliceWallet: BCWallet,
        bobWallet: BCWallet,
        adminWallet: BCWallet,
        publibs: Cell,
        addressMap: Map<string, string>;


    beforeAll(async () => {
        code = {
            minter: await compile('Minter'),
            wallet: await compile('Wallet')
        };
        publibs = buildLibs(code);

        code = {
            minter: buildLibFromCell(code.minter),
            wallet: buildLibFromCell(code.wallet)
        };
    });

    let blockchain: Blockchain;
    let minter: SandboxContract<Minter>;

    addressMap = new Map();

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        blockchain.libs = publibs;

        admin = await blockchain.treasury('admin');
        alice = await blockchain.treasury('alice');
        bob = await blockchain.treasury('bob');

        minter = blockchain.openContract(Minter.createFromConfig({
            totalSupply: 0,
            adminAddress: admin.address,
            content: beginCell().storeUint(1, 1).storeStringTail("http://localhost").endCell(),
            jettonWalletCode: code.wallet
        }, code.minter));

        const deployResult = await minter.sendDeploy(admin.getSender(), toNano('0.05'));
        expect(deployResult.transactions).toHaveTransaction({
            from: admin.address,
            to: minter.address,
            deploy: true,
        });

        aliceWallet = blockchain.openContract(Wallet.createFromAddress(await minter.getWalletAddress(alice.address)));
        bobWallet = blockchain.openContract(Wallet.createFromAddress(await minter.getWalletAddress(bob.address)));
        adminWallet = blockchain.openContract(Wallet.createFromAddress(await minter.getWalletAddress(admin.address)));
        addressMap.set(aliceWallet.address.toString(), `aliceWallet`);
        addressMap.set(bobWallet.address.toString(), `bobWallet`);
        addressMap.set(adminWallet.address.toString(), `adminWallet`);
        addressMap.set(minter.address.toString(), `minter`);
        addressMap.set(admin.address.toString(), `admin`);
        addressMap.set(alice.address.toString(), `alice`);
        addressMap.set(bob.address.toString(), `bob`);

        // fill contract with some balance to make all tx cheaper
        // otherwise, first txs will be more expansive
        await aliceWallet.sendDeploy(admin.getSender(), toNano("0.1"));
        await bobWallet.sendDeploy(admin.getSender(), toNano("0.1"));
        await adminWallet.sendDeploy(admin.getSender(), toNano("0.1"));
    });

    describe('Mint', () => {
        it('should mint', async () => {
            const minterDataBefore = await minter.getJettonData();
            expect(minterDataBefore.totalSupply).toBe(toNano("0"));

            const mintResult = await minter.sendMintJettons(alice.getSender());
            const minterDataAfter = await minter.getJettonData();
            expect(minterDataAfter.totalSupply).toBe(toNano("10"));

            const aliceJettonWalletData = await aliceWallet.getWalletData();
            expect(aliceJettonWalletData.balance).toBe(toNano("10"));
        });
    });

    describe('Burns', () => {
        beforeEach(async () => {
            const mintResult = await minter.sendMintJettons(admin.getSender());
        });

        it('should burn (no response address)', async () => {
            const adminJettonWalletDataBefore = await adminWallet.getWalletData();
            expect(adminJettonWalletDataBefore.balance).toBe(toNano("10"));

            const minterDataBefore = await minter.getJettonData();
            expect(minterDataBefore.totalSupply).toBe(toNano("10"));

            const burnResult = await adminWallet.sendBurn(admin.getSender(), {
                jettonAmount: toNano("1"),
                responseAddress: null
            }, toNano("1"));

            createMDGraphLocal({
                msgResult: burnResult,
                addressMap: addressMap,
                output: "build/burn.md"
            });

            const adminJettonWalletDataAfter = await adminWallet.getWalletData();
            expect(adminJettonWalletDataAfter.balance).toBe(toNano("9"));

            const minterDataAfter = await minter.getJettonData();
            expect(minterDataAfter.totalSupply).toBe(toNano("9"));
        });

        it('should burn (with response address)', async () => {
            const adminJettonWalletDataBefore = await adminWallet.getWalletData();
            expect(adminJettonWalletDataBefore.balance).toBe(toNano("10"));

            const minterDataBefore = await minter.getJettonData();
            expect(minterDataBefore.totalSupply).toBe(toNano("10"));

            const burnResult = await adminWallet.sendBurn(admin.getSender(), {
                jettonAmount: toNano("1"),
                responseAddress: adminWallet.address
            }, toNano("1"));

            createMDGraphLocal({
                msgResult: burnResult,
                addressMap: addressMap,
                output: "build/burn_wresponse.md"
            });

            const adminJettonWalletDataAfter = await adminWallet.getWalletData();
            expect(adminJettonWalletDataAfter.balance).toBe(toNano("9"));

            const minterDataAfter = await minter.getJettonData();
            expect(minterDataAfter.totalSupply).toBe(toNano("9"));
        });
    });
    describe('Transfers', () => {
        beforeEach(async () => {
            const mintResult = await minter.sendMintJettons(admin.getSender());
        });

        it('should transfer (no excesses & no notification)', async () => {
            const transferResult = await adminWallet.sendTransfer(admin.getSender(), {
                toAddress: bob.address,
                value: toNano("1"),
                jettonAmount: toNano("1"),
                fwdAmount: toNano("0"),
                fwdPayload: emptyCell(),
                responseAddress: null
            });

            createMDGraphLocal({
                msgResult: transferResult,
                addressMap: addressMap,
                output: "build/transfer.md"
            });

            const adminWalletData = await adminWallet.getWalletData();
            expect(adminWalletData.balance).toBe(toNano("9"));

            const bobWalletData = await bobWallet.getWalletData();
            expect(bobWalletData.balance).toBe(toNano("1"));
        });


        it('should transfer (with excesses & no notification)', async () => {
            const transferResult = await adminWallet.sendTransfer(admin.getSender(), {
                toAddress: bob.address,
                value: toNano("1"),
                jettonAmount: toNano("1"),
                fwdAmount: toNano("0"),
                fwdPayload: emptyCell(),
                responseAddress: admin.address
            });

            createMDGraphLocal({
                msgResult: transferResult,
                addressMap: addressMap,
                output: "build/transfer_wexcesses.md"
            });

            const bobWalletData = await bobWallet.getWalletData();
            expect(bobWalletData.balance).toBe(toNano("1"));
        });

        it('should transfer (no excesses & with notification)', async () => {
            const transferResult = await adminWallet.sendTransfer(admin.getSender(), {
                toAddress: bob.address,
                value: toNano("1"),
                jettonAmount: toNano("1"),
                fwdAmount: toNano("0.9"),
                fwdPayload: beginCell().storeUint(0, 32).endCell(),
                responseAddress: null
            });

            createMDGraphLocal({
                msgResult: transferResult,
                addressMap: addressMap,
                output: "build/transfer_wnotification.md"
            });

            const bobWalletData = await bobWallet.getWalletData();
            expect(bobWalletData.balance).toBe(toNano("1"));
        });

        it('should transfer (no excesses & with notification)', async () => {
            const transferResult = await adminWallet.sendTransfer(admin.getSender(), {
                toAddress: bob.address,
                value: toNano("1"),
                jettonAmount: toNano("1"),
                fwdAmount: toNano("0.9"),
                fwdPayload: beginCell().storeUint(0, 32).endCell(),
                responseAddress: admin.address
            });

            createMDGraphLocal({
                msgResult: transferResult,
                addressMap: addressMap,
                output: "build/transfer_wexcesses_wnotification.md"
            });

            const bobWalletData = await bobWallet.getWalletData();
            expect(bobWalletData.balance).toBe(toNano("1"));
        });

    });

});
