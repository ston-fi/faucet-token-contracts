import { Address, beginCell, toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';

import { cliConfig } from '../tests/helpers';
import { Minter } from '../wrappers/Minter';
import { color, findArgs, getExpLink, getSeqNo, HOLE_ADDRESS, metadataCell, onchainMetadata, parseAddress, waitConfirm, waitSeqNoChange } from '../helpers';

export async function run(provider: NetworkProvider) {
    cliConfig.readConfig()
    let config = cliConfig.values,
        newAdmin;

    if (config.minterAddress === null)
        throw new Error('minterAddress is not defined');

    const senderAddress = provider.sender().address as Address
    const jettonMinter = provider.open(Minter.createFromAddress(config.minterAddress));


    let validArgs = "changeAdmin"
    let argIndex = findArgs(process.argv, validArgs);
    try {
        const _newAdmin = process.argv[++argIndex];
        newAdmin = _newAdmin == "none" ? HOLE_ADDRESS : parseAddress(_newAdmin);
    } catch (_) {
        console.error("Usage:\n" +
            "\tnpx blueprint run changeAdmin <newAdmin | `none`>"
        );
        return;
    }

    color.log(` - <y>Changing admin of <b>${getExpLink(provider, config.minterAddress)}`)
    waitConfirm()

    const seqno = await getSeqNo(provider, senderAddress)
    await jettonMinter.sendChngeAdmin(provider.sender(), {
        newAdminAddress: newAdmin
    });

    await waitSeqNoChange(provider, senderAddress, seqno)
}

