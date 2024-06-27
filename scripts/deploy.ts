import { beginCell, toNano } from '@ton/core';
import { Minter } from '../wrappers/Minter';
import { compile, NetworkProvider } from '@ton/blueprint';
import { buildLibFromCell, color, Deployer, findArgs, metadataCell, onchainMetadata } from '../helpers';
import { cliConfig } from '../tests/helpers';
import { Address } from '@ton/core';

export async function run(provider: NetworkProvider) {
    cliConfig.readConfig();
    let config = cliConfig.values;

    if (config.metadata === null)
        throw new Error('metadata is not defined');

    const senderAddress = provider.sender().address as Address;

    const metadata = typeof config.metadata === "string"
        ? config.metadata
        : onchainMetadata(config.metadata);

    const minter = provider.open(Minter.createFromConfig({
        totalSupply: 0,
        adminAddress: senderAddress,
        content: metadataCell(metadata),
        jettonWalletCode: await compile('Wallet')
    }, await compile('Minter')));

    await minter.sendDeploy(provider.sender(), toNano('0.05'));
    await provider.waitForDeploy(minter.address);

    config.minterAddress = minter.address;
    cliConfig.updateConfig();
}

