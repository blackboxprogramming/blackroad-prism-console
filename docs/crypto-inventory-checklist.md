# Crypto Inventory Checklist

Create a concise inventory of your cryptocurrency holdings across every platform so you always know exactly what you hold and avoid double-counting wrapped assets.

---

## 1. List Each Platform

Include exchanges, brokerages, software wallets, and hardware wallets.

- Coinbase
- Robinhood
- Metamask (software wallet)
- Ledger (hardware wallet)
- Other: \_\_\_\_\_\_\_

---

## 2. Record Asset Symbol and Chain Per Platform

Write each holding using the format `ASSET on CHAIN — amount` (for example, `ETH on Ethereum — 2.10`). Always note the chain to avoid confusion between native and wrapped tokens.

### Example

- **Coinbase**
  - BTC on Bitcoin — 0.125
  - ETH on Ethereum — 2.10
  - USDC on Ethereum — 1,500
- **Robinhood**
  - BTC on Bitcoin — 0.050
  - DOGE on Dogecoin — 1,200
- **Metamask**
  - WBTC on Ethereum — 0.010
  - USDT on Ethereum — 800
- **Ledger**
  - BTC on Bitcoin — 0.030

---

## 3. Mark Duplicates Across Platforms

Highlight any instance where the same asset on the same chain appears on multiple platforms—this indicates a duplicate holding, not a separate asset.

- Duplicate example: “BTC on Bitcoin” (Coinbase & Ledger) → duplicate ✅
- Not a duplicate: “WBTC on Ethereum” vs. “BTC on Bitcoin” → different assets (wrapped vs. native)

---

## 4. Tally Unique Assets (Asset + Chain)

Create a running list where each asset/chain pair appears only once.

- BTC on Bitcoin
- ETH on Ethereum
- USDC on Ethereum
- USDT on Ethereum
- DOGE on Dogecoin
- WBTC on Ethereum

**Distinct assets:** 6

### Optional: Subtotals by Chain

Organize holdings by their underlying chain to prevent mixing wrapped versions with their native counterparts.

- **Bitcoin (L1):** BTC
- **Ethereum (L1 / ERC-20):** ETH, USDC, USDT, WBTC
- **Dogecoin (L1):** DOGE

---

## Copy-and-Paste Templates

### Markdown Template

```markdown
# Platforms
- Exchange 1: __________
- Exchange 2: __________
- Software wallet(s): __________
- Hardware wallet(s): __________

## Holdings by Platform
### Platform: __________
- ______ on ______ — amount: ______
- ______ on ______ — amount: ______

### Platform: __________
- ______ on ______ — amount: ______

## Duplicates (same asset + same chain across platforms)
- ______ on ______ (Platform A & Platform B)

## Unique Set (asset + chain, each listed once)
- ______ on ______
- ______ on ______
- ______ on ______

Distinct assets: ____
```

### CSV Template

Import into any spreadsheet or portfolio tracker.

```csv
Platform,Asset,Chain,Amount,Duplicate?(Y/N),Notes
Coinbase,BTC,Bitcoin,0.125,,
Coinbase,ETH,Ethereum,2.1,,
Coinbase,USDC,Ethereum,1500,,
Robinhood,BTC,Bitcoin,0.05,Y,Duplicate of BTC on Bitcoin at Coinbase
Robinhood,DOGE,Dogecoin,1200,,
Metamask,WBTC,Ethereum,0.01,,
Metamask,USDT,Ethereum,800,,
Ledger,BTC,Bitcoin,0.03,Y,Duplicate of BTC on Bitcoin at Coinbase
```

---

## Quick Tips

- Always specify the chain/network (e.g., “USDT on Ethereum” vs. “USDT on Tron”).
- Wrapped tokens are not the same as their native counterparts (WBTC ≠ BTC).
- Keep this file as your baseline; updating it helps track changes quickly.
- Share the CSV with collaborators or convert it to a PDF summary for reporting.
