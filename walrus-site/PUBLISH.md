# Walrus Site Publish Status

This folder is prepared for a **Walrus Site on Mainnet**. It is a static page
hosted on Walrus that reads a Langclaw agent memory straight from the public
Walrus aggregator.

## Current deployment

- Network: Walrus/Sui Mainnet
- Site object ID: `0x423a0cf7bfa109ed48ae6fae63eead7b7eae751b0885925b137bfd1d9e597d2b`
- Base36 site ID: `1nf7tlsp8yjmph7uq952gzp2r81wyayaqyinfeosgsw2ef2r6z`
- Local portal URL: `http://1nf7tlsp8yjmph7uq952gzp2r81wyayaqyinfeosgsw2ef2r6z.localhost:3000`
- Public `wal.app` URL status: pending SuiNS routing. The site object is live,
  but a public portal route requires a SuiNS name that points to the site object.
- Owner:
  `0x4b635af81752a2bcdaeb908bd522173ad1c86a859a9c56ee59d3089c35e0a622`

Walrus docs state that `wal.app` supports Mainnet sites.

```
walrus-site/
├── index.html         # the site (self-contained: inline CSS + JS, no build step)
├── ws-resources.json  # Walrus Sites routing + headers + metadata
└── PUBLISH.md         # this file (ignored at publish time)
```

Open `index.html` to preview the page locally without a portal. The current
`BLOB_ID` points to a public mainnet demo artifact.

## Prerequisites (one-time)

Publishing needs the `site-builder` + `walrus` CLIs and a Sui mainnet wallet with
**WAL** tokens (Walrus storage is paid in WAL, not SUI).

1. Install the Walrus client and `site-builder`. Follow the official guide:
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

## Public route checklist

Before final submission, assign a SuiNS name to the site object, then add the
resulting `https://<name>.wal.app` URL to:

- `README.md`
- `WALRUS_TRACK.md`
- `backend/docs/HACKATHON_SUBMISSION.md`

Do not claim a public `wal.app` URL in the submission until this route resolves.

## Notes

- `index.html` is intentionally a single self-contained file so there is no build
  step and the published resource set is trivial.
- The page renders **honestly**: if the aggregator is unreachable it shows an
  error state with the raw blob URL instead of faking the memory content.
- To point the site at a different memory, change `BLOB_ID` in the inline script.
