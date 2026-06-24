# Smart model routing (PR-V2-004 / PR-V2-005)

> **Status**: **Prism P2 gate cleared** — `isSmartRoutingLive()` true (2026-06-24)  
> **Soft gate**: PT-073 Contact metadata — still `false`; optional enrichment  
> **Fallback**: PR-V2-003 WASM + TypeScript heuristics when decide API unavailable

## Goal

Vela recommends models using **Prism smart routing** signals (latency, cost, health), with client heuristics as fallback.

## Gate checklist (updated 2026-06-24)

| Gate | Task | Status |
|------|------|--------|
| `prPp002CostRouting` | PR-PP-002 + PR-P2-003 `/v1/route/decide` | ✅ Live |
| `prismPhase2Billing` | PR-P2-004 billing + margin | ✅ Live |
| `prismSmartRoutingGa` | PR-P2-005 cost \| latency \| balanced | ✅ Live |
| `pt073ProtocolRc` | PT-073 protocol RC + Contact metadata | ⏳ Soft — not blocking |

Implementation: `apps/web/src/lib/smartRouting.ts`

> **NOT PRODUCTION SLA**: Cost/latency routing is best-effort until product SLA policies are published (see Prism `PR-PP-002`).

## Current state

| Layer | Capability | Status |
|-------|------------|--------|
| Prism `/v1/route/decide` | Server-side route decision | ✅ Live (cost, latency, balanced) |
| Prism billing | µUSD + margin | ✅ Live |
| Client heuristics | `routingHint.ts` | ✅ Fallback |
| WASM protocol | `ailib_invoke` capabilities | ✅ Live |
| PT-073 Contact hints | ExecutionMetadata routing | ⏳ Future |

## Integration contract

```http
POST https://api.prism.ailib.info/v1/route/decide
Authorization: Bearer <gateway-key>
Content-Type: application/json

{
  "messages": [{ "role": "user", "content": "..." }],
  "preferences": { "optimize": "cost" | "latency" | "balanced" }
}
```

Response:

```json
{
  "model": "deepseek-chat",
  "provider_id": "deepseek",
  "reason": "lowest_cost",
  "fallback_chain": ["deepseek", "groq"]
}
```

Vela client flow (next PR — wire-up):

1. User types prompt → call `decide` (debounced)
2. Show recommendation in UI (`RoutingHintBar` — no longer Interim-only)
3. On send, use returned `model` unless user overrides
4. On 429/5xx → WASM `classify_error` + `fallback_chain`

## UI (this wave)

- `SmartRoutingBanner` — hidden when `isSmartRoutingLive()` (gate cleared)
- `RoutingHintBar` — shows **Prism auto-routing** label
- Feature gate: `smartRouting.ts` → `isSmartRoutingLive(): true`

## Out of scope (follow-up)

- Production `decide` client call in ChatPanel (separate wire-up PR)
- Pack manifest consumption (`PR-PP-001` schema only today)
- PT-073 Contact metadata in decide request

## References

- `apps/web/docs/WASM.md`
- `ai-lib-plans/active/projects/prism/PHASE2_PLAN.md`
- `ai-lib-gateway/docs/COST_ROUTING.md`
- Prism merges: gateway #10–#13, eos #14–#18, ai-protocol #10
