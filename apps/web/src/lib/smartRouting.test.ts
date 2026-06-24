import { describe, expect, it } from 'vitest';
import {
  isSmartRoutingLive,
  SMART_ROUTING_GATES,
  smartRoutingStatusLabel,
} from './smartRouting';

describe('smartRouting', () => {
  it('is live after Prism P2 core gates (billing, cost route, smart routing GA)', () => {
    expect(isSmartRoutingLive()).toBe(true);
    expect(SMART_ROUTING_GATES.prPp002CostRouting).toBe(true);
    expect(SMART_ROUTING_GATES.prismPhase2Billing).toBe(true);
    expect(SMART_ROUTING_GATES.prismSmartRoutingGa).toBe(true);
  });

  it('PT-073 remains soft (not required for isSmartRoutingLive)', () => {
    expect(SMART_ROUTING_GATES.pt073ProtocolRc).toBe(false);
    expect(isSmartRoutingLive()).toBe(true);
  });

  it('reports Prism auto-routing label when live', () => {
    expect(smartRoutingStatusLabel()).toBe('Prism auto-routing');
  });
});
