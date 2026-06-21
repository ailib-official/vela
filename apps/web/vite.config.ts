import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PRISM_PROXY_TARGET || 'https://api.prism.ailib.info';
  const apiKey = env.VITE_PRISM_API_KEY || '';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: apiKey
        ? {
            '/v1': {
              target: proxyTarget,
              changeOrigin: true,
              secure: true,
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            },
          }
        : undefined,
    },
  };
});
