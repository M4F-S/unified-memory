# 🎨 FRONTEND DESIGN BRIEF — For Claude Code
## UnifiedMemory | AI Agents Berlin Hackathon 2026
## Stack: Next.js 14 App Router + Tailwind CSS + shadcn/ui + Framer Motion

---

## VISUAL IDENTITY

**Name:** UnifiedMemory
**Tagline:** Your memory. Your rules. Every AI, everywhere.
**Aesthetic:** Dark futuristic + warm memory glow — think "consciousness OS"

### Color Palette
```
Background:     #0A0A0F  (near black, slightly blue)
Surface:        #12121A  (cards, modals)
Surface 2:      #1C1C2E  (elevated cards)
Border:         #2A2A3E  (subtle borders)

Primary:        #7C3AED  (violet — trust, intelligence)
Primary glow:   #7C3AED40 (glassmorphism backgrounds)
Accent:         #06B6D4  (cyan — data flow, connections)
Accent warm:    #F59E0B  (amber — memory highlights, important)

Success:        #10B981  (emerald — consent active, confirmed)
Danger:         #EF4444  (red — revoke, blocked)
Warning:        #F59E0B  (amber — expiring, caution)

Text primary:   #F8FAFC
Text secondary: #94A3B8
Text muted:     #475569
```

### Typography
```
Font family: "Inter" (body) + "JetBrains Mono" (code, addresses, hashes)
Display: 3.5rem / bold / tight tracking
Heading: 1.875rem / semibold
Body: 1rem / regular / 1.7 line-height
Mono: 0.875rem / JetBrains Mono
```

### Key Visual Elements
- **Glassmorphism cards**: `backdrop-blur-xl bg-white/5 border border-white/10`
- **Memory orb**: animated floating sphere with particle system (represents memory graph)
- **Neural network lines**: SVG animated connections between platform icons
- **Consent badge**: pulsing green ring when NFT is active, red flash on revoke
- **Data flow particles**: small dots flowing from platform icons to the memory orb
- **NEAR transaction hash**: monospace green text, like a terminal

---

## API ROUTES (copy-paste into your fetch calls)

```ts
// Set in next.config.js or .env.local:
// NEXT_PUBLIC_MCP_URL=https://unified-memory-mcp.YOUR-SUBDOMAIN.workers.dev
// (fallback: http://localhost:8000)

const API = process.env.NEXT_PUBLIC_MCP_URL;

// ── Memory ────────────────────────────────────────────────────────────────────
GET  /.well-known/mcp                    // MCP manifest
POST /mcp/recall_memory                  // query memory graph
     body: { query, token_id, memory_type?, platform? }
     → { result: { memories: [{content, summary, source, type, timestamp, score}], remaining_queries } }
     → 403 if NFT revoked/expired | 402 if X-PAYMENT header missing

POST /mcp/add_memory                     // write a new memory
     body: { content, memory_type, source, token_id }
     → { result: { memory_id, type, importance_score } }

POST /mcp/get_memory_stats               // NFT status + usage
     body: { token_id }
     → { result: { nft_status, total_memories, queries_used, queries_remaining,
                   usdc_spent, usdc_remaining, expires_at } }

// ── Ingestion ─────────────────────────────────────────────────────────────────
GET  /ingest/connectors                  // list all 20 connectors { platform, auth, label }
POST /ingest/trigger                     // kick off single platform
     body: { user_id, platform, token_id }
     → { job_id, status: "queued", created_at }

POST /ingest/trigger/batch               // kick off multiple platforms
     body: { user_id, platforms: string[], token_id }
     → { jobs: [{ job_id, platform, status }] }

GET  /ingest/status/:job_id              // poll job status
     → { job_id, status, memories_processed }

// ── Local only ────────────────────────────────────────────────────────────────
GET  /health                             // → { status: "ok" }
```

### Page → API mapping

| Page | API calls needed |
|------|-----------------|
| `/onboard` | `GET /ingest/connectors`, `POST /ingest/trigger`, `GET /ingest/status/:id` |
| `/consent` | `POST /mcp/get_memory_stats` (to list active NFTs) |
| `/dashboard` | `POST /mcp/get_memory_stats` (polling), `GET /ingest/connectors` |
| `/demo` | `POST /mcp/recall_memory`, `POST /mcp/get_memory_stats` |

---

## PAGE DESIGNS

---

### PAGE 1: `/` — Landing / Hero

**Layout:** Full-screen dark, centered hero with animated memory orb

**Hero Section:**
```
[Animated 3D sphere made of particle dots, slowly rotating]
[Subtle neural network lines connecting around it]

HEADLINE (large, gradient text violet→cyan):
  "Your memory. Every AI. Your rules."

SUBHEADLINE (muted, 1.2rem):
  "Connect your entire digital life — 20+ platforms.
   Give AI agents access via NEAR blockchain consent.
   Revoke anytime. Permanently. On-chain."

[CTA Button]: "Connect Your First Platform →"
  Style: violet gradient, slight glow, rounded-xl
[Secondary]: "See live demo ↓"
  Style: ghost button, cyan text
```

**Stats bar** (below hero, glassmorphism row):
```
[ 20+ Platforms ]  [ NEAR Blockchain ]  [ x402 Payments ]  [ GDPR Compliant ]
```

**Platform Grid** (show all 20 platform logos in a flowing grid):
- Each card: dark glass, platform color accent on hover, "Connect" button
- Pulsing green dot on platforms already connected
- "Upload archive" vs "OAuth" vs "Request data" label

---

### PAGE 2: `/onboard` — Platform Connection

**Layout:** Two-column — left: platform grid, right: memory graph stats

**Left column — Platform Cards (3-column grid):**
Each card:
```
┌─────────────────────────────┐
│  [Platform Logo]            │
│  Gmail                      │
│  ● Connected — 847 memories │
│  [Reconnect] [View memories]│
└─────────────────────────────┘
```

Colors by type:
- OAuth (immediate): green ring
- Archive upload: amber ring
- DSAR pending: blue ring, progress bar
- Not connected: dark, ghost button

**Right column — Memory Graph Orb:**
```
[Large animated sphere]
Total: 2,847 memories
──────────────────────
Episodic:     892  ████░░ 31%
Semantic:     634  ████░░ 22%
Procedural:   421  ███░░░ 15%
Social:       558  ███░░░ 19%
Preferential: 342  ██░░░░ 12%
──────────────────────
[Platform breakdown donut chart]
Gmail: 847  GitHub: 621  Spotify: 312...
```

---

### PAGE 3: `/consent` — Mint & Manage NFTs

**Layout:** Left: mint form, Right: active NFTs table

**Mint Form (left, glassmorphism card):**
```
Mint a Consent NFT

Agent ID:          [input: e.g. gpt-4o-agent.near]

Platforms:         [☑ Gmail] [☑ GitHub] [☑ Spotify]
                   [☐ Twitter] [☐ WhatsApp] [☐ All]

Memory types:      [☑ Episodic] [☑ Semantic] [☐ Procedural]
                   [☐ Social] [☐ Preferential] [☐ All]

Max queries:       [━━━━━●━━━━] 50 queries
Max USDC budget:   [━━━●━━━━━━] $0.50 USDC
Expires in:        [24h] [48h] [7d] [Custom]

                   [Mint Consent NFT →]
                   Powered by NEAR Blockchain
```

**Active NFTs (right, table):**
```
Token  │ Agent          │ Queries  │ Budget    │ Expires   │ Status
───────┼────────────────┼──────────┼───────────┼───────────┼──────────────
#001   │ gpt-4o-agent   │ 12/50    │ $0.12/0.5 │ 8h left   │ ● Active
#002   │ claude-tools   │ 3/100    │ $0.03/1.0 │ 2d left   │ ● Active
#003   │ my-assistant   │ 50/50    │ $0.50/0.5 │ expired   │ ○ Expired
                                              [Revoke ✕]
```

Each row: hover shows "🔗 NEAR Explorer" link, animated progress bars for queries/budget

---

### PAGE 4: `/dashboard` — Live Activity Monitor

**Layout:** Real-time dashboard, 4 widgets + live query log

**Top row — 4 stat cards:**
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total Memories│ │ USDC Earned  │ │ Active NFTs  │ │ Queries Today│
│   2,847      │ │   $2.34      │ │     3        │ │     47       │
│ ↑ 12 today  │ │ ↑ $0.12/hr  │ │ 1 expiring  │ │ ↑ 8/hr      │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

**Live Query Log (main panel, real-time scrolling):**
```
LIVE  ──────────────────────────────────── 47 queries today

2m ago  │ episodic  │ 📧 gmail    │ "What meetings did I have this week?" │ $0.001 USDC ✅
4m ago  │ semantic  │ 🐙 github   │ "What are the user's top skills?"    │ $0.001 USDC ✅
6m ago  │ social    │ 💼 slack    │ "Who does the user work with most?"  │ $0.001 USDC ✅
8m ago  │ episodic  │ 🎵 spotify  │ "What music did user listen to?"     │ $0.001 USDC ✅
─────── │ ─────────  │ ─ ─ ─ ─   │ ───────────── NFT #002 REVOKED ────── │ 🔴 BLOCKED
9m ago  │ episodic  │ 📧 gmail    │ "Check emails" [BLOCKED: revoked]    │ $0.000 🚫
```

**USDC Balance Widget:**
```
Circle Wallet Balance
━━━━━━━━━━━━━━━━━━━
$2.34 USDC
━━━━━━━━━━━━━━━━━━━
[Withdraw] [View on Explorer]
```

---

### PAGE 5: `/demo` — Live Hackathon Demo

**Layout:** Theater mode — dark full screen, agent "thinking" stream

**Top bar:**
```
UnifiedMemory LIVE DEMO ●  │  Agent: kimi/kimi-k2.5 via OpenRouter  │  Token: #001 ● Active
```

**Main area — 3-column:**
```
[Agent Terminal]     [Memory Retrieved]     [Blockchain Log]
─────────────────    ──────────────────    ──────────────────
> Scenario A         ● GitHub: "Committed   NEAR Testnet:
  Working this         NEAR contract..."    - validate_query ✅
  week...            ● Gmail: "Email from   - record_query ✅
                       Sarah: deadline..."  - 0.001 USDC sent ✅
[Thinking...●]       ● Slack: "Sarah, Alex"
                     ● Spotify: "lofi 4h"
[Answer appears      Score: 0.94 | 0.92 |
 streaming]          0.89 | 0.87
```

**THE BIG RED BUTTON (center, demo moment):**
```
┌──────────────────────────────────────────────┐
│                                              │
│   🔴  REVOKE CONSENT                         │
│       Burn NFT on NEAR blockchain            │
│                                              │
│   [REVOKE NOW — Live Transaction]            │
│                                              │
└──────────────────────────────────────────────┘
```

After click: full-screen red flash, then terminal shows:
```
> CONSENT REVOKED
> Transaction: Bk7xR2...nearblocks.io
> Block: #87,432,910
> Agent access: PERMANENTLY BLOCKED
> On-chain timestamp: 2026-06-21T10:42:33Z
> "This is the first time in history an AI agent's
>  data access was revoked via blockchain in real time."
```

---

## COMPONENT LIBRARY (tell Claude Code to build these)

### 1. MemoryOrb
- Animated WebGL or CSS sphere with glowing particles
- Rotates slowly, particles orbit it
- Size changes with memory count
- Colors pulse based on query activity

### 2. PlatformCard
- Dark glass card with platform logo
- Status indicator (connected/disconnected/pending)
- Memory count badge
- Connect/disconnect button with loading state

### 3. ConsentNFTCard
- Token ID badge (monospace)
- Progress bars for queries + budget
- Countdown timer for expiry
- Pulsing green ring when active
- Red "Revoke" button with confirmation modal

### 4. QueryLogRow
- Real-time animated entry (slides in from top)
- Memory type badge (color-coded)
- Platform icon + name
- Query text (truncated)
- USDC amount
- Status (✅ paid / 🚫 blocked / ⏳ pending)

### 5. BlockchainProof
- Transaction hash (monospace, cyan)
- Block number
- Timestamp
- Direct link to NEAR Explorer
- Copy button

### 6. RevocationModal
- Dramatic full-overlay dark modal
- "Are you sure?" with consequences listed
- Big red confirm button
- After confirm: animated transaction broadcast

---

## ANIMATIONS TO IMPLEMENT (Framer Motion)

```javascript
// Memory orb particle system
// Platform icons float and bob gently
// Query log rows slide in from top with fade
// Consent NFT card glows green when minted
// Red flash + scale animation on revoke
// USDC balance counter animates number changes
// Neural network SVG lines draw on scroll
// Platform connection: particle flows from icon to orb
```

---

## CLAUDE CODE PROMPT

Use this exact prompt to generate the frontend:

```
Build a Next.js 14 App Router frontend for UnifiedMemory, an AI memory platform.
Stack: Next.js 14, Tailwind CSS, shadcn/ui, Framer Motion, TypeScript.

Design system:
- Background: #0A0A0F, Cards: #12121A, Primary: #7C3AED (violet), Accent: #06B6D4 (cyan)
- Glassmorphism: backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl
- Font: Inter + JetBrains Mono for hashes/code
- Dark futuristic OS aesthetic — like a "consciousness dashboard"

Pages to build:
1. / — Hero with animated particle orb, platform logos grid, "Connect" CTA
2. /onboard — Platform connection cards (OAuth/upload/DSAR), memory graph stats
3. /consent — Mint Consent NFT form + active NFTs table with revoke buttons
4. /dashboard — Real-time query log, USDC balance, memory stats
5. /demo — Theater demo with agent terminal, memory feed, big red revoke button

Key interactions:
- Consent NFT card: pulsing green ring when active, red flash + revoke animation
- Query log: new rows slide in from top in real-time (mock with setInterval)
- Platform connect: loading state → particle animation → connected state
- REVOKE button: full-screen overlay, dramatic red transaction animation

NEAR integration:
- Use @near-wallet-selector/core for wallet connection
- Show NEAR account ID in header
- Transaction hashes link to https://testnet.nearblocks.io/txns/HASH

Environment variables:
- NEXT_PUBLIC_NEAR_CONTRACT_ID
- NEXT_PUBLIC_MCP_URL
- NEXT_PUBLIC_NEAR_NETWORK=testnet

Make it look like the most polished hackathon demo ever seen.
The /demo page should feel like a live product demo on stage.
```
