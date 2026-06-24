/**
 * Prism `POST /v1/route/decide` client (PR-V2-006 / PR-P2-003).
 *
 * Server-side route decision; falls back to WASM heuristics on error.
 */

import type { RoutingSuggestion } from './routingHint';

export type OptimizeMode = 'cost' | 'latency' | 'balanced';

export interface RouteDecideResult {
  model: string;
  provider_id: string;
  reason: string;
  estimated_cost_per_1k_prompt_usd: number;
  fallback_chain: string[];
  disclaimer: string;
}

export interface PrismHttpConfig {
  baseUrl: string;
  apiKey: string;
}

export async function decideRoute(
  config: PrismHttpConfig,
  request: {
    model: string;
    messages?: Array<{ role: string; content: string }>;
    optimize?: OptimizeMode;
  },
): Promise<RouteDecideResult> {
  const base = config.baseUrl.replace(/\/$/, '');
  const url = base ? `${base}/v1/route/decide` : '/v1/route/decide';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      preferences: { optimize: request.optimize ?? 'cost' },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`route/decide ${res.status}: ${body}`);
  }
  return (await res.json()) as RouteDecideResult;
}

export function toRoutingSuggestion(result: RouteDecideResult): RoutingSuggestion {
  return {
    modelId: result.model,
    reason: `${result.reason} (${result.provider_id})`,
    wasmActive: false,
    source: 'prism',
    providerId: result.provider_id,
    disclaimer: result.disclaimer,
  };
}
