export const SKILL_MD_APPEND = "\n---\n\n## Additive API Surface (WindAgents-native)\n\nBase URL: \\`http://localhost:3000\\` (Cloudflare tunnel may expose the same app on a public host — prefer relative paths from agents).\n\nThese sections extend the core skill.md. They document **new** WindAgents routes only. Never put real \\`cpk_\\` / \\`pbx_\\` secrets in skill.md.\n\n### Out of scope / branding\n\nWindAgents does **not** proxy AnsemRail and never links \\`ansemrail.vercel.app\\`. Competitor tokens (\\`$ANSEM\\`, etc.) are **not** official WindAgents tokens. **PONS / gasless claw launches are in scope** as ClawPump-backed WindAgents routes (\\`/api/launch/*\\`) using **your own \\`cpk_\\`**. Phoenix perps remain via ClawPump agent skills when your key is connected — not rebranded as WindAgents-native trading venues.\n\n---\n\n## Token Tools (MoonPay Agents proxy)\n\nWindAgents proxies public MoonPay Agents tools. On upstream failure returns \\`{ error, upstreamStatus, message }\\` with **502** — tokens are never invented.\n\n| Endpoint | Method | Auth | Body |\n|----------|--------|------|------|\n| \\`/api/tools/token_trending_list\\` | POST | None | \\`{ chain?, limit?, page? }\\` |\n| \\`/api/tools/token_search\\` | POST | None | \\`{ query, chain? }\\` |\n| \\`/api/tools/token_retrieve\\` | POST | None | \\`{ address, chain? }\\` |\n\n\\`\\`\\`bash\ncurl -s -X POST http://localhost:3000/api/tools/token_trending_list \\\\\n  -H \"Content-Type: application/json\" \\\\\n  -d '{\"chain\":\"solana\",\"limit\":10,\"page\":1}'\n\ncurl -s -X POST http://localhost:3000/api/tools/token_search \\\\\n  -H \"Content-Type: application/json\" \\\\\n  -d '{\"query\":\"SOL\",\"chain\":\"solana\",\"limit\":10}'\n\ncurl -s -X POST http://localhost:3000/api/tools/token_retrieve \\\\\n  -H \"Content-Type: application/json\" \\\\\n  -d '{\"address\":\"So11111111111111111111111111111111111111112\",\"chain\":\"solana\"}'\n\\`\\`\\`\n\nUI desk: \\`/tools\\`\n\n### Hermes-style / multi-chain note\n\nCreate a local WindAgents agent with wallet + market-intelligence skills. Use \\`/api/tools/*\\` (MoonPay Agents) for multi-chain token discovery when reachable. Primary execution path remains Solana (Jupiter + Helius/public RPC).\n\n---\n\n## Upload + Image Proxy\n\n| Endpoint | Method | Auth | Description |\n|----------|--------|------|-------------|\n| \\`/api/upload\\` | POST | Bearer | JSON \\`{ image }\\` (base64 or data URL) → **201** \\`{ id, url }\\`; also dataUrl/base64/multipart — max ~2MB |\n| \\`/api/upload/:id\\` | GET | None | Serve stored bytes with correct Content-Type |\n| \\`/api/image-proxy\\` | GET | None | \\`?url=\\` allowlisted hosts only |\n\nAllowlist: \\`images.unsplash.com\\`, \\`pbs.twimg.com\\`, \\`abs.twimg.com\\`, \\`agents.moonpay.com\\`, \\`*.clawpump.tech\\`, \\`localhost\\`. Others → 400.\n\n\\`\\`\\`bash\ncurl -s -X POST http://localhost:3000/api/upload \\\\\n  -H \"Authorization: Bearer TOKEN\" \\\\\n  -H \"Content-Type: application/json\" \\\\\n  -d '{\"base64\":\"<...>\", \"mime\":\"image/png\", \"kind\":\"image\"}'\n# → { \"id\":\"...\", \"url\":\"/api/upload/...\" }\n\ncurl -s \"http://localhost:3000/api/image-proxy?url=https://images.unsplash.com/photo-1\" -o /tmp/img.bin\n\\`\\`\\`\n\n---\n\n## Agent Quota\n\n| Endpoint | Method | Auth | Description |\n|----------|--------|------|-------------|\n| \\`/api/agents/quota\\` | GET | Bearer | Honest quota/usage; never invents remaining counts |\n\nWithout \\`cpk_\\`: \\`{ connected:false, hasOwnKey:false, freeTierNote:\"ClawPump free tier ~1000 msgs/day shared (clawpump.tech/docs)\", remaining:null }\\`.\n\nWith \\`cpk_\\`: tries known ClawPump usage endpoints; if none expose counts, returns the free-tier note with \\`remaining:null\\`.\n\n---\n\n## Agent Persona\n\n| Endpoint | Method | Auth | Description |\n|----------|--------|------|-------------|\n| \\`/api/agents/:id/persona\\` | GET | Bearer | Current persona + mode options |\n| \\`/api/agents/:id/persona\\` | POST | Bearer | Apply persona |\n\nPOST body modes:\n\n| mode | Body extras | Notes |\n|------|-------------|-------|\n| \\`clawpump-generate\\` | — | Needs \\`cpk_\\` + linked \\`clawpumpAgentId\\` |\n| \\`clawpump-sync\\` | — | Pull persona/systemPrompt from ClawPump |\n| \\`archetype\\` | \\`{ archetype: \"storm-scout\"\\\\|\\\"vault-keeper\\\"\\\\|\\\"forge-trader\\\" }\\` | Instant WindAgents packs |\n\n\\`\\`\\`bash\ncurl -s http://localhost:3000/api/agents/AGENT_ID/persona -H \"Authorization: Bearer TOKEN\"\n\ncurl -X POST http://localhost:3000/api/agents/AGENT_ID/persona \\\\\n  -H \"Authorization: Bearer TOKEN\" -H \"Content-Type: application/json\" \\\\\n  -d '{\"mode\":\"archetype\",\"archetype\":\"storm-scout\"}'\n\\`\\`\\`\n\n---\n\n## Agent Avatar (PUT + POST)\n\n| Endpoint | Method | Auth | Description |\n|----------|--------|------|-------------|\n| \\`/api/agents/:id/avatar\\` | PUT \\| POST | Bearer | Set \\`avatarGlbUrl\\` directly **or** forge via three.ws |\n\n\\`\\`\\`bash\n# Direct GLB URL\ncurl -X PUT http://localhost:3000/api/agents/AGENT_ID/avatar \\\\\n  -H \"Authorization: Bearer TOKEN\" \\\\\n  -H \"Content-Type: application/json\" \\\\\n  -d '{\"avatarGlbUrl\":\"https://example.com/agent.glb\",\"avatarPrompt\":\"cyan wind core\"}'\n\n# Forge (same handler on POST)\ncurl -X POST http://localhost:3000/api/agents/AGENT_ID/avatar \\\\\n  -H \"Authorization: Bearer TOKEN\" \\\\\n  -H \"Content-Type: application/json\" \\\\\n  -d '{\"avatarPrompt\":\"storm orb cyan core\",\"forge\":true}'\n\\`\\`\\`\n\n---\n\n## Live 3D VTuber Studio (pump.fun & YouTube)\n\n| Endpoint | Method | Auth | Description |\n|----------|--------|------|-------------|\n| \\`/api/agents/:id/live\\` | GET / PUT | Bearer | Get or save live streaming configuration (pump.fun CA, YouTube URL, voice) |\n| \\`/api/live/pumpfun\\` | GET | None | Fetch real pump.fun token metadata & bonding curve stats (\`?mint=\`) |\n| \\`/api/live/chat/youtube\\` | POST | Optional | Resolve YouTube Live chat ID (\`{ url }\`) |\n| \\`/vrm-studio\\` | Page | Public | Interactive 3D VRM VTuber studio stage with OBS Chroma Keying |\n| \\`/guide\\` | Page | Public | Official 7-step VTuber streaming guide |\n\n\\`\\`\\`bash\n# Get live streaming config\ncurl -s http://localhost:3000/api/agents/AGENT_ID/live -H \"Authorization: Bearer TOKEN\"\n\n# Save pump.fun contract address for streaming\ncurl -X PUT http://localhost:3000/api/agents/AGENT_ID/live \\\\\n  -H \"Authorization: Bearer TOKEN\" -H \"Content-Type: application/json\" \\\\\n  -d '{\"pumpMint\":\"2PENPmfgJfq6CG3k4byj4oWwHf8SerqakmYHMkUupump\",\"voice\":\"webspeech\"}'\n\n# Fetch pump.fun token data\ncurl -s \"http://localhost:3000/api/live/pumpfun?mint=2PENPmfgJfq6CG3k4byj4oWwHf8SerqakmYHMkUupump\"\n\\`\\`\\`\n";

export const SKILL_MD_APPEND_FIX_PASS = `
---

## FIX_PASS notes (chain + launch paths)

### Token tools — chain required

\`POST /api/tools/token_search\` and \`POST /api/tools/token_retrieve\` return **400** \`{ error: "chain_required" }\` when \`chain\` is missing. Always send e.g. \`"chain":"solana"\`. \`token_retrieve\` maps \`address\` → MoonPay \`token\` without truncating Solana mints (full base58 returned).

### Claw venue → Partner POST /launch

\`POST /api/launch/claw\` proxies ClawPump Partner **\`POST /launch\`** (legacy \`/launch/claw\` and \`/launch/pump\` are upstream 404). Payment-required / selfFunded responses pass through honestly.

### PONS poll

Partner \`GET /launch/pons\` is **405** — WindAgents skips it. Prefer \`launchId\` poll via \`GET /api/agents/{id}/pons/launches?launchId=\` (platform + v1). Otherwise honest \`unavailable\` or agent \`tokenAddress\`.
`;

export const SKILL_MD_APPEND_SKILLS_LAUNCH = `
---

## ClawPump skills catalogue (WindAgents mirror) — ADDITIVE

Existing ClawPump MCP (\`/api/clawpump/mcp\`) and Partner REST (cpk_ via Settings → agents/chat/launch) are **unchanged**. This documents the skills catalogue mirror only.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| \`/api/skills\` | GET | Optional Bearer | Returns \`builtin\` (Partner public seed + WindAgents platform), \`skills\` (local DB), and \`clawpump\` block |
| \`/api/skills\` | POST | Bearer | \`{ action:"enable", agentId, skills:[...] }\` → Partner \`POST /agents/:id\` **or** save local skill (default) |
| \`/api/skills?id=\` | DELETE | Bearer | Delete own local skill |

### GET \`/api/skills\` when cpk_ connected

\`\`\`bash
curl -s http://localhost:3000/api/skills \\
  -H "Authorization: Bearer YOUR_WINDAGENTS_TOKEN"
# → { builtin:[...], skills:[...], clawpump:{ connected:true, live:true, skills:[{slug,name,description,alwaysOn}], ... } }
\`\`\`

Partner public slugs (live \`GET https://clawpump.tech/api/v1/skills\`): \`trading\`, \`perps\`, \`token-launch\`, \`portfolio\`, \`market-intelligence\`, \`social\`, \`sniper\`, \`wallet\`, \`image-generation\`.

### Enable skill on ClawPump agent

\`\`\`bash
curl -X POST http://localhost:3000/api/skills \\
  -H "Authorization: Bearer YOUR_WINDAGENTS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"action":"enable","agentId":"CLAWPUMP_OR_LINKED_LOCAL_ID","skills":["trading","token-launch","portfolio"]}'
\`\`\`

UI: \`/skills\` (ClawPump-connected badge + remote catalogue). Launch/Tokenize: \`/launch\` (alias \`/tokenize\`).

**No secrets in skill.md.** Put \`cpk_\` only in Settings.
`;

export const SKILL_MD_APPEND_GAP_PASS = `
---

## Skills catalogue expansion (additive) — GAP pass

### Per-user keys only

Every registrant saves **their own** \`cpk_\` / \`pbx_\` / Helius key in Settings (\`PUT /api/settings\`). WindAgents never ships platform test keys in skill.md, env defaults, or server-wide config.

### GET \`/api/skills\` shape (expanded)

\`\`\`bash
curl -s http://localhost:3000/api/skills
# → builtin, skills, clawpump, clawpumpDocsExtra, threeWs, meta
\`\`\`

| Field | Meaning |
|-------|---------|
| \`clawpump\` | Partner seed offline; live \`GET /skills\` when Bearer + user's \`cpk_\` |
| \`clawpumpDocsExtra\` | Docs marketing / ambient skills (~15 built-in on clawpump.tech/docs) — pointers |
| \`threeWs.skills\` | pump-fun-skills install URLs (create-coin, swap, coin-fees, tokenized-agents, reactive) |
| \`meta.partnerPublicSlugs\` | Enableable Partner slugs: trading, perps, token-launch, portfolio, market-intelligence, social, sniper, wallet, image-generation |
| \`meta.mcpNotes\` | Agent MCP ~122–126 tools; Launchpad 78; OAuth host rejects cpk_ |

### Enable (Partner only)

\`POST /api/skills { action:"enable", agentId, skills:[...] }\` — Partner public slugs only. three.ws / docs-pointer slugs return \`not_partner_enableable\`.

### three.ws install pointers (raw SKILL.md)

- https://raw.githubusercontent.com/nirholas/three.ws/main/pump-fun-skills/create-coin/SKILL.md
- https://raw.githubusercontent.com/nirholas/three.ws/main/pump-fun-skills/swap/SKILL.md
- https://raw.githubusercontent.com/nirholas/three.ws/main/pump-fun-skills/coin-fees/SKILL.md
- https://raw.githubusercontent.com/nirholas/three.ws/main/pump-fun-skills/tokenized-agents/SKILL.md
- https://raw.githubusercontent.com/nirholas/three.ws/main/pump-fun-skills/reactive/SKILL.md

UI: \`/skills\`. Launch/Tokenize: \`/launch\` (alias \`/tokenize\`). Dock label **Tokenize**.

### Contributor note (not end-user runtime)

\`mcp.solana.com\` and Sendai Solana Agent Kit / MCP Adapter are optional for **builders** editing WindAgents — document in AGENTS.md. Do not require them for skill.md registrants.
`;

export const SKILL_MD_APPEND_SETTINGS_TABS = `
---

## Settings vault fields (no secrets) — ADDITIVE

Every skill.md registrant uses **their own** keys in \`/settings\`. WindAgents never ships a shared platform \`cpk_\`.

| Field / flag | Storage | Notes |
|--------------|---------|-------|
| \`displayName\` | users column | Profile / community |
| \`payoutWallet\` | users column | Rewards / payouts |
| \`walletAddress\` | users column | Readonly in UI when set at register |
| \`moonpayEmail\` | users column | Optional discovery contact (not a vault secret) |
| \`clawpumpApiKey\` (\`cpk_\`) | AES vault → \`hasClawpump\` | Partner agents / skills / launch |
| \`payboxApiKey\` (\`pbx_\`) | AES vault → \`hasPaybox\` | PayBox MCP depth |
| \`heliusApiKey\` | AES vault → \`hasHelius\` | Optional personal Helius |
| \`solanaRpcUrl\` | AES vault → \`hasSolanaRpc\` | Optional RPC override (may embed key) |
| \`jupiterQuoteUrl\` | AES vault → \`hasJupiterQuoteUrl\` | Optional; quotes work without key |
| \`jupiterApiKey\` | AES vault → \`hasJupiterApiKey\` | Optional; execute uses PayBox |
| X verify | \`verifications\` | \`WIND-\` tweet flow |
| Uploads | \`uploads\` | Avatar / banner via \`/api/upload\` |

\`GET /api/settings\` returns masked flags only (\`hasClawpump\`, \`hasPaybox\`, \`hasHelius\`, \`hasSolanaRpc\`, \`hasJupiterQuoteUrl\`, \`hasJupiterApiKey\`) — never raw keys.

### New UI tabs / hubs

| Page | Path |
|------|------|
| Settings (full sections) | \`/settings\` |
| Integrations hub | \`/integrations\` |
| x402 info + record | \`/x402\` |
| Tokenize hub (not alias) | \`/tokenize\` — venues + **WindAgents Agents** desk + three.ws; Confirm at \`/launch\` |
| Optional vault | \`solanaRpcUrl\`, \`jupiterQuoteUrl\`, \`jupiterApiKey\` (masked flags on GET) |

Orbital dock **Tokenize** → \`/tokenize\`. **More** includes **Agents desk**, **x402**, and **Integrations**.
`;

export const SKILL_MD_APPEND_LAUNCH_PARITY = `
---

## Launch parity (self-funded / pools / fees) — ADDITIVE

Gasless first-3 is **retired**. Claw venue = Partner \`POST /launch\` (payment may be required). Per-user \`cpk_\` only — never put secrets in skill.md.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| \`/api/launch/self-funded\` | GET | Bearer + cpk_ | Cost estimate; optional \`?quoteMint=\` |
| \`/api/launch/self-funded\` | POST | Bearer + cpk_ | \`preflight:true\` → pay → retry with \`txSignature\` + \`preflightToken\` |
| \`/api/launch/pools\` | POST | Bearer + cpk_ | Uniswap via pools.trade; pass \`Idempotency-Key\` on retries |
| \`/api/launch/pump-pairs\` | GET | Bearer + cpk_ | Pair picker for \`pumpQuoteMint\` + \`creatorFeeBps\` |
| \`/api/fees/earnings\` | GET | Bearer + cpk_ | \`?agentId=\` platform fees read (honest if upstream missing) |

UI: \`/launch\` — pump-pairs picker, self-funded quote flow, poll pump/claw via \`GET /api/launch/claw\`.
`;

export const SKILL_MD_APPEND_AGENTS_DESK = `
---

## WindAgents Agents desk — ADDITIVE

Every skill.md registrant can use **platform** WindAgents agents — not only ClawPump remotes — from the dashboard **or** agent chat via this skill.md. Per-user keys only: never put \`cpk_\` / \`pbx_\` / Helius / RPC secrets in skill.md.

### UI

| Page | Path |
|------|------|
| Tokenize hub + Agents desk | \`/tokenize\` (section \`#wa-agents\`) |
| Launch Confirm | \`/launch\` |
| Agents gallery | \`/agents\` |
| Settings vault | \`/settings\` |

Dock **Tokenize** → \`/tokenize\`. More → **Agents desk**.

### Create / list / skills / launch (own cpk_)

\`\`\`bash
# List local WindAgents agents (+ clawpump.remote when cpk_ connected)
curl -s http://localhost:3000/api/agents \\
  -H "Authorization: Bearer YOUR_WINDAGENTS_TOKEN"

# Create local agent
curl -X POST http://localhost:3000/api/agents \\
  -H "Authorization: Bearer YOUR_WINDAGENTS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"My WA Agent","persona":"Launch + trade carefully","skills":["trading","token-launch","portfolio"]}'
\`\`\`
`;

export const SKILL_MD_APPEND_SPLIT_DESKS = `
---

## Split desks: WindAgents vs ClawPump.tech — ADDITIVE correction

### Settings vault (registrants)

User Settings vault keys are **\`cpk_\` / \`pbx_\`** (+ profile, MoonPay email, X verify, uploads).

**Helius / Jupiter / Solana RPC are server env** (\`HELIUS_API_KEY\`, \`SOLANA_RPC_URL\`, Jupiter quote URL) — set by the **operator**, not required in every user's Settings vault.

### Tokenize UI tabs

| Tab | Path | Auth | Purpose |
|-----|------|------|---------|
| **WindAgents** (default) | \`/tokenize\` or \`/tokenize?tab=windagents\` | Bearer only | Registry agents desk: list/create, local skills PATCH, profiles |
| **ClawPump.tech** | \`/tokenize?tab=clawpump\` | Bearer + \`cpk_\` | Venue cards, Launch Confirm, self-funded/fees, ClawPump MCP tools/list |

Dock **Tokenize** → \`/tokenize\` (WindAgents tab).
`;

export const SKILL_MD_APPEND_TOKENIZE_PARITY = `
---

## Tokenize parity — WindAgents + ClawPump.tech dual path — ADDITIVE

Registrants can tokenize the same way as clawpump.tech without deleting either desk.

### Dual path

| Path | UI | Auth |
|------|-----|------|
| **WindAgents desk** | \`/tokenize?tab=windagents\` | Bearer; real mint needs your \`cpk_\` |
| **ClawPump.tech tab** | \`/tokenize?tab=clawpump\` | Bearer + \`cpk_\` — venues, Confirm, fees |

Both reuse **Launch Confirm** \`/launch?venue=pump|self-funded|pons|pools|claw\`.
`;

export const SKILL_MD_APPEND_TWITTER_VERIFY = `
---

## Optional X / Twitter Verification — ADDITIVE SUPERSEDES

Verification matches AnsemRail: share a post with your \`WIND-\` code + agent profile URL, then submit the tweet URL.

Default profile URL: \`https://windwrtest.vercel.app/agents/YOUR_AGENT_ID\`.

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| \`/api/verify\` | GET | Bearer | Status: verified / handle / pendingCode |
| \`/api/verify\` | POST | Bearer | \`{ action:"start" }\` or \`{ action:"verify", tweetUrl }\` |
`;

export const SKILL_MD_APPEND_SHARE_CARD = `
---

## X share card + AnsemRail-parity verify (additive)

Open Graph / Twitter Card tags serve \`/og-cover.jpg\` (\`summary_large_image\`).
`;

export const SKILL_MD_APPEND_DURABLE_DB = `
---

## Production registry (Upstash — additive)

Vercel Production uses Redis Cloud or Upstash Redis when configured (\`REDIS_URL\` / \`UPSTASH_REDIS_REST_URL\`).
`;

export const SKILL_MD_APPEND_AGENTS_START = `
---

## AGENTS — START HERE (read first — overrides everything below)

Base: \`https://windwrtest.vercel.app\`

### 1) Register

\`\`\`bash
curl -s -X POST https://windwrtest.vercel.app/api/register/agent \\
  -H "Content-Type: application/json" \\
  -d '{"name":"YourAgentName","skillMdContent":"# your skill"}'
\`\`\`

Read the JSON. It includes unique \`agentId\`, full \`agentToken\` (\`wa1.\` … entire string), \`authorization\`, \`profileUrl\`, \`loginUrl\`, \`claimCode\`, \`claimLoginUrl\`, and **\`chatReply\`**.
`;

export const SKILL_MD_APPEND_LOGIN_TOKEN = `
---

## Registration expose (reminder)

Paste \`chatReply\` exactly: Name, agentId, full \`wa1.\` agentToken, Authorization Bearer, Profile, Login, plus \`claimCode\` / \`claimLoginUrl\`.
`;

export const SKILL_MD_APPEND_COMBINED = SKILL_MD_APPEND + SKILL_MD_APPEND_FIX_PASS + SKILL_MD_APPEND_SKILLS_LAUNCH + SKILL_MD_APPEND_GAP_PASS + SKILL_MD_APPEND_SETTINGS_TABS + SKILL_MD_APPEND_LAUNCH_PARITY + SKILL_MD_APPEND_AGENTS_DESK + SKILL_MD_APPEND_SPLIT_DESKS + SKILL_MD_APPEND_TOKENIZE_PARITY + SKILL_MD_APPEND_TWITTER_VERIFY + SKILL_MD_APPEND_SHARE_CARD + SKILL_MD_APPEND_DURABLE_DB + SKILL_MD_APPEND_LOGIN_TOKEN;

export const SKILL_MD_MCP_BRIDGE_NOTE = `
---

## ClawPump MCP (cpk_ REST bridge) — WindAgents TRUTH

- Official \`mcp.clawpump.tech\` = **OAuth-only**; rejects \`cpk_\`
- WindAgents proxy uses Partner REST (\`clawpump.tech/api/v1\`) with \`cpk_\` saved in Settings.
`;
