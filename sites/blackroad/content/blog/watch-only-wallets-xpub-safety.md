---
title: "Watching-Only Wallets and XPUB Safety"
date: "2024-05-27"
tags: [bitcoin, security, wallets]
description: "How extended public keys enable read-only wallet monitoring without exposing funds."
---

Keeping tabs on a Bitcoin balance does not always require spending access. A watching-only wallet gives you visibility into incoming transactions and balances without ever storing a private key. The wallet software derives every receive address from an extended public key (XPUB), so you can audit activity, support tax reporting, or confirm that automated deposits landed—while funds stay locked behind the signing keys that never leave cold storage.

The convenience comes with privacy trade-offs. Whoever holds the XPUB can regenerate the same address tree and follow the money, including future change outputs. Sharing the string with an accountant or portfolio app is fine if you trust their data handling, but it is effectively an open book for that account. Treat XPUBs as confidential metadata and rotate accounts if an XPUB leaks.

Electrum and similar clients make the setup straightforward. In Electrum, choose the option to create a new wallet, select “Standard wallet,” then “Use a master key,” and paste the XPUB. The resulting wallet shows addresses, history, and balances, yet cannot sign transactions because no private keys exist locally. That separation is the core safety feature: you gain full visibility and notifications without adding new attack surface to your spending keys.

When you need to watch multiple entities—treasury vaults, mining payouts, or multisig participants—maintain a catalog of XPUBs and label them clearly. Consider using separate operating system accounts or hardware profiles so the read-only dashboards cannot snoop on each other. The extra operational hygiene keeps oversight sharp while honoring the principle of least privilege.
