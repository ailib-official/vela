/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PRISM_API_KEY: string;
  readonly VITE_PRISM_BASE_URL: string;
  readonly VITE_PRISM_PROXY_TARGET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
