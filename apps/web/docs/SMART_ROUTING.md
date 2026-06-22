# Smart model routing (PR-V2-004) — design placeholder

> **Status**: Placeholder until Prism Phase 2 gate clears  
> **Gate**: PT-073 (protocol RC) + PR-PP-002 (cost routing example) + Prism P2 billing  
> **Interim**: PR-V2-003 WASM + TypeScript heuristics (`routingHint.ts`)

## Goal

Vela should eventually recommend models using **Prism smart routing** signals (latency, cost, health, usage), not only client-side heuristics.

## Current state (Phase 2 Wave 4 placeholder)

| Layer | Capability | Status |
|-------|------------|--------|
| Client heuristics | `routingHint.ts` — length/code/cost | ✅ Live (PR-V2-003) |
| WASM protocol | `ailib_invoke` capabilities gate | ✅ Live (PR-V2-003) |
| Prism `/admin/health` | Provider latency/success (admin token) | Optional dev only |
| Prism auto-route API | Server-side route decision | **Not live** (gated) |

## Future integration contract (draft)

When Prism P2 exposes auto-routing (exact path TBD with gateway team):

```http
POST /v1/route/decide
Authorization: Bearer <gateway-key>
Content-Type: application/json

{
  "messages": [{ "role": "user", "content": "..." }],
  "preferences": { "optimize": "cost" | "latency" | "balanced" }
}
```

Expected response:

```json
{
  "model": "deepseek-chat",
  "provider_id": "deepseek",
  "reason": "lowest_cost",
  "fallback_chain": ["deepseek", "openai"]
}
```

Vela client flow:

1. User types prompt → call `decide` (or batch with debounce)
2. Show recommendation in UI (replaces interim `RoutingHintBar` badge)
3. On send, use returned `model` unless user overrides
4. On 429/5xx from `classify_error` WASM helper → surface retryable + suggest fallback from `fallback_chain`

## Dependencies

| ID | Repo | Role |
|----|------|------|
| PT-073 | ai-protocol | Protocol RC for Contact/routing metadata |
| PR-PP-002 | prism | Cost routing example (not production SLA) |
| PR-P1-014 | ai-lib-gateway | Admin/usage surfaces (optional signals) |

## UI stub (this PR)

- `SmartRoutingBanner` — "Auto routing coming soon" with gate checklist
- `RoutingHintBar` — labelled **Interim** until `isSmartRoutingLive()` is true
- Feature flag: `smartRouting.ts` → `isSmartRoutingLive(): false`

## Out of scope until gate clears

- Calling a non-existent `/v1/route/decide` in production
- Billing/quota integration (Prism P2)
- Multi-tenant usage history on client

## References

- `apps/web/docs/WASM.md` — WASM asset refresh
- `ai-lib-plans/active/projects/vela/PHASE2_PLAN.md` — Wave 4 gate
- `ai-lib-plans/active/projects/prism/tasks/PR-PP-002-cost-routing-example.yaml`
