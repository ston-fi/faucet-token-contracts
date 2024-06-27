import { Address, beginCell, toNano } from '@ton/core';
import { compile, NetworkProvider } from '@ton/blueprint';

import { cliConfig } from '../tests/helpers';
import { Minter } from '../wrappers/Minter';
import { color, getExpLink, getSeqNo, metadataCell, onchainMetadata, waitConfirm, waitSeqNoChange } from '../helpers';

export async function run(provider: NetworkProvider) {
    cliConfig.readConfig()
    let config = cliConfig.values

    if (config.minterAddress === null) {
        throw new Error('minterAddress is not defined');
    }

    if (config.metadata === null) {
        throw new Error('metadata is not defined');
    }

    const senderAddress = provider.sender().address as Address

    const metadata = typeof config.metadata === "string"
        ? config.metadata
        : onchainMetadata(config.metadata)

    const jettonMinter = provider.open(Minter.createFromAddress(config.minterAddress));

    color.log(` - <y>Changing meta of <b>${getExpLink(provider, config.minterAddress)}`)
    waitConfirm()
    const seqno = await getSeqNo(provider, senderAddress)
    await jettonMinter.sendChngeContent(provider.sender(), {
        newContent: metadataCell(metadata)
    });

    await waitSeqNoChange(provider, senderAddress, seqno)
}

