import { useEffect, useMemo, useState } from 'react';
import { getPrismHttpConfig, routeOptimizeMode } from '../lib/config';
import { decideRoute, toRoutingSuggestion } from '../lib/decideRoute';
import type { RoutingSuggestion } from '../lib/routingHint';
import { isSmartRoutingLive } from '../lib/smartRouting';

const DEBOUNCE_MS = 400;

export function usePrismRouteDecide(
  prompt: string,
  model: string,
  history: Array<{ role: string; content: string }>,
) {
  const [suggestion, setSuggestion] = useState<RoutingSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const httpConfig = useMemo(() => {
    try {
      return getPrismHttpConfig();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!isSmartRoutingLive() || !httpConfig || !model || !prompt.trim()) {
      setSuggestion(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      const trimmed = prompt.trim();
      void decideRoute(httpConfig, {
        model,
        messages: [...history, { role: 'user', content: trimmed }],
        optimize: routeOptimizeMode(),
      })
        .then((result) => {
          if (cancelled) return;
          const mapped = toRoutingSuggestion(result);
          if (mapped.modelId === model) {
            setSuggestion(null);
          } else {
            setSuggestion(mapped);
          }
        })
        .catch(() => {
          if (!cancelled) setSuggestion(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [prompt, model, history, httpConfig]);

  return { suggestion, loading };
}
