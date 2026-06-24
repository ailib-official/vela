/**
 * Smart routing feature gate (PR-V2-004 / PR-V2-005).
 *
 * Prism P2 自动路由门控。PT-073 Contact 元数据为软增强，不阻塞基础 auto-route。
 */

export const SMART_ROUTING_GATES = {
  /** Soft — ExecutionMetadata / Contact hints (PT-073); optional enrichment */
  pt073ProtocolRc: false,
  /** PR-PP-002 + PR-P2-003 — cost routing + POST /v1/route/decide */
  prPp002CostRouting: true,
  /** PR-P2-004 — pay-per-use billing + margin */
  prismPhase2Billing: true,
  /** PR-P2-005 — latency / balanced optimize modes GA */
  prismSmartRoutingGa: true,
} as const;

export type InterimRoutingMode = 'wasm-heuristics';

export const INTERIM_ROUTING_MODE: InterimRoutingMode = 'wasm-heuristics';

/** Prism P2 core deliverables live; PT-073 not in AND chain (soft dependency). */
export function isSmartRoutingLive(): boolean {
  const g = SMART_ROUTING_GATES;
  return g.prPp002CostRouting && g.prismPhase2Billing && g.prismSmartRoutingGa;
}

export function smartRoutingStatusLabel(): string {
  if (isSmartRoutingLive()) return 'Prism auto-routing';
  return 'Interim (WASM + heuristics)';
}
