import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPrismClient } from '../lib/config';
import {
  MAX_COMPARE_MODELS,
  MIN_COMPARE_MODELS,
  runModelComparison,
  type CompareColumnState,
} from '../lib/compare';

interface Props {
  availableModels: string[];
  defaultModels: string[];
}

function formatMs(ms: number | null): string {
  if (ms === null) return '—';
  return `${ms} ms`;
}

export function ComparePanel({ availableModels, defaultModels }: Props) {
  const prism = useMemo(() => createPrismClient(), []);
  const [selected, setSelected] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [columns, setColumns] = useState<CompareColumnState[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selected.length > 0) return;
    const picks = defaultModels.filter((id) => availableModels.includes(id));
    if (picks.length >= MIN_COMPARE_MODELS) {
      setSelected(picks.slice(0, MAX_COMPARE_MODELS));
      return;
    }
    setSelected(availableModels.slice(0, Math.min(MAX_COMPARE_MODELS, availableModels.length)));
  }, [availableModels, defaultModels, selected.length]);

  const toggleModel = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) {
        return prev.filter((m) => m !== id);
      }
      if (prev.length >= MAX_COMPARE_MODELS) return prev;
      return [...prev, id];
    });
  };

  const run = useCallback(async () => {
    if (selected.length < MIN_COMPARE_MODELS) {
      setError(`Select at least ${MIN_COMPARE_MODELS} models.`);
      return;
    }
    setError(null);
    setRunning(true);
    setColumns(
      selected.map((modelId) => ({
        modelId,
        content: '',
        streaming: true,
        error: null,
        firstTokenMs: null,
        doneMs: null,
      })),
    );
    try {
      await runModelComparison(prism, selected, prompt, setColumns);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Compare failed');
      setColumns([]);
    } finally {
      setRunning(false);
    }
  }, [prism, prompt, selected]);

  return (
    <div className="compare-panel">
      <header className="compare-header">
        <h1>Model comparison</h1>
        <p className="subtitle">Same prompt, parallel streams via Prism</p>
      </header>

      <section className="compare-models">
        <h2 className="section-label">Models ({selected.length}/{MAX_COMPARE_MODELS})</h2>
        <div className="model-chips">
          {availableModels.map((id) => {
            const active = selected.includes(id);
            const disabled = !active && selected.length >= MAX_COMPARE_MODELS;
            return (
              <button
                key={id}
                type="button"
                className={active ? 'chip active' : 'chip'}
                onClick={() => toggleModel(id)}
                disabled={running || disabled}
              >
                {id}
              </button>
            );
          })}
        </div>
      </section>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <form
        className="compare-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void run();
        }}
      >
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Prompt to send to all selected models…"
          rows={3}
          disabled={running}
        />
        <button type="submit" disabled={running || !prompt.trim() || selected.length < MIN_COMPARE_MODELS}>
          {running ? 'Comparing…' : 'Compare'}
        </button>
      </form>

      {columns.length > 0 && (
        <div className={`compare-grid cols-${columns.length}`}>
          {columns.map((col) => (
            <article key={col.modelId} className="compare-column">
              <header>
                <h3>{col.modelId}</h3>
                <dl className="compare-metrics">
                  <div>
                    <dt>TTFT</dt>
                    <dd>{formatMs(col.firstTokenMs)}</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{formatMs(col.doneMs)}</dd>
                  </div>
                </dl>
              </header>
              {col.error && <p className="col-error">{col.error}</p>}
              <div className="compare-content" aria-live="polite">
                {col.content || (col.streaming ? '…' : '')}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
