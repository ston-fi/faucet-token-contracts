import { SendMessageResult } from "@ton/sandbox";
import { BracketType } from "../helpers/src/graph";
import { CliConfig, createMdGraph, jMinterOpcodes, jWalletOpcodes, nftMinterOpcodes, nftOpcodes, parseErrors, parseOp, resolvers, stdFtOpCodes, stdNftOpCodes, toGraphMap, tvmErrorCodes } from "../helpers";

export function createMDGraphLocal(params: {
    msgResult: SendMessageResult,
    chartType?: "TB" | "LR" | "BT" | "RL", // default TB
    output?: string,                // default "build/graph.md"
    addressMap?: Map<string, string>,
    bracketMap?: Map<string, keyof typeof BracketType>,
    hideOkValues?: boolean,
    displayValue?: boolean,
    displayTokens?: boolean,
    displayExitCode?: boolean,
    displayFees?: boolean,
    displayActionResult?: boolean,
    displayDeploy?: boolean,
    displayAborted?: boolean,
    displayDestroyed?: boolean,
    displaySuccess?: boolean,
    disableStyles?: boolean,
}) {
    // @ts-ignore
    if (typeof createMDGraphLocal.opMap == 'undefined') {
        // @ts-ignore
        createMDGraphLocal.opMap = toGraphMap({
            ...nftMinterOpcodes,
            ...stdFtOpCodes,
            ...stdNftOpCodes,
            ...nftOpcodes,
            ...jWalletOpcodes,
            ...jMinterOpcodes,
            //...parseOp("contracts/common/op.fc")
        });
    }
    // @ts-ignore
    if (typeof createMDGraphLocal.errorMap == 'undefined') {
        // @ts-ignore
        createMDGraphLocal.errorMap = toGraphMap({
            ...tvmErrorCodes,
            //...parseErrors("contracts/common/errors.fc")
        });
    }

    const details = true

    createMdGraph({
        chartType: params.chartType ?? "TB",
        hideOkValues: params.hideOkValues ?? true,
        displayValue: params.displayValue ?? details,
        displayTokens: params.displayTokens ?? details,
        displayExitCode: params.displayExitCode ?? details,
        displayFees: params.displayFees ?? details,
        displayActionResult: params.displayActionResult ?? details,
        displayAborted: params.displayAborted ?? details,
        displayDeploy: params.displayDeploy ?? false,
        displayDestroyed: params.displayDestroyed ?? false,
        displaySuccess: params.displaySuccess ?? false,
        disableStyles: params.disableStyles ?? false,
        msgResult: params.msgResult,
        output: params.output,
        addressMap: params.addressMap,
        bracketMap: params.bracketMap,
        // @ts-ignore
        opMap: createMDGraphLocal.opMap,
        // @ts-ignore
        errMap: createMDGraphLocal.errorMap,
    });
}


const configParams = {
    minterAddress: resolvers.address,
    metadata: resolvers.meta,
}

export const cliConfig = new CliConfig(configParams, { metadata: true });

