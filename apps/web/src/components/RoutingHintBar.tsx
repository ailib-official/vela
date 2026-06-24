import { suggestModel, type RoutingSuggestion } from '../lib/routingHint';
import { isSmartRoutingLive, smartRoutingStatusLabel } from '../lib/smartRouting';
import type { WasmRuntime } from '../lib/wasmLoader';

interface Props {
  prompt: string;
  availableModels: string[];
  currentModel: string;
  wasm: WasmRuntime | null;
  wasmLoading: boolean;
  prismSuggestion: RoutingSuggestion | null;
  prismLoading: boolean;
  onApply: (modelId: string) => void;
}

export function RoutingHintBar({
  prompt,
  availableModels,
  currentModel,
  wasm,
  wasmLoading,
  prismSuggestion,
  prismLoading,
  onApply,
}: Props) {
  const heuristic = suggestModel(prompt, availableModels, currentModel, wasm);
  const suggestion =
    isSmartRoutingLive() && prismSuggestion ? prismSuggestion : heuristic;

  if (!suggestion) {
    if (prismLoading) {
      return <p className="routing-hint loading">Prism routing…</p>;
    }
    if (wasmLoading) {
      return <p className="routing-hint loading">Loading WASM routing…</p>;
    }
    return null;
  }

  const isPrism = suggestion.source === 'prism';

  return (
    <div className="routing-hint" role="status">
      <span>
        Suggested: <code>{suggestion.modelId}</code> — {suggestion.reason}
        {isPrism ? (
          <span className="prism-badge">{smartRoutingStatusLabel()}</span>
        ) : (
          <span className="interim-badge">{smartRoutingStatusLabel()}</span>
        )}
        {suggestion.wasmActive && <span className="wasm-badge">WASM</span>}
      </span>
      {suggestion.modelId !== currentModel && (
        <button type="button" onClick={() => onApply(suggestion.modelId)}>
          Use
        </button>
      )}
    </div>
  );
}
