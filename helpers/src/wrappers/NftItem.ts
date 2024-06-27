export const nftOpcodes = {
    transfer: 0x5fcc3d14,
    getStaticData: 0x2fcb26a2,
    reportStaticData: 0x8b771735,
} as const;

export const sbtOpcodes = {
    ...nftOpcodes,
    destroy: 0x1f04537a,
    proveOwnership: 0x04ded148,
    ownershipProof: 0x0524c7ae,
    ownershipProofBounced: 0xc18e86d2,
    requestOwner: 0xd0c3bfea,
} as const;

