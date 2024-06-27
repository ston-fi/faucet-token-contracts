import { Cell, Builder, beginCell, Address, Slice, OpenedContract, toNano } from "@ton/core";
import { compile } from '@ton/blueprint';
import fs from 'fs';
import path from 'path';
import * as color from "./color";
import { SandboxContract } from "@ton/sandbox";
import { JettonWalletContract } from "./wrappers/JettonWallet";
const prompt = require('prompt-sync')({
    sigint: true
});

const a_table = "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D";
const b_table = a_table.split(' ').map(function (s) { return parseInt(s, 16); });
export function crc32(str: string) {
    let crc = -1;
    for (let i = 0, iTop = str.length; i < iTop; i++) {
        crc = (crc >>> 8) ^ b_table[(crc ^ str.charCodeAt(i)) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
};

export function prettyFees(fee: number | bigint | null | undefined) {
    if (fee === undefined || fee === null) {
        return null
    } else {
        return `${fromNanos(BigInt(fee), 2)}%`
    }
}

export function prettyVersion(version: { major: number, minor: number, dev: string } | null | undefined) {
    if (version === undefined || version === null) {
        return null
    } else {
        return `v${version.major}.${version.minor}-${version.dev}`
    }
}

export function dateFromSec(seconds: number | bigint | null | undefined): Date | null {
    if (seconds === undefined || seconds === null) {
        return null
    } else {
        return new Date(Number(seconds) * 1000)
    }
}

export function nowSec(): number {
    return Math.floor(Date.now() / 1000)
}

export function fromNowSec(seconds: number | bigint): number {
    return nowSec() + Number(seconds)
}

export function dateFromNowSec(seconds: number | bigint): Date {
    return new Date(Date.now() + Number(seconds) * 1000)
}

export function rndBigInt32(): bigint {
    return BigInt(Math.floor(Math.random() * Math.pow(2, 31)))
}

export function beginMessage(op: bigint | number | string): Builder {
    return beginCell()
        .storeUint(typeof op == "string" ? crc32(op) : op, 32)
        .storeUint(BigInt(Math.floor(Math.random() * Math.pow(2, 31))), 64);
}

export function emptyCell(): Cell {
    return beginCell().endCell();
}

export function stringCell(data: string): Cell {
    return beginCell().storeStringTail(data).endCell();
}

export function codeFromString(code: string): Cell {
    return Cell.fromBoc(Buffer.from(code, 'hex'))[0];
}

export function cellFromStrFile(filePath: string) {
    let strData = fs.readFileSync(filePath, 'utf8');
    return codeFromString(strData);
}

export function cellToBocStr(cell: Cell, filePath = "") {
    let res = cell.toBoc().toString("hex");
    if (filePath) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, res, "utf-8");
    }
    return res;
}

export function padRawHexAddress(addressHex: string) {
    return `${'0'.repeat(64)}${addressHex}`.slice(-64);
}

export function rawNumberToAddress(address: string | bigint, workchain = 0) {
    if (typeof address === "string") {
        return Address.parseRaw(`${workchain}:${padRawHexAddress(address)}`);
    } else {
        return Address.parseRaw(`${workchain}:${padRawHexAddress(BigInt(address).toString(16))}`);
    }
}

export function getContractCode(contract: string): Cell {
    let tmp: string;
    try {
        tmp = JSON.parse(fs.readFileSync(`build/${contract}.compiled.json`, 'utf-8')).hex as string;
    } catch {
        let msg = color.colorText(`<bld><r>Error: build data for <b>'${contract}' <r>cannot be found, you need to build it first`);
        throw new Error(msg[0]);
    }
    return codeFromString(tmp);
}

export async function compileX(contract: string, params?: {
    noSave?: boolean,
    cells?: boolean,
    base64?: boolean,
    hex?: boolean
}): Promise<Cell> {
    const artifact = await compile(contract);

    if (!params?.noSave) {
        fs.mkdirSync("build", { recursive: true });
        let data: {
            hex?: string,
            base64?: string,
        } = {}
        if (params?.cells) {
            let cells = artifact.toString()
            fs.writeFileSync(`build/${contract}.cells.compiled.txt`, artifact.toString(), "utf-8");
        }
        if (params?.base64) {
            data.base64 = artifact.toBoc().toString("base64")
        }
        if (params?.hex ?? true) {
            data.hex = artifact.toBoc().toString('hex')
        }
        fs.writeFileSync(`build/${contract}.compiled.json`, JSON.stringify(data, null, 4));
    }
    return artifact;
}

export function isBnArray(inp: Array<bigint> | Array<number>): inp is Array<bigint> {
    // @ts-ignore
    if (inp.every((val: any) => typeof val === "bigint")) {
        return true;
    } else {
        return false;
    }

}

export function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseAddress(inp: string): Address {
    if (inp.includes(":")) {
        return Address.parseRaw(inp);
    } else {
        return Address.parseFriendly(inp).address;
    }
}

export function toRevStr(st: any) {
    return [...st.toString()].reverse().join("");
}

export const DAY_IN_SECONDS = 3600 * 24;
export const MONTH_IN_SECONDS = 2629800;

export enum Flags {
    bounce = 0x18,
    noBounce = 0x10,
}

export function createInternalMsgCell(params: {
    to: Address,
    amount: bigint,
    payload?: Cell | Slice,
    stateInit?: Cell,
    flag?: Flags;
}) {

    let msg = beginCell()
        .storeUint(params.flag ?? Flags.bounce, 6)
        .storeAddress(params.to)
        .storeCoins(params.amount)
        .storeUint((params.payload instanceof Cell ? 1 : 0) + (params.stateInit ? 6 : 0), 107 + (params.stateInit ? 1 : 0));

    if (params.stateInit) {
        msg = msg.storeRef(params.stateInit);
    }

    if (typeof params.payload !== "undefined") {
        if (params.payload instanceof Cell) {
            msg = msg.storeRef(params.payload);
        } else {
            msg = msg.storeSlice(params.payload);
        }
    }
    return msg.endCell();
}

export function fromNanos(val: bigint, decimals = 9) {
    const toRevStr = (st: any) => {
        return [...st.toString()].reverse().join("");
    };
    let revVal = toRevStr(val);
    let deci = (toRevStr(revVal.slice(0, decimals)) || "0").padStart(decimals, "0");
    let main = toRevStr(revVal.slice(decimals)) || "0";
    return `${main}.${deci}`;
}

export function isBnOrNanoStr(inp: string) {
    try { BigInt(inp) } catch {
        try { toNano(inp) } catch {
            return false
        }
    }
    return true
}

export function toSnakeCase(str: string) {
    // @ts-ignore
    return str && str
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .map(x => x.toLowerCase())
        .join('_');
}

export function divUp(val1: bigint, val2: bigint) {
    return val1 / val2 + (val1 % val2 === 0n ? 0n : 1n);
}
export function maxBigint(...inp: bigint[]): bigint {
    return inp.reduce((a, b) => b > a ? b : a);
}

export async function getWalletBalance(wallet: SandboxContract<JettonWalletContract> | OpenedContract<JettonWalletContract>) {
    try {
        return (await wallet.getWalletData()).balance;
    } catch {
        return 0n;
    }
}

export function findArgs(array: string[], args: string[] | string) {
    args = typeof args === "string" ? [args.toLowerCase()] : args.map(element => element.toLowerCase())
    array = array.map(element => element.toLowerCase())
    let firstFoundPos = -1;
    for (let arg of args) {
        firstFoundPos = array.findIndex((el) => el === arg)
        if (firstFoundPos !== -1) {
            break
        }
    }
    if (firstFoundPos === -1) {
        throw Error("Cannot find specified args in array")
    }
    return firstFoundPos
}

export function isArgPresent(array: string[], arg: string) {
    try { findArgs(array, arg) } catch { return false }
    return true
}

export function waitConfirm(msg? : string) {
    prompt(msg ?? "> Press Enter to confirm (^C for cancel)")
}

export const HOLE_ADDRESS = parseAddress("EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c")

export function isHole(addr: Address | null) {
    if (addr === null) {
        return false
    } else {
        return HOLE_ADDRESS.toString() === addr.toString()
    }
}

export function parseVersion(): [number, number, number, string] {
    try {
        let data: { version: string } = JSON.parse(fs.readFileSync("package.json", 'utf8'));
        let num = data.version.split(".")
        let sub = data.version.split("-")
        let dev = sub.length > 1 
            ? sub[1] 
            : Number(num[2]) === 0 
                ? "release" 
                : `patch${num[2]}` 


        return [Number(num[0]), Number(num[1]), Number(num[2]), dev]
    } catch {
        throw new Error("Could not parse version, example: '1.0.0-beta1.0'")
    }
}

export function toCoins(src: number | string | bigint, decimals = 9) {
    if (decimals <= 9) {
        return toNano(src) / 10n ** BigInt(9 - decimals)
    } else {
        if (typeof src === "string") {
            let parts = src.split(".")
            let deci = parts[1] ? parts[1] : ""
            if (deci.length > decimals) {
                throw new Error("too many decimals in source")
            }
            deci = deci.padEnd(decimals, "0")
            return BigInt(`${parts[0]}${deci}`)
        } else {
            return toNano(src) * 10n ** BigInt(decimals - 9)
        }
    }
}

export function fDate(seconds: number | bigint) {
    seconds = Number(seconds)
    let d = new Date(seconds * 1000)
    return `${Math.floor(seconds / 86400)}d` + d.toISOString().substring(11, 19)
}