# Cloudflare Deploy + USDC (x402) Payment

Two Cloudflare deploys plus the USDC micropayment flow that ties them together.

- **Worker** (`workers/`) — the MCP API. Validates NEAR consent, charges **0.001 USDC
  per `recall_memory`** via the x402 protocol, then queries Pinecone.
- **Pages** (`app/`) — the Next.js frontend (static export). Drives the demo and shows
  the USDC payment happening per query.

> Payment status: the x402 **round-trip is real** (HTTP 402 → `PAYMENT-REQUIRED`
> challenge → retry with `X-PAYMENT`), but **settlement is demo-grade** — the Worker
> accepts any non-empty `X-PAYMENT` receipt and the frontend mints one via
> `settleUsdcPayment()` in [app/lib/api.ts](app/lib/api.ts). Swap that function (and add
> a verify step in [workers/x402-gate.js](workers/x402-gate.js)) for real Circle/x402
> facilitator settlement.

---

## 1. Worker (MCP API)

```bash
cd workers
npm install            # hono
npx wrangler login     # one-time browser auth

# Secrets (never go in wrangler.toml):
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put PINECONE_API_KEY
npx wrangler secret put CIRCLE_API_KEY    # optional for the demo

npx wrangler deploy     # or: npm run deploy:workers (from repo root)
```

Before deploying, set the USDC payout target in [workers/wrangler.toml](workers/wrangler.toml):

```toml
# x402 USDC payTo — the Circle wallet that receives 0.001 USDC per query.
CIRCLE_WALLET_ADDRESS = "0xYOUR_REAL_CIRCLE_WALLET"
```

This address is echoed in the `PAYMENT-REQUIRED` 402 challenge as `payTo`. Leaving the
`0x000…001` placeholder still demos fine (settlement is simulated), but a real deploy
should use your Circle wallet.

The Worker's CORS now exposes `PAYMENT-REQUIRED` and allows `X-PAYMENT`, so browser
clients (Pages) can read the challenge and send the receipt cross-origin.

---

## 2. Pages (frontend)

The frontend is a **static export** (`next.config.js` → `output: 'export'` → `dist/`),
so it deploys to Pages as plain static assets — no Functions/SSR.

```bash
cd app
npm install

# Point the build at the live Worker (NEXT_PUBLIC_* is inlined at build time):
export NEXT_PUBLIC_MCP_URL=https://unified-memory-mcp.rapid-king-4a64.workers.dev

npm run deploy          # next build -> wrangler pages deploy   (uses app/wrangler.toml)
```

`npm run deploy` (or `npm run deploy:pages` from the repo root) builds and uploads
`dist/` to the `unified-memory-app` Pages project.

For dashboard-driven builds, set `NEXT_PUBLIC_MCP_URL` under
**Pages → Settings → Environment variables → Production** instead of exporting it.

Preview the built export locally on the Pages runtime:

```bash
cd app && npm run pages:preview      # wrangler pages dev dist
```

---

## 3. The USDC (x402) payment flow

1. Agent/frontend calls `POST /mcp/recall_memory` (no payment).
2. Consent passes → Worker returns **HTTP 402** with a `PAYMENT-REQUIRED` header:

   ```json
   { "scheme": "exact", "network": "base-sepolia", "maxAmountRequired": "1000",
     "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
     "payTo": "<CIRCLE_WALLET_ADDRESS>", "description": "Memory query - UnifiedMemory" }
   ```

   `maxAmountRequired` is micro-USDC (6 decimals) → `1000` = **0.001 USDC**.
3. Client settles the USDC (frontend: `settleUsdcPayment()`; demo agent: `demo/agent.py`).
4. Client retries with the `X-PAYMENT: <receipt>` header → Worker returns the memories
   and `query_cost_usdc: 0.001`.

The frontend surfaces every step in the demo's thinking stream (402 → "Settling via
Circle (x402)" → "Payment confirmed") and tags each paid query with an
`x402 · Circle · base-sepolia` badge.

### Going from demo to real settlement
- **Frontend** ([app/lib/api.ts](app/lib/api.ts)): replace `settleUsdcPayment()` with a
  real Circle/x402 facilitator call that signs and submits the USDC transfer.
- **Worker** ([workers/x402-gate.js](workers/x402-gate.js)): `checkPayment()` currently
  accepts any non-empty `X-PAYMENT`. Add verification of the receipt/settlement against
  the facilitator before returning `null` (paid).
