/**
 * Smart routing feature gate (PR-V2-004 placeholder).
 *
 * Prism P2 自动路由门控；当前仅用 PR-V2-003 启发式。
 */

export const SMART_ROUTING_GATES = {
  pt073ProtocolRc: false,
  prismPhase2Billing: false,
  prPp002CostRouting: false,
} as const;

export type InterimRoutingMode = 'wasm-heuristics';

export const INTERIM_ROUTING_MODE: InterimRoutingMode = 'wasm-heuristics';

export function isSmartRoutingLive(): boolean {
  const g = SMART_ROUTING_GATES;
  return g.pt073ProtocolRc && g.prismPhase2Billing && g.prPp002CostRouting;
}

export function smartRoutingStatusLabel(): string {
  if (isSmartRoutingLive()) return 'Prism auto-routing';
  return 'Interim (WASM + heuristics)';
}
