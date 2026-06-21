import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPrismClient, formatPrismError } from '../lib/config';
import {
  loadProviderNavigation,
  sortProviderList,
  type ProviderView,
  type SortMode,
} from '../lib/providerNavigation';

interface Props {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onReady?: (defaultModelId: string) => void;
}

const STATUS_LABEL: Record<ProviderView['status'], string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  down: 'Down',
  unknown: 'Unknown',
};

function formatLatency(ms?: number): string {
  if (ms === undefined || Number.isNaN(ms)) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatContext(tokens?: number): string {
  if (!tokens) return '';
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M ctx`;
  if (tokens >= 1000) return `${Math.round(tokens / 1000)}k ctx`;
  return `${tokens} ctx`;
}

export function ProviderNav({ selectedModel, onSelectModel, onReady }: Props) {
  const prism = useMemo(() => createPrismClient(), []);
  const [providers, setProviders] = useState<ProviderView[]>([]);
  const [sort, setSort] = useState<SortMode>('name');
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loadProviderNavigation(prism);
      setProviders(result.providers);
      setOffline(result.offline);
      setError(result.error);
      if (result.defaultModelId) {
        onReady?.(result.defaultModelId);
      }
    } catch (e) {
      setOffline(true);
      setError(formatPrismError(e));
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [prism, onReady]);

  useEffect(() => {
    void load();
  }, [load]);

  const sorted = useMemo(
    () => sortProviderList(providers, sort),
    [providers, sort],
  );

  return (
    <aside className={`provider-nav${collapsed ? ' collapsed' : ''}`}>
      <header className="provider-nav-header">
        <div>
          <h2>Providers</h2>
          {offline && (
            <span className="offline-pill" title="Cannot reach Prism API">
              Offline
            </span>
          )}
        </div>
        <div className="provider-nav-actions">
          <label className="sort-row">
            <span className="sr-only">Sort</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              disabled={loading || offline}
              aria-label="Sort providers"
            >
              <option value="name">Name</option>
              <option value="latency">Latency</option>
              <option value="cost">Cost</option>
            </select>
          </label>
          <button
            type="button"
            className="collapse-toggle"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
          >
            {collapsed ? 'Show' : 'Hide'}
          </button>
          <button
            type="button"
            className="refresh-btn"
            onClick={() => void load()}
            disabled={loading}
            title="Refresh providers"
          >
            ↻
          </button>
        </div>
      </header>

      {error && (
        <p className="provider-nav-error" role="alert">
          {error}
        </p>
      )}

      {!collapsed && (
        <div className="provider-cards">
          {loading && <p className="placeholder">Loading providers…</p>}
          {!loading &&
            sorted.map((p) => (
              <article
                key={p.id}
                className={`provider-card status-${p.status}`}
              >
                <div className="provider-card-head">
                  <h3>{p.name}</h3>
                  <span className={`status-badge ${p.status}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>
                <dl className="provider-metrics">
                  <div>
                    <dt>Latency</dt>
                    <dd>{formatLatency(p.avgLatencyMs)}</dd>
                  </div>
                  {p.successRate !== undefined && (
                    <div>
                      <dt>Success</dt>
                      <dd>{Math.round(p.successRate * 100)}%</dd>
                    </div>
                  )}
                </dl>
                {p.models.length === 0 ? (
                  <p className="no-models">No models available</p>
                ) : (
                  <ul className="model-list">
                    {p.models.map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          className={
                            m.id === selectedModel ? 'model-btn active' : 'model-btn'
                          }
                          onClick={() => onSelectModel(m.id)}
                          disabled={offline}
                        >
                          <span className="model-id">{m.id}</span>
                          {formatContext(m.contextWindow) && (
                            <span className="model-meta">
                              {formatContext(m.contextWindow)}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
        </div>
      )}
    </aside>
  );
}
