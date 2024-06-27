import { Address } from '@ton/core';
import fs from 'fs';
import path from 'path';
import { parseAddress } from "./helpers";
import { JettonContent } from "./wrappers/abstract/abcJettonMinter";
import util from "util"
import { NullableObj } from "./types";

const resolveString = (inp: string | undefined) => {
    if (typeof inp === "undefined") {
        return null;
    } else {
        return inp.toString();
    }
};

const resolveAddress = (inp: string | undefined) => {
    if (typeof inp === "undefined") {
        return null;
    } else {
        return parseAddress(inp);
    }
};

const resolveBigint = (inp: string | undefined) => {
    inp = inp?.toString();
    if ((typeof inp === "undefined") || (inp === "0")) {
        return null;
    } else {
        return BigInt(inp.replace(/_| /g, ""));
    }
};

const resolveNumber = (inp: string | undefined) => {
    inp = inp?.toString();
    if ((typeof inp === "undefined") || (inp === "0")) {
        return null;
    } else {
        return Number(inp.replace(/_| /g, ""));
    }
};

const resolveAddressArray = (inp: string[] | undefined) => {
    let addressList: Address[] = [];
    if (typeof inp === "undefined") {
        return null;
    } else {
        for (let item of inp) {
            addressList.push(parseAddress(item));
        }
        return addressList ? addressList : null;
    }
};


const resolveBnArray = (inp: string[] | undefined) => {
    let res: bigint[] = [];
    if (typeof inp === "undefined") {
        return null;
    } else {
        for (let item of inp) {
            item = item.toString();
            res.push(BigInt(item.replace(/_| /g, "")));
        }
        return res ? res : null;
    }
};

const resolveMeta = (inp: JettonContent | string | undefined) => {
    if (typeof inp === "undefined") {
        return null;
    } else {
        return inp;
    }
};

export const resolvers = {
    string: resolveString,
    address: resolveAddress,
    bigint: resolveBigint,
    number: resolveNumber,
    addressAr: resolveAddressArray,
    bigintAr: resolveBnArray,
    meta: resolveMeta,
};

type ConfigMap = Record<string, (inp: NonNullable<any> | undefined) => NonNullable<any> | null>;
type ResolveTypesNonNull<A extends ConfigMap> = { [K in keyof A]: NonNullable<ReturnType<A[K]>> };
type ReadonlyParam<A extends ConfigMap> = { [K in keyof A]?: boolean | undefined };
type ExtractInpType<A extends ConfigMap> = { [K in keyof A]: Parameters<A[K]>[0] };

export class CliConfig<T extends ConfigMap> {
    private readonly resolvers: T;
    private readonly isReadOnly?: ReadonlyParam<T>;
    private readonly configOrig: ExtractInpType<T> = {} as ExtractInpType<T>;
    filePath: string = "";
    values: NullableObj<ResolveTypesNonNull<T>> = {} as NullableObj<ResolveTypesNonNull<T>>;

    constructor(resolvers: T, isReadOnly?: ReadonlyParam<T>, defaultPath = "build/deploy.config.json") {
        this.resolvers = resolvers;
        this.isReadOnly = isReadOnly;
        this.filePath = defaultPath
    }

    readConfig(filePath?: string) {
        this.filePath = filePath ?? this.filePath;
        if (!this.filePath) {
            throw new Error("path undefined");
        }
        let data: ExtractInpType<T>;
        try {
            data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        } catch {
            for (let key in this.resolvers) {
                this.values[key] = null;
                this.configOrig[key] = undefined;
            }
            return;
        }
        for (let key in this.resolvers) {
            this.configOrig[key] = data[key];
            this.values[key] = this.resolvers[key](data[key]);
        }
    }

    updateConfig(filePath?: string) {
        if (!this.values) {
            throw new Error("config undefined");
        }
        filePath = filePath ? filePath : this.filePath;
        if (!filePath) {
            throw new Error("path undefined");
        }
        let strObj: ExtractInpType<T> = {} as ExtractInpType<T>;

        for (let key in this.values) {
            if (this.isReadOnly && this.isReadOnly[key]) {
                strObj[key] = this.configOrig[key] !== null ? this.configOrig[key] : undefined;
            } else if ((this.values[key] as any) instanceof Array) {
                strObj[key] = this.values[key].map((val: any) => { return val.toString(); }) as string[];
            } else {
                strObj[key] = this.values[key] !== null ? this.values[key]?.toString() : undefined;
            }
        }
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(strObj, null, 4), "utf-8");
    }

    toString() {
        return this.values
    }

    [util.inspect.custom]() {
        return this.toString();
    }
}

