import { suggestModel, type RoutingSuggestion } from '../lib/routingHint';
import type { WasmRuntime } from '../lib/wasmLoader';

interface Props {
  prompt: string;
  availableModels: string[];
  currentModel: string;
  wasm: WasmRuntime | null;
  wasmLoading: boolean;
  onApply: (modelId: string) => void;
}

export function RoutingHintBar({
  prompt,
  availableModels,
  currentModel,
  wasm,
  wasmLoading,
  onApply,
}: Props) {
  const suggestion: RoutingSuggestion | null = suggestModel(
    prompt,
    availableModels,
    currentModel,
    wasm,
  );

  if (!suggestion) {
    if (wasmLoading) {
      return <p className="routing-hint loading">Loading WASM routing…</p>;
    }
    return null;
  }

  return (
    <div className="routing-hint" role="status">
      <span>
        Suggested: <code>{suggestion.modelId}</code> — {suggestion.reason}
        {suggestion.wasmActive && <span className="wasm-badge">WASM</span>}
      </span>
      <button type="button" onClick={() => onApply(suggestion.modelId)}>
        Use
      </button>
    </div>
  );
}
