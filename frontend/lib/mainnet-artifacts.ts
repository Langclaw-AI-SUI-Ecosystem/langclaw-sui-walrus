export const MAINNET_ARTIFACTS = {
  network: "mainnet",
  agentId: "133",
  packageId:
    "0x7f3578ebe174b0343cd96391b2a1c75d5db4ad82c793650b3950bdb5634192e5",
  vaultId:
    "0x816064d45dfe06194a973bce4b38a137365bbd6979c61b0d09435b7a443f3eff",
  recorder:
    "0x4b635af81752a2bcdaeb908bd522173ad1c86a859a9c56ee59d3089c35e0a622",
  packageTx: "6kmuA94JsgM7uJ7MN32WEbWFMkF5rBuLUrUwFT4eTKED",
  vaultTx: "ALvypw6EvadDXo4MCzgNEPgLJ8jES3rVLsWZHCnnqYVH",
  memoryTx: "aK7QiQdnbEXKtrHSZ5qifWcbfcBbu7UsFHsDjDFfR1H",
  decisionTx: "AtTXAV8bTRdUCEJjWuUQvhhdHzepksYKkkCMUqNKCEZ7",
  keyServerId:
    "0x86b608dcb3fcb9c629cfe6d865681977d1decb219a2eb98eb6058b87377feaf3",
  keyServerRegistrationTx:
    "5dbnWfCpMY1aWALrayaDkWAiBH5TSFYWdhERbxFfRxV1",
  keyServerUpdateTx: "Db7F2zbCXogBqAEyZQGwybMYVLkDMwH5xpUfLrWfPj77",
  publicBlobId: "dFpx2A6pTOfEL41vTsOmMPo6LTMZ9aWlHsR24FwnanA",
  walrusAggregator: "https://aggregator.walrus-mainnet.walrus.space",
  suiExplorer: "https://suivision.xyz",
} as const;

export function suiObjectUrl(objectId: string) {
  return `${MAINNET_ARTIFACTS.suiExplorer}/object/${objectId}`;
}

export function suiTxUrl(txDigest: string) {
  return `${MAINNET_ARTIFACTS.suiExplorer}/txblock/${txDigest}`;
}

export function walrusBlobUrl(blobId: string) {
  return `${MAINNET_ARTIFACTS.walrusAggregator}/v1/blobs/${blobId}`;
}
