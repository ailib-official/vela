/**
 * A-band routing hints — WASM-gated heuristics over available models.
 *
 * A 层路由建议：WASM 可用时走协议层校验，启发式选模型。
 */

import { MODEL_HINTS } from './providerMeta';
import type { WasmRuntime } from './wasmLoader';

export interface RoutingSuggestion {
  modelId: string;
  reason: string;
  wasmActive: boolean;
}

function largestContextModel(available: string[]): string | undefined {
  return [...available].sort(
    (a, b) => (MODEL_HINTS[b]?.contextWindow ?? 0) - (MODEL_HINTS[a]?.contextWindow ?? 0),
  )[0];
}

function cheapestModel(available: string[]): string | undefined {
  return (
    available.find((id) => MODEL_HINTS[id]?.pricingHint === '$') ?? available[0]
  );
}

export function suggestModel(
  prompt: string,
  availableModels: string[],
  currentModel: string,
  wasm: WasmRuntime | null,
): RoutingSuggestion | null {
  if (!availableModels.length) return null;
  const text = prompt.trim();
  if (!text) return null;

  const wasmActive = wasm !== null;
  let modelId: string | undefined;
  let reason = 'Heuristic routing';

  if (text.length > 12_000) {
    modelId = largestContextModel(availableModels);
    reason = 'Long prompt — large context window';
  } else if (/```|function\s+\w+|def\s+\w+|class\s+\w+/.test(text)) {
    modelId =
      availableModels.find((id) => id.includes('gpt-4o') || id.includes('claude')) ??
      availableModels[0];
    reason = 'Code-like content — capable model';
  } else if (text.length < 240) {
    modelId = cheapestModel(availableModels);
    reason = 'Short prompt — cost-efficient model';
  }

  if (!modelId || modelId === currentModel) return null;

  if (wasmActive && wasm) {
    try {
      const raw = wasm.invoke('capabilities');
      const caps = JSON.parse(raw) as { ops?: string[] };
      if (!caps.ops?.includes('build_request')) return null;
    } catch {
      return null;
    }
  }

  return { modelId, reason, wasmActive };
}
