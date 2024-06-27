import { Address, Contract, OpenedContract } from "@ton/core";
import { NetworkProvider } from '@ton/blueprint';
import * as color from "./color";
import { getExplorerLink } from "@ton/blueprint/dist/utils";
import { fromNanos, sleep } from "./helpers";
import { TonClient4 } from "@ton/ton";
import { JettonMinterContract } from "./wrappers/JettonMinter";
import { JettonContent, JettonData } from "./wrappers/abstract/abcJettonMinter";
import { AsyncReturnType, Optional } from "./types";

export type Explorer = "tonscan" | "tonviewer" | "toncx" | "dton";

export function prettyBalance(balance: bigint | number | null | undefined, tokenData: AsyncReturnType<typeof fetchJettonData>) {
    if (balance === undefined || balance === null) {
        return null
    } else {
        return `${fromNanos(BigInt(balance), tokenData.decimals)} ${tokenData.symbol ? tokenData.symbol : "???"}`
    }
}

export function getExpLink(provider: NetworkProvider, address: Address | null | undefined, explorer?: Explorer) {
    if ((address === undefined) || (address === null)) {
        return null
    } else {
        return getExplorerLink(address.toString(), provider.network(), explorer ?? "tonviewer");
    }
}

export async function getSeqNo(provider: NetworkProvider, address: Address, tries = 4) {
    for (let i = 1; i <= tries; i++) {
        try{
            if (await provider.isContractDeployed(address)) {
                let client = provider.api()
                if (client instanceof TonClient4) {
                    let res = await client.runMethod((await client.getLastBlock()).last.seqno, address, 'seqno');
                    return res.reader.readNumber();
                } else {
                    let res = await client.runMethod(address, 'seqno');
                    return res.stack.readNumber();
                }
        
            } else {
                return 0;
            }
        } catch (e) {
            if (i < tries) {
                color.log(` - <r>Failed to call 'getSeqNo', retrying (${i}/${tries - 1})...`);
                continue
            } else {
                throw e
            }
        }
    }
    return 0
}

export async function waitSeqNoChange(provider: NetworkProvider, target: Address, previousSeqno: number, timeout_sec?: number) {
    let timeout = timeout_sec ?? Math.floor(75)
    if (!timeout)
        throw new Error("timeout must be greater than 0")
    
    color.log(` - <y>Waiting up to <b>${timeout} <y>seconds to confirm transaction`);
    let successFlag = 0;
    for (let attempt = 0; attempt < timeout; attempt++) {
        await sleep(1000);
        const seqnoAfter = await getSeqNo(provider, target);
        if (seqnoAfter > previousSeqno) {
            successFlag = 1;
            break;
        };
    }
    if (successFlag) {
        color.log(` - <g>Sent transaction done successfully`);
        return true;
    } else {
        color.log(` - <r>Failed to confirm transaction was sent successfully`);
        return false;
    }
}
export async function awaitConfirmation(fn: () => Promise<boolean>, timeout_sec?: number) {
    let timeout = timeout_sec ?? Math.floor(75)
    if (!timeout)
        throw new Error("timeout must be greater than 0")

    color.log(` - <y>Waiting up to <b>${timeout} <y>seconds to confirm operation`);
    let successFlag = 0;
    for (let attempt = 0; attempt < timeout; attempt++) {
        await sleep(1000);
        let res = false;
        try {
            res = await fn();
        } catch { }

        if (res) {
            successFlag = 1;
            break;
        }
    }
    if (!successFlag) {
        color.log(` - <r>Error confirming operation`);
        return false;
    }
    return true;
}

export async function getAccountBalance(provider: NetworkProvider, target: Address | OpenedContract<Contract>) {
    if (target instanceof Address) {
        
    } else {
        target = target.address
    }
    let client = provider.api()
    let data
    if (client instanceof TonClient4) {
        data = (await client.getAccountLite((await client.getLastBlock()).last.seqno, target)).account.balance.coins
    } else {
        data = await client.getBalance(target)
    }
    return BigInt(data)
}

export async function fetchJettonData(jetton: OpenedContract<JettonMinterContract>, removeRaw=true): Promise<Optional<JettonContent & JettonData & { decimals : number }, "contentRaw" | "jettonWalletCode" | "content">> {
    const fetchDataNoFail = async (url: string) => {
        try { 
            return (await fetch(url)).json() 
        } catch { 
            color.log(` - <y><bld>WARNING: failed to fetch <b>${url}`)
            return {} 
        }
    }
    
    let res: Optional<JettonContent & JettonData, "contentRaw" | "jettonWalletCode" | "content">
    
    let jData
    try { jData = await jetton.getJettonData() } catch (err) {
        color.log(` - <r>ERROR: could not parse jetton data`)
        throw(err)
    }
    res = {...jData}
    try {
        if (typeof jData.content === "string") {
            res = {
                ...(await fetchDataNoFail(jData.content)), 
                ...jData 
            } 
        } else {
            res = { 
                ...jData.content, 
                ...jData 
            }
            delete res["content"]
            if (res.uri) {
                res = { 
                    ...(await fetchDataNoFail(res.uri)), 
                    ...res 
                }
            }
        }
    } catch {}
    if (removeRaw) {
        delete res["contentRaw"]
        delete res["jettonWalletCode"]
    } 
    if (typeof res.decimals === "undefined") {
        color.log(` - <y><bld>WARNING: using default 9 decimals`)
        res.decimals = 9
    }
    res.decimals = Number(res.decimals)
    // @ts-ignore
    return res
}