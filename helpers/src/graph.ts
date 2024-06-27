import { Address, Cell } from '@ton/core';
import { BlockchainTransaction, SendMessageResult } from '@ton/sandbox';
import '@ton/test-utils';
import { FlatTransaction, flattenTransaction } from '@ton/test-utils';
import fs from 'fs';
import path from "path";
import { fromNanos, toSnakeCase } from './helpers';

export function toGraphMap(obj: { [k: string]: number }): CodesMap {
    // use this to construct opMap or errMap
    let res = new Map<number, string>;
    for (let entry of Object.entries(obj)) {
        res.set(entry[1], toSnakeCase(entry[0]));
    }
    return res;
}

export const BracketType = {
    square: (inp: any) => `["${inp.toString()}"]`,
    diamond: (inp: any) => `{"${inp.toString()}"}`,
    fillet: (inp: any) => `("${inp.toString()}")`,
    rounded: (inp: any) => `(["${inp.toString()}"])`,
    circle: (inp: any) => `(("${inp.toString()}"))`,
    circle2: (inp: any) => `((("${inp.toString()}")))`,
    hex: (inp: any) => `{{"${inp.toString()}"}}`,
    sub: (inp: any) => `[["${inp.toString()}"]]`,
    flag: (inp: any) => `>"${inp.toString()}"]`,
    db: (inp: any) => `[("${inp.toString()}")]`,
    parallelR: (inp: any) => `[/"${inp.toString()}"/]`,
    parallelL: (inp: any) => `[\\"${inp.toString()}"\\]`,
    trapezoidT: (inp: any) => `[/"${inp.toString()}"\\]`,
    trapezoidB: (inp: any) => `[\\"${inp.toString()}"/]`,
} as const;


export type CodesMap = Map<number, string>;
export type Captions = { [k: string]: any; };
export type CaptionHandlerParams = {
    body: Cell,
    opMap?: CodesMap,
    errMap?: CodesMap,
    hideOkValues: boolean,
};
export type CaptionHandler = (params: CaptionHandlerParams) => Captions;

export function hexOpStr(op: number | bigint) {
    return `0x${Number(op).toString(16)}`
}

export function opEntries(obj: { [k: number]: CaptionHandler }): [number, CaptionHandler][] {
    // use this to construct captionsMap from object
    return Object.entries(obj).map((val) => {
        let nKey = Number(val[0]);
        if (isNaN(nKey)) throw new Error("only number keys are allowed in this object");
        return [nKey, val[1]];
    });
}

export type FeeData = {
    computeFee?: bigint,
    storageFee?: bigint,
    totalFwdFee?: bigint,
    inForwardFee?: bigint,
    totalActionFee?: bigint,
};
export type FeeDetails = { [K in keyof FeeData]: boolean };
export type FlatTransactionExtended = FlatTransaction & FeeData;
export function flattenTransactionExtended(tx: BlockchainTransaction) {
    let txFlat = flattenTransaction(tx);
    let description = tx.description;
    let res: FlatTransactionExtended = {
        ...txFlat
    };

    if (description.type === 'generic' && description.computePhase.type === "vm") {
        res.computeFee = description.computePhase.gasFees;
    }
    if (description.type === 'generic' && description.storagePhase) {
        res.storageFee = description.storagePhase.storageFeesCollected;
    }
    if (description.type === 'generic' && description.actionPhase) {
        res.totalFwdFee = description.actionPhase.totalFwdFees ? description.actionPhase.totalFwdFees : undefined;
        res.totalActionFee = description.actionPhase.totalActionFees ? description.actionPhase.totalActionFees : undefined;
    }
    if (tx.inMessage?.info.type === 'internal') {
        res.inForwardFee = tx.inMessage.info.forwardFee;
    }
    return res;

}

export const defaultCaptionMap: Map<number, CaptionHandler> = new Map(opEntries({
    0x178d4519: (params: CaptionHandlerParams) => {
        // internalTransfer
        let sc = params.body.beginParse();
        sc.loadUintBig(32 + 64);
        let amount = sc.loadCoins();
        return {
            amount: fromNanos(amount)
        };
    },
    0x25938561: (params: CaptionHandlerParams) => {
        // swap
        let sc = params.body.beginParse();
        sc.loadUintBig(32 + 64);
        sc.loadAddress();
        let amount = sc.loadCoins() + sc.loadCoins();
        return {
            amount: fromNanos(amount)
        };
    },
    0xf8a7ea5: (params: CaptionHandlerParams) => {
        // transfer
        let res: Captions = {};
        let sc = params.body.beginParse();
        sc.loadUintBig(32 + 64);
        let amount = sc.loadCoins();
        sc.loadMaybeAddress();
        sc.loadMaybeAddress();
        sc.loadUint(1);
        let _fwd = sc.loadCoins();
        if (!params.hideOkValues || _fwd) res.fwdTon = fromNanos(_fwd);
        res.amount = fromNanos(amount);
        try {
            sc.loadUint(1);
            let transferCode = sc.loadUint(32);
            let strCode = params.opMap?.get(transferCode) ?? params.errMap?.get(transferCode);
            res.txCode = `${strCode ?? hexOpStr(transferCode)}`;
        } catch { }
        return res;
    },
    0xf93bb43f: (params: CaptionHandlerParams) => {
        // pay_to
        let res: Captions = {};
        try {
            let sc = params.body.beginParse();
            sc.loadUintBig(32 + 64);
            sc.loadAddress();
            sc.loadAddress();
            let payCode = sc.loadUint(32);
            let strPCode = params.opMap?.get(payCode) ?? hexOpStr(payCode);
            res.pay = `${strPCode}`;
        } catch { }
        return res;
    },
    0x537c5a70: (params: CaptionHandlerParams) => {
        // deposit_ref_fee
        let res: Captions = {};
        try {
            let sc = params.body.beginParse();
            sc.loadUintBig(32 + 64);
            let amount = sc.loadCoins();
            res.amount = fromNanos(amount);
        } catch { }
        return res;

    },
    0x7362d09c: (params: CaptionHandlerParams) => {
        // transfer_notification
        let res: Captions = {};
        try {
            let sc = params.body.beginParse();
            sc.loadUintBig(32 + 64);
            let amount = sc.loadCoins();
            res.amount = fromNanos(amount);
            sc.loadAddress();
            let eBit = sc.loadUint(1);
            let fwdOp = 0;
            if (eBit) {
                fwdOp = sc.loadRef().beginParse().loadUint(32);
            } else {
                fwdOp = sc.loadUint(32);
            }
            if (fwdOp) {
                res.fwdOp = `${params.opMap?.get(fwdOp) ?? hexOpStr(fwdOp)}`;
            }
        } catch { }
        return res;
    },
}));

export type DirectionType = "unidirectional" | "bidirectional";
export type ChartType = "TB" | "LR" | "BT" | "RL";
export type BracketKeysType = keyof typeof BracketType;
export type GraphArgsType = {
    msgResult: SendMessageResult,
    directionType?: DirectionType, // default "bidirectional"
    chartType?: ChartType, // default TB
    output?: string,                // default "build/graph.md"
    addressMap?: Map<string, string>,
    bracketMap?: Map<string, BracketKeysType>,
    captionsMap?: Map<number, CaptionHandler>,
    opMap?: CodesMap,
    errMap?: CodesMap,
    hideOkValues?: boolean,         // default true
    displayIndex?: boolean,         // default true
    displayOp?: boolean,            // default true
    displayValue?: boolean,         // default true
    displayFees?: boolean,          // default true
    displayTokens?: boolean,        // default true
    displayExitCode?: boolean,      // default true
    displayActionResult?: boolean,  // default true
    displayDeploy?: boolean,        // default false
    displayDestroyed?: boolean,     // default true
    displayAborted?: boolean,       // default true
    displaySuccess?: boolean,       // default false
    disableStyles?: boolean,        // default false
    feeDetails?: boolean | FeeDetails,  // default false
    showOrigin?: boolean,           // default false
    colorForward?: string,          // default #ff4747
    colorBackward?: string,         // default #02dbdb
    colorExcess?: string,           // default #0400f0
};

function applyDefaultGraphParams(params: GraphArgsType) {
    return {
        ...params,
        output: params.output                           ?? "build/graph.md",
        hideOkValues: params.hideOkValues               ?? true,
        displayIndex: params.displayIndex               ?? true,
        displayOp: params.displayOp                     ?? true,
        displayValue: params.displayValue               ?? true,
        displayFees: params.displayFees                 ?? true,
        displayTokens: params.displayTokens             ?? true,
        displayExitCode: params.displayExitCode         ?? true,
        displayActionResult: params.displayActionResult ?? true,
        displayDeploy: params.displayDeploy             ?? false,
        displayDestroyed: params.displayDestroyed       ?? true,
        displayAborted: params.displayAborted           ?? true,
        displaySuccess: params.displaySuccess           ?? false,
        disableStyles: params.disableStyles             ?? false,
        feeDetails: params.feeDetails                   ?? false,
        colorForward: params.colorForward               ?? "#ff4747",
        colorBackward: params.colorBackward             ?? "#02dbdb",
        colorExcess: params.colorExcess                 ?? "#0400f0",
        chartType: params.chartType                     ?? "TB",
        showOrigin: params.showOrigin                   ?? false,
        directionType: params.directionType             ?? "bidirectional",
        captionsMap: params.captionsMap ? new Map([...defaultCaptionMap, ...params.captionsMap]) : defaultCaptionMap,
    }
}

export function createMdGraph(params: GraphArgsType) {
    let paramsX = applyDefaultGraphParams(params);
    // ------------------------------
    const getErrorCode = (code: number) => {
        return paramsX.errMap?.get(code) ?? code;
    };
    // ------------------------------
    const getOpCode = (op: number) => {
        return paramsX.opMap?.get(op) ?? op.toString(16);
    };
    // ------------------------------
    let namesRes = "";
    let linkRes = "";
    let styleRes = "";
    const addLink = (link: string) => {
        linkRes += `\t${link}\n`;
    };
    const constructGraph = () => {
        return "```mermaid\nflowchart " + `${paramsX.chartType}\n`
            + namesRes + "\n"
            + linkRes + "\n"
            + (paramsX.disableStyles ? "" : styleRes)
            + "\n```";
    };
    // ------------------------------
    // ------------------------------
    // ------------------------------
    // ------------------------------
    const getBracketKey = (key: string) => {
        return paramsX.bracketMap?.get(key);
    };
    // ------------------------------
    const nameStr = (address: Address | -1, index: number) => {
        const addrStr = address.toString();
        let displayKey: string;
        if (address !== -1) {
            displayKey = paramsX.addressMap?.get(addrStr) ?? addrStr;
        } else {
            displayKey = "external";
        }
        let bracketKey: keyof typeof BracketType = (getBracketKey(addrStr) || getBracketKey(displayKey)) ?? "square";
        return `\tA${index}${BracketType[bracketKey](displayKey)}\n`;
    };
    // ------------------------------
    const internalMap: Map<string, string> = new Map();
    let actorsCnt = 0;
    const mapKey = (address: Address | -1, isTo = false) => {
        const addrStr = address.toString();
        if (
            !internalMap.has(addrStr)
            || (isTo && paramsX.directionType === "unidirectional")
        ) {
            const index = actorsCnt;
            actorsCnt++;
            internalMap.set(addrStr, `A${index}`);
            namesRes += nameStr(address, index);
        }
        return internalMap.get(addrStr) as string;
    };
    // ------------------------------
    // ------------------------------
    // ------------------------------
    const getEntryIndex = (key: string) => {
        // from str "A..."
        return Number(key.slice(1));
    };
    // ------------------------------
    const addStyle = (ind: number, color: string) => {
        styleRes += `\tlinkStyle ${ind} stroke:${color},color:${color}\n`;
    };
    // ------------------------------
    const entryStr = (info: string[], from: string, to: string, arrow: string) => {
        let label = info.join("<br/>");
        return `${from} ${arrow} |${label}|${to}`;
    };
    // ------------------------------
    const createLink = (tx: FlatTransactionExtended, ind: number) => {
        let from = mapKey(tx.from ?? -1);
        let to = mapKey(tx.to as Address, true);

        let arrow = getEntryIndex(from) <= getEntryIndex(to) ? "-->" : "-.->";
        let color = getEntryIndex(from) <= getEntryIndex(to) ? paramsX.colorForward : paramsX.colorBackward;

        let txInfo: string[] = [];
        const addInfo = (label: string, data: any) => { txInfo.push(`${label}: ${data}`) };
        // ------------------------------
        if (paramsX.displayIndex) { addInfo("index", ind) }
        // ------------------------------
        if (paramsX.displayValue && typeof tx.value !== "undefined" ) { addInfo("value", fromNanos(tx.value)) }
        // ------------------------------
        if (paramsX.displayFees && typeof tx.totalFees !== "undefined") {
            if (paramsX.feeDetails) {
                let fees = {
                    computeFee: tx.computeFee,
                    storageFee: tx.storageFee,
                    totalFwdFee: tx.totalFwdFee,
                    inForwardFee: tx.inForwardFee,
                    totalActionFee: tx.totalActionFee,
                };
                if (typeof paramsX.feeDetails !== "boolean") {
                    fees = {
                        computeFee: paramsX.feeDetails.computeFee ? tx.computeFee : undefined,
                        storageFee: paramsX.feeDetails.storageFee ? tx.storageFee : undefined,
                        totalFwdFee: paramsX.feeDetails.totalFwdFee ? tx.totalFwdFee : undefined,
                        inForwardFee: paramsX.feeDetails.inForwardFee ? tx.inForwardFee : undefined,
                        totalActionFee: paramsX.feeDetails.totalActionFee ? tx.totalActionFee : undefined,
                    };
                }
                addInfo("totalFee", fromNanos(tx.totalFees));
                if (fees.computeFee) addInfo("computeFee", fromNanos(fees.computeFee));
                if (fees.storageFee) addInfo("storageFee", fromNanos(fees.storageFee));
                if (fees.totalFwdFee) addInfo("totalFwdFee", fromNanos(fees.totalFwdFee));
                if (fees.inForwardFee) addInfo("inForwardFee", fromNanos(fees.inForwardFee));
                if (fees.totalActionFee) addInfo("totalActionFee", fromNanos(fees.totalActionFee));
            } else {
                addInfo("fees", fromNanos(tx.totalFees));
            }
        }
        // ------------------------------
        if (paramsX.displayOp && typeof tx.op !== "undefined") {
            addInfo("op", getOpCode(tx.op));
            color = tx.op === 0xd53276db ? paramsX.colorExcess : color;
        }
        // ------------------------------
        if (
            paramsX.displayTokens
            && typeof tx.op !== "undefined"
            && typeof tx.body !== "undefined"
        ) {
            let handler = paramsX.captionsMap.get(tx.op);
            if (handler) {
                let captions = handler({
                    body: tx.body,
                    opMap: paramsX.opMap,
                    errMap: paramsX.errMap,
                    hideOkValues: paramsX.hideOkValues
                });
                for (let key in captions) {
                    addInfo(key, captions[key]);
                }
            }
        }
        // ------------------------------
        if (
            paramsX.displayExitCode
            && typeof tx.exitCode !== "undefined"
            && (!paramsX.hideOkValues || tx.exitCode)
        ) { addInfo("exit", getErrorCode(tx.exitCode)) }
        // ------------------------------
        if (
            paramsX.displayActionResult
            && typeof tx.actionResultCode !== "undefined"
            && (!paramsX.hideOkValues || tx.actionResultCode)
        ) { addInfo("action", getErrorCode(tx.actionResultCode)) }
        // ------------------------------
        if (
            paramsX.displayDeploy
            && (!paramsX.hideOkValues || tx.deploy)
        ) { addInfo("deploy", tx.deploy) }
        // ------------------------------
        if (
            paramsX.displayAborted
            && typeof tx.aborted !== "undefined"
            && (!paramsX.hideOkValues || tx.aborted)
        ) { addInfo("abort", tx.aborted) }
        // ------------------------------
        if (
            paramsX.displayDestroyed
            && typeof tx.destroyed !== "undefined"
            && (!paramsX.hideOkValues || tx.destroyed)
        ) { addInfo("destroy", tx.destroyed) }
        // ------------------------------
        if (
            paramsX.displaySuccess
            && typeof tx.success !== "undefined"
            && (!paramsX.hideOkValues || tx.success)
        ) { addInfo("success", tx.success) }
        // ------------------------------
        addStyle(ind, color); 
        return entryStr(txInfo, from, to, arrow);
    };
    // ------------------------------
    // ------------------------------
    // ------------------------------
    let cnt = 0;
    for (let tx of paramsX.msgResult.transactions) {
        let txFlat = flattenTransactionExtended(tx);
        if (typeof txFlat.from === "undefined" && !paramsX.showOrigin) continue;
        let newLink = createLink(txFlat, cnt);
        addLink(newLink);
        cnt++;
    }
    // ------------------------------
    fs.mkdirSync(path.dirname(paramsX.output), { recursive: true });
    fs.writeFileSync(paramsX.output, constructGraph(), "utf-8");
}