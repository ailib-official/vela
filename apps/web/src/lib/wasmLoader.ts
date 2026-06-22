/**
 * Lazy loader for vendored ailib-wasm-browser (src/vendor/wasm).
 *
 * ailib-wasm-browser 懒加载（vendor 目录）。
 */

export interface WasmRuntime {
  abiVersion: number;
  invoke(op: string, fields?: Record<string, unknown>): string;
  classifyRetryable(status: number): boolean;
}

let runtime: WasmRuntime | null = null;
let loadPromise: Promise<WasmRuntime | null> | null = null;

async function loadModule(): Promise<WasmRuntime | null> {
  try {
    const mod = await import('../vendor/wasm/ailib_wasm.js');
    await mod.default();
    const abiRaw = mod.ailib_invoke(JSON.stringify({ op: 'abi_version' }));
    const abi = JSON.parse(abiRaw) as { version: number };
    return {
      abiVersion: abi.version,
      invoke: (op, fields = {}) =>
        mod.ailib_invoke(JSON.stringify({ op, ...fields })),
      classifyRetryable: (status) => {
        const raw = mod.ailib_invoke(
          JSON.stringify({ op: 'classify_error', status_code: status }),
        );
        const parsed = JSON.parse(raw) as { retryable: boolean };
        return Boolean(parsed.retryable);
      },
    };
  } catch {
    return null;
  }
}

export function loadWasmRuntime(): Promise<WasmRuntime | null> {
  if (!loadPromise) loadPromise = loadModule();
  return loadPromise;
}

export function getWasmRuntime(): WasmRuntime | null {
  return runtime;
}

export async function ensureWasmRuntime(): Promise<WasmRuntime | null> {
  if (runtime) return runtime;
  runtime = await loadWasmRuntime();
  return runtime;
}
