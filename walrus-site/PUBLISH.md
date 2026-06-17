# Walrus Site Publish Status

This folder is prepared for a **Walrus Site on Mainnet**. It is a static page
hosted on Walrus that reads a Langclaw agent memory straight from the public
Walrus aggregator.

## Current deployment

- Network: Walrus/Sui Mainnet
- Site object ID: pending mainnet publish
- Base36 site ID: pending mainnet publish
- Mainnet portal URL: pending mainnet publish
- Owner:
  `0x3044601613b894da25db9a014ec20a7e38e146ef9b4b6efccdde42544351c323`

Walrus docs state that `wal.app` supports Mainnet sites.

```
walrus-site/
├── index.html         # the site (self-contained: inline CSS + JS, no build step)
├── ws-resources.json  # Walrus Sites routing + headers + metadata
└── PUBLISH.md         # this file (ignored at publish time)
```

Open `index.html` to preview the page locally without a portal. Set `BLOB_ID` in
the inline script after publishing a public mainnet demo blob.

## Prerequisites (one-time)

Publishing needs the `site-builder` + `walrus` CLIs and a Sui mainnet wallet with
**WAL** tokens (Walrus storage is paid in WAL, not SUI).

1. Install the Walrus client and `site-builder` — follow the official guide:
   https://docs.wal.app/docs/sites/getting-started/installing-the-site-builder
2. Make sure `sui client active-address` points at a funded **mainnet** wallet.
3. Make sure the wallet has mainnet WAL for storage and mainnet SUI for gas.

## Publish or update

From the repo root:

```bash
# epochs = how long Walrus stores the site
site-builder --context=mainnet deploy --epochs 5 ./walrus-site
```

`site-builder deploy` publishes the site the first time, then updates the same
site later by reading `object_id` from `ws-resources.json`.

Convert the object ID to base36 when needed:

```bash
site-builder --context=mainnet convert <mainnet_site_object_id>
```

## Notes

- `index.html` is intentionally a single self-contained file so there is no build
  step and the published resource set is trivial.
- The page renders **honestly**: if the aggregator is unreachable it shows an
  error state with the raw blob URL instead of faking the memory content.
- To point the site at a different memory, change `BLOB_ID` in the inline script.
