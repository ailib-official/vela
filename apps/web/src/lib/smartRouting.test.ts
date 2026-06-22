import { describe, expect, it } from 'vitest';
import { isSmartRoutingLive, smartRoutingStatusLabel } from './smartRouting';

describe('smartRouting', () => {
  it('is not live until Prism P2 gates clear', () => {
    expect(isSmartRoutingLive()).toBe(false);
  });

  it('reports interim mode label', () => {
    expect(smartRoutingStatusLabel()).toContain('Interim');
  });
});
