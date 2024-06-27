import { parseAddress } from "./helpers";
import { DEFAULT_PTON_MAINNET_ADDRESS, PTON_MAINNET_ADDRESS_v1, PTON_MAINNET_ADDRESS_v2, PTON_TESTNET_ADDRESS_v2 } from "./wrappers/PTon";

export const tokenAddresses = new Map(Object.entries({
    // project tokens
    ton     : DEFAULT_PTON_MAINNET_ADDRESS,
    pton    : DEFAULT_PTON_MAINNET_ADDRESS,
    ptonv1  : PTON_MAINNET_ADDRESS_v1,
    ptonv2  : PTON_MAINNET_ADDRESS_v2,
    ston    : parseAddress("EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO"),
    gemston : parseAddress("EQBX6K9aXVl3nXINCyPPL86C4ONVmQ8vK360u6dykFKXpHCa"),
    usdt    : parseAddress("EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"),
    jusdt   : parseAddress("EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA"),
    fnz     : parseAddress("EQDCJL0iQHofcBBvFBHdVG233Ri2V4kCNFgfRT-gqAd3Oc86"),
    gram    : parseAddress("EQC47093oX5Xhb0xuk2lCr2RhS8rj-vul61u4W2UH5ORmG_O"),
    anon    : parseAddress("EQDv-yr41_CZ2urg2gfegVfa44PDPjIK9F-MilEDKDUIhlwZ"),
    jetton  : parseAddress("EQAQXlWJvGbbFfE8F3oS8s87lIgdovS455IsWFaRdmJetTon"),
    punk    : parseAddress("EQCdpz6QhJtDtm2s9-krV2ygl45Pwl-KJJCV1-XrP-Xuuxoq"),
    raff    : parseAddress("EQCJbp0kBpPwPoBG-U5C-cWfP_jnksvotGfArPF50Q9Qiv9h"),
    redo    : parseAddress("EQBZ_cafPyDr5KUTs0aNxh0ZTDhkpEZONmLJA2SNGlLm4Cko"),
    web3    : parseAddress("EQBtcL4JA-PdPiUkB8utHcqdaftmUSTqdL8Z1EeXePLti_nK"),
    dfc     : parseAddress("EQD26zcd6Cqpz7WyLKVH8x_cD6D7tBrom6hKcycv8L8hV0GP"),
    tston   : parseAddress("EQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAJav"),
    hton    : parseAddress("EQDPdq8xjAhytYqfGSX8KcFWIReCufsB9Wdg0pLlYSO_h76w"),
    jdoge   : parseAddress("EQCFWfg1ELLRkNQ1VgxCEOYKqLqxAuNJTrUXFXgkag7D2ssH"),
    tong    : parseAddress("EQC0KYVZpwR-dTkPwVRqagH2D31he931R7oUbPIBo_77F97K"),
    sox     : parseAddress("EQBB-EMREJkIHVYG5DPiklOhWPcsCaxjL9HKmgRvuGtz_1lu"),
    jvt     : parseAddress("EQC8FoZMlBcZhZ6Pr9sHGyHzkFv9y2B5X9tN61RvucLRzFZz"),
    mc      : parseAddress("EQCbKMTmEAdSnzsK85LOpaDkDH3HjujEbTePMSeirvEaNq-U"),
    pet     : parseAddress("EQBJOJ2eL_CUFT_0r9meoqjKUwRttC_-NUJyvWQxszVWe1WY"),
    tgram   : parseAddress("EQDRlQ8en7A2zsTuF7SdDOxMlZ_wFw0E7Eow3u9c4pSoe4Tg"),
    up      : parseAddress("EQCvaf0JMrv6BOvPpAgee08uQM_uRpUd__fhA7Nm8twzvbE_"),
    arbuz   : parseAddress("EQAM2KWDp9lN0YvxvfSbI0ryjBXwM70rakpNIHbuETatRWA1"),
    
    // test tokens
    tt1     : parseAddress("EQB1R5vBgbJBZNVkh55XID629E2Xq9MFib3nai9QSkZ2F7X4"),
    tt2     : parseAddress("EQC8JhkQsgAwRpe0lMsr6U11NXWjwgty22gxnRt_pSq4jDmb"),
    tt3     : parseAddress("EQDC_9V2wx9zxreyc2jWC_UlVtNq88aKh9JMEAR_7GKE881Y"),
    tt3_2   : parseAddress("EQAIUIuQjaBbc_X6ltbr50X2SUlPwmjbN4KlaccDY-Zy93kv"),
    psston  : parseAddress("EQDJOKF1ushAlAirhxgBTMvw1Lvv1__IJDj0JuXjBwvgju6L"),
    test    : parseAddress("EQBIp6Peg0E95xpEkRdIZJhLHk3uMgzdxWA8s5GUTFF1ZkzE"),

    // testnet
    testReward  : parseAddress("EQB-sABlgq41W4jvcbxSD81Oh7O12VtAzJ0eXvAYeQNRq4di"),
    testStake   : parseAddress("EQD-bXJFImJ0uWRKfBE674QxWgVxlUo0B7BDLDHT2R3Qlzst"),
    testSton    : parseAddress("EQCH-yP4S3nA_j7K7EIV1QIhVTWMyNJfxeYzacUH76ks2hUF"),
    ptonv2Test    : PTON_TESTNET_ADDRESS_v2
}))

export function parseTokenAddress(inp: string) {
    let minterAddress = tokenAddresses.get(inp) ?? null
    if (minterAddress === null) {
        minterAddress = parseAddress(inp)
    }
    return minterAddress
}