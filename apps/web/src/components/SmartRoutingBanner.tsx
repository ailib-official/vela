import { isSmartRoutingLive, smartRoutingStatusLabel } from '../lib/smartRouting';

export function SmartRoutingBanner() {
  if (isSmartRoutingLive()) return null;

  return (
    <aside className="smart-routing-banner" role="note">
      <div className="smart-routing-banner-head">
        <strong>Smart auto-routing</strong>
        <span className="coming-soon-pill">Coming soon</span>
      </div>
      <p>
        Prism server-side route decisions (cost/latency/health) are gated on PT-073 and
        Prism Phase 2. Until then, suggestions use{' '}
        <span className="interim-label">{smartRoutingStatusLabel()}</span>.
      </p>
      <p className="smart-routing-doc">
        Design: <code>apps/web/docs/SMART_ROUTING.md</code>
      </p>
    </aside>
  );
}
