import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, Cell, beginCell, toNano } from '@ton/core';
import '@ton/test-utils';
import { Flags, beginMessage, cellFromStrFile, cellToBocStr, codeFromString, crc32, createInternalMsgCell, divUp, emptyCell, fDate, findArgs, fromNanos, getContractCode, getWalletBalance, isArgPresent, isBnArray, isBnOrNanoStr, maxBigint, padRawHexAddress, parseAddress, rawNumberToAddress, stringCell, toCoins, toRevStr, toSnakeCase } from '../src/helpers';
import fs from 'fs';
import { metadataCell, onchainMetadata } from '../src/wrappers/abstract/abcJettonMinter';
import { DEFAULT_JETTON_MINTER_CODE, JettonMinterContract } from '../src/wrappers/JettonMinter';
import { DEFAULT_JETTON_WALLET_CODE, JettonWalletContract } from '../src/wrappers/JettonWallet';
import * as parser from "../src/parser/confParser";

describe('Helpers', () => {


    beforeAll(async () => {

    });


    beforeEach(async () => {

    });

    it('should parse configs', async () => {

        const entries = parser.parse(`;; project OPs
const op::mint_nft = "mint_nft"c;  ;; 0xbba6cbca
const op::get_storage_data = "get_storage_data"c; ;; 0x5b88e5cc
const op::report_storage_data = "report_storage_data"c; ;; 0xaab4a8ef

const op::send_raw_msg = "send_raw_msg"c; ;; 0xbc2d127b

;; exit codes`);
        expect(entries).not.toBe([])

        const entries2 = parser.parse(`const op::ton_transfer    = "ton_transfer query_id:uint64 ton_amount:Coins refund_address:MsgAddress forward_payload:(Either Cell ^Cell) = InternalMsgBody"c & 0x7fffffff;
const op::reset_gas       = "reset_gas query_id:uint64 = InternalMsgBody"c & 0x7fffffff; ;; test`);
        expect(entries2).not.toBe([])

        const entries3 = parser.parse(`const error::insufficient_gas = 83;
const error::invalid_address = 84;
const error::low_amount = 87;
const error::invalid_amount = 89;
const error::wrong_workchain = 85;
const error::invalid_body = 90; ;; test

const error::wrong_op = 0xFFFF;`);
        expect(entries3).not.toBe([])
    });

    it('should test crc32', async () => {
        let res = crc32("test")
        expect(res).toEqual(0xd87f7e0c)
    });

    it('should test beginMessage', async () => {
        let res = beginMessage(123).endCell()
        let ds = res.beginParse()
        expect(ds.loadUint(32)).toEqual(123)
        ds.loadUint(64)

        res = beginMessage(123n).endCell()
        ds = res.beginParse()
        expect(ds.loadUint(32)).toEqual(123)
        ds.loadUint(64)

        res = beginMessage("test").endCell()
        ds = res.beginParse()
        expect(ds.loadUint(32)).toEqual(0xd87f7e0c)
        ds.loadUint(64)

    });

    it('should test emptyCell', async () => {
        let res = emptyCell()
        expect(res.equals(beginCell().endCell())).toBeTruthy()
    });

    it('should test stringCell', async () => {
        let res = stringCell("test")
        expect(res.beginParse().loadStringTail()).toEqual("test")
    });

    it('should test codeFromString', async () => {
        let res = codeFromString("b5ee9c7241020b010001ed000114ff00f4a413f4bcf2c80b01020162050202037a600403001faf16f6a2687d007d206a6a183faa9040007dadbcf6a2687d007d206a6a183618fc1400b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064fc80383a6465816503e5ffe4e8400202cc07060093dfc142201b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064907c80383a6465816503e5ffe4e83bc00c646582ac678b28027d0109e5b589666664b8fd80403efd9910e38048adf068698180b8d848adf07d201800e98fe99ff6a2687d007d206a6a18400aa9385d47181a9aa8aae382f9702480fd207d006a18106840306b90fd001812881a28217804502a906428027d012c678b666664f6aa7041083deecbef29385d71811a92e001f1811802600271812f82c207f97840a0908002e5143c705f2e049d43001c85004fa0258cf16ccccc9ed5400303515c705f2e049fa403059c85004fa0258cf16ccccc9ed5400fe3603fa00fa40f82854120870542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d05008c705f2e04a12a1035024c85004fa0258cf16ccccc9ed5401fa403020d70b01c3008e1f8210d53276db708010c8cb055003cf1622fa0212cb6acb1fcb3fc98042fb00915be249da0571")
    });

    it('should test cellFromStrFile', async () => {
        let boc = "b5ee9c7241020b010001ed000114ff00f4a413f4bcf2c80b01020162050202037a600403001faf16f6a2687d007d206a6a183faa9040007dadbcf6a2687d007d206a6a183618fc1400b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064fc80383a6465816503e5ffe4e8400202cc07060093dfc142201b82a1009aa0a01e428027d012c678b00e78b666491646580897a007a00658064907c80383a6465816503e5ffe4e83bc00c646582ac678b28027d0109e5b589666664b8fd80403efd9910e38048adf068698180b8d848adf07d201800e98fe99ff6a2687d007d206a6a18400aa9385d47181a9aa8aae382f9702480fd207d006a18106840306b90fd001812881a28217804502a906428027d012c678b666664f6aa7041083deecbef29385d71811a92e001f1811802600271812f82c207f97840a0908002e5143c705f2e049d43001c85004fa0258cf16ccccc9ed5400303515c705f2e049fa403059c85004fa0258cf16ccccc9ed5400fe3603fa00fa40f82854120870542013541403c85004fa0258cf1601cf16ccc922c8cb0112f400f400cb00c9f9007074c8cb02ca07cbffc9d05008c705f2e04a12a1035024c85004fa0258cf16ccccc9ed5401fa403020d70b01c3008e1f8210d53276db708010c8cb055003cf1622fa0212cb6acb1fcb3fc98042fb00915be249da0571"
        fs.mkdirSync("build", { recursive: true });
        fs.writeFileSync("build/_test_cellFromStrFile.txt", boc)
        let res = cellFromStrFile("build/_test_cellFromStrFile.txt")
        expect(res.equals(Cell.fromBoc(Buffer.from(boc, 'hex'))[0])).toBeTruthy()
    });

    it('should test cellToBocStr', async () => {
        let testCell = beginCell().storeUint(1, 32).endCell()
        let boc = cellToBocStr(testCell, "build/_test_cellToBocStr.txt")
        expect(boc).toEqual("b5ee9c7241010101000600000800000001e083c4fd")
        let fromfile = fs.readFileSync("build/_test_cellToBocStr.txt", 'utf8')
        expect(fromfile).toEqual("b5ee9c7241010101000600000800000001e083c4fd")
    });

    it('should test padRawHexAddress', async () => {
        let res = padRawHexAddress("test")
        expect(res.length).toEqual(64)
        expect(res.slice(0, 59)).toEqual('0'.repeat(59))
    });

    it('should test rawNumberToAddress', async () => {
        const addNum = 58566993766868769212656760660217770086772996216000848381990082503625461479934n
        const addr = Address.parseFriendly("EQCBe75nEstU02_NyTS9Hu8rkZEfkDYsD5NTaS3NMSg5_krj").address
        expect(rawNumberToAddress(addNum).toString()).toEqual(addr.toString())
    });

    it('should test getContractCode', async () => {
        let boc = "b5ee9c7241010101000600000800000001e083c4fd"
        fs.mkdirSync("build", { recursive: true });
        fs.writeFileSync(`build/_test_getContractCode.compiled.json`, JSON.stringify({
            hex: boc,
        }));
        let code = getContractCode("_test_getContractCode")
        expect(code.equals(Cell.fromBoc(Buffer.from(boc, 'hex'))[0]))

    });

    it('should test isBnArray', async () => {
        let arr1 = [1n, 2n]
        expect(isBnArray(arr1)).toBeTruthy()
        let arr2 = [1, 2]
        expect(isBnArray(arr2)).toBeFalsy()
        let arr3 = [1n, 2]
        // @ts-ignore
        expect(isBnArray(arr3)).toBeFalsy()
    });

    it('should test parseAddress', async () => {
        parseAddress("kQCgol0_IYwBpZ-ddjxPrDOIQQSmhDR2vXvr6zYHA4VhWXI_")
        parseAddress("0QCgol0_IYwBpZ-ddjxPrDOIQQSmhDR2vXvr6zYHA4VhWS_6")
        parseAddress("UQAO9JsDEbOjnb8AZRyxNHiODjVeAvgR2n03T0utYgkpx-K0")
        parseAddress("EQCBe75nEstU02_NyTS9Hu8rkZEfkDYsD5NTaS3NMSg5_krj")
        parseAddress("0:a8641676cfd02edddcc334d8bc5e407186e21a9da0f511bdbfa05444610cb720")
        parseAddress("-1:a8641676cfd02edddcc334d8bc5e407186e21a9da0f511bdbfa05444610cb720")
    });

    it('should test toRevStr', async () => {
        let st = "test1234"
        expect(toRevStr(st)).toEqual("4321tset")
    });

    it('should test createInternalMsgCell', async () => {
        let addr1 = parseAddress("EQCBe75nEstU02_NyTS9Hu8rkZEfkDYsD5NTaS3NMSg5_krj")

        let msg = createInternalMsgCell({
            to: addr1,
            amount: 0n,
            flag: Flags.bounce
        })
        let ds = msg.beginParse()
        expect(ds.loadUint(6)).toEqual(Flags.bounce)
        expect(ds.loadAddress().toString()).toEqual(addr1.toString())
        expect(ds.loadCoins()).toEqual(0n)
        expect(ds.loadUint(107)).toEqual(0)
        // --------
        msg = createInternalMsgCell({
            to: addr1,
            amount: toNano(11),
            flag: Flags.noBounce,
            payload: beginCell().storeUint(123, 32).endCell()
        })
        ds = msg.beginParse()
        expect(ds.loadUint(6)).toEqual(Flags.noBounce)
        expect(ds.loadAddress().toString()).toEqual(addr1.toString())
        expect(ds.loadCoins()).toEqual(toNano(11))
        expect(ds.loadUint(107)).toEqual(1)
        let pl = ds.loadRef().beginParse()
        expect(pl.loadUint(32)).toEqual(123)
        // --------
        msg = createInternalMsgCell({
            to: addr1,
            amount: 0n,
            payload: beginCell().storeUint(123, 32).endCell().beginParse()
        })
        ds = msg.beginParse()
        expect(ds.loadUint(6)).toEqual(Flags.bounce)
        expect(ds.loadAddress().toString()).toEqual(addr1.toString())
        expect(ds.loadCoins()).toEqual(0n)
        expect(ds.loadUint(107)).toEqual(0)
        expect(ds.loadUint(32)).toEqual(123)
        // --------
        let boc = Cell.fromBoc(Buffer.from("b5ee9c7241010101000600000800000001e083c4fd", 'hex'))[0]
        msg = createInternalMsgCell({
            to: addr1,
            amount: 0n,
            payload: beginCell().storeUint(123, 32).endCell(),
            stateInit: boc
        })
        ds = msg.beginParse()
        expect(ds.loadUint(6)).toEqual(Flags.bounce)
        expect(ds.loadAddress().toString()).toEqual(addr1.toString())
        expect(ds.loadCoins()).toEqual(0n)
        expect(ds.loadUint(108)).toEqual(7)
        expect(ds.loadRef().equals(boc)).toBeTruthy()
        pl = ds.loadRef().beginParse()
        expect(pl.loadUint(32)).toEqual(123)

    });

    it('should test fromNanos', async () => {
        let res = fromNanos(1_200_000_007n)
        expect(res).toEqual("1.200000007")
        res = fromNanos(1_200_000_007n, 12)
        expect(res).toEqual("0.001200000007")
        res = fromNanos(1_200_000_007n, 3)
        expect(res).toEqual("1200000.007")
    });

    it('should test toSnakeCase', async () => {
        expect(toSnakeCase("testTest")).toEqual("test_test")
        expect(toSnakeCase("TestTest")).toEqual("test_test")
    });

    it('should test divUp', async () => {
        expect(divUp(5n, 2n)).toEqual(3n)
    });

    it('should test maxBigint', async () => {
        let arr = [1n, 2n, 666n, 111n, 0n]
        expect(maxBigint(...arr)).toEqual(666n)
    });

    it('should test getWalletBalance', async () => {

        let blockchain = await Blockchain.create();
        let deployer = await blockchain.treasury('deployer');

        const config = {
            totalSupply: 0,
            adminAddress: deployer.address,
            content: metadataCell(onchainMetadata({
                name: "test",
            })),
            jettonWalletCode: DEFAULT_JETTON_WALLET_CODE
        };
        const minter = blockchain.openContract(JettonMinterContract.createFromConfig(config, DEFAULT_JETTON_MINTER_CODE));
        await minter.sendDeploy(deployer.getSender(), toNano('0.05'));
        await minter.sendMint(deployer.getSender(), {
            value: toNano(2),
            toAddress: deployer.address,
            fwdAmount: toNano(1),
            masterMsg: {
                jettonAmount: toNano(123),
                jettonMinterAddress: minter.address,
            }
        });
        let wallet = blockchain.openContract(JettonWalletContract.createFromAddress(await minter.getWalletAddress(deployer.address)))
        let balance = await getWalletBalance(wallet)
        expect(balance).toEqual(toNano(123))

    });

    it('should test findArgs', async () => {
        let testArr = [
            "123",
            "456",
            "test1",
            "test2",
            "789"
        ]
        let ind = findArgs(testArr, ["test1"])
        expect(ind).toEqual(2)
    });

    it('should test isArgPresent', async () => {
        let testArr = [
            "123",
            "456",
            "test1",
            "test2",
            "789"
        ]
        let f1 = isArgPresent(testArr, "test1")
        expect(f1).toBeTruthy()
        f1 = isArgPresent(testArr, "qwerty")
        expect(f1).toBeFalsy()
    });

    it('should test isBnOrNanoStr', async () => {
        expect(isBnOrNanoStr("1")).toBeTruthy()
        expect(isBnOrNanoStr("0.000000001")).toBeTruthy()
        expect(isBnOrNanoStr("0.0000000001")).toBeFalsy()
    });

    it('should test toCoins', async () => {
        expect(toCoins("123.123456789")).toEqual(toNano("123.123456789"))
        expect(toCoins(1)).toEqual(1000000000n)
        expect(toCoins(1, 1)).toEqual(10n)
        expect(toCoins(1, 15)).toEqual(1000000000000000n)
        expect(toCoins("123.12", 2)).toEqual(12312n)
        expect(toCoins("1.1245", 2)).toEqual(112n)
        expect(toCoins("1.123456789123456", 15)).toEqual(1123456789123456n)
        expect(() => toCoins("1.123456789123456789", 15)).toThrow()
    });

    it('should test fDate', async () => {
        expect(fDate(3600 * 24 * 4 + 3600 * 7 + 60 * 23 + 7)).toEqual("4d07:23:07")
        expect(fDate(1)).toEqual("0d00:00:01")
        expect(fDate(3600 * 24)).toEqual("1d00:00:00")
    });

});

