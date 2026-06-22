import { useEffect, useState } from 'react';
import { ensureWasmRuntime, type WasmRuntime } from '../lib/wasmLoader';

export function useWasmRouting() {
  const [wasm, setWasm] = useState<WasmRuntime | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rt = await ensureWasmRuntime();
      if (!cancelled) {
        setWasm(rt);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { wasm, wasmLoading: loading, wasmReady: wasm !== null };
}
