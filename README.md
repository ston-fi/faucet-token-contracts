# Faucet Token Contracts

[![TON](https://img.shields.io/badge/based%20on-TON-blue)](https://ton.org/)
[![License](https://img.shields.io/badge/license-MIT-brightgreen)](https://opensource.org/licenses/MIT)

> Note: this contract has not been audited yet. It's not meant in any way for production use. Use for testing only.

Simple implementation of TON jetton contracts with unlimited minting logic.

## Deployed contracts

- TestRED: [https://testnet.tonviewer.com/kQDLvsZol3juZyOAVG8tWsJntOxeEZWEaWCbbSjYakQpuYN5](kQDLvsZol3juZyOAVG8tWsJntOxeEZWEaWCbbSjYakQpuYN5)
- TestBLUE: [https://testnet.tonviewer.com/kQB_TOJSB7q3-Jm1O8s0jKFtqLElZDPjATs5uJGsujcjznq3](kQB_TOJSB7q3-Jm1O8s0jKFtqLElZDPjATs5uJGsujcjznq3)
- TestGREEN: [https://testnet.tonviewer.com/kQCMGEfYTE-PkbmyVidhnc5rb2XSxUDevi8b2GBw3-Ke7w_p](kQCMGEfYTE-PkbmyVidhnc5rb2XSxUDevi8b2GBw3-Ke7w_p)

## Local Development

The following assumes the use of `node@>=18`.

### Install Dependencies

`npm install`

### Compile Contracts

`npm run build`

### Run Tests

`npm run test`

### Deploy Contracts

`npx blueprint run deploy`

## Licensing

The license for pTON contracts is MIT, see [LICENSE](LICENSE).
