# WASM routing assets (PR-V2-003)

Vela embeds **ailib-wasm-browser** from `ailib-official/ailib-wasm-test` under `apps/web/src/vendor/wasm/`.

## Refresh vendored WASM

From the `ailib-wasm-test` repo:

```bash
wasm-pack build crates/wasm-browser --target web --out-dir ../../static/wasm --out-name ailib_wasm
```

Then from `vela`:

```bash
node scripts/copy-wasm.mjs
# or: AILIB_WASM_SRC=/path/to/ailib-wasm-test/static/wasm node scripts/copy-wasm.mjs
```

Commit updated files under `apps/web/src/vendor/wasm/` when the WASM ABI changes.

## Runtime behaviour

- `wasmLoader.ts` lazy-imports `vendor/wasm/ailib_wasm.js` (bundled by Vite)
- On success, `RoutingHintBar` shows heuristics gated by `ailib_invoke({ op: "capabilities" })`
- If load fails, routing hints use TypeScript heuristics only (graceful degradation)
