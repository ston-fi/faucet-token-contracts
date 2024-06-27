import { Config, CustomNetwork } from '@ton/blueprint';
import 'dotenv/config';

type TypeKeyType = CustomNetwork['type'];
type VersionKeyType = CustomNetwork['version'];
function isTypeKeyType(inpType: any): inpType is TypeKeyType {
    let res = (inpType === 'mainnet') || (inpType === 'testnet') || (inpType === 'custom') || (inpType === undefined)
    return res
}
function isVerKeyType(inpType: any): inpType is VersionKeyType {
    let res = (inpType === 'v2') || (inpType === 'v4') || (inpType === undefined);
    return res
}

let network: CustomNetwork | undefined = undefined
if (typeof process.env["ENDPOINT_URL"] !== "undefined") {

    let eType = process.env["ENDPOINT_TYPE"]?.toLocaleLowerCase() ?? "mainnet"
    let eVer = process.env["ENDPOINT_VERSION"]?.toLocaleLowerCase() ?? "v4"
    let eKey = process.env["ENDPOINT_KEY"]

    if (isTypeKeyType(eType) && isVerKeyType(eVer)) {
        let url = process.env["ENDPOINT_URL"]
        if ((eVer === "v2") && (url.slice(-1) !== "/")) {
            url += "/"
        }
        if ((eVer === "v4") && (url.slice(-1) === "/")) {
            url = url.slice(0, -1)
        }
        network = {
            endpoint: url,
            type: eType,
            version: eVer,
            key: eKey
        }
    }
}

export const config: Config = {
    network: network
};
