# PortalKubo Proof Contract

`portal_kubo_proof` is the open-source ink! contract for the hackathon MVP.
It stores proof hashes for AI-powered workflow runs on Portaldot.

Build with `cargo +1.89.0 contract build --release` from this folder after
installing the ink! toolchain. Deploy the generated contract to a Portaldot
local development node started with:

```bash
portaldot_dev --dev --alice
```

The current browser demo anchors the same proof payload with `system.remark` so
the end-to-end MVP remains runnable before a deployed contract address is
available. After deployment, set:

```bash
NEXT_PUBLIC_PORTALDOT_PROOF_CONTRACT_ADDRESS=<contract-address>
```
