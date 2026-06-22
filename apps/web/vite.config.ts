import { defineConfig, loadEnv } from 'vite';

import react from '@vitejs/plugin-react';



export default defineConfig(({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '');

  const proxyTarget = env.VITE_PRISM_PROXY_TARGET || 'https://api.prism.ailib.info';

  const apiKey = env.VITE_PRISM_API_KEY || '';

  const syncTarget = env.VITE_SYNC_PROXY_TARGET?.trim();

  const syncToken = env.VITE_SYNC_AUTH_TOKEN?.trim();



  const proxy: Record<string, object> = {};

  if (apiKey) {

    proxy['/v1'] = {

      target: proxyTarget,

      changeOrigin: true,

      secure: true,

      headers: { Authorization: `Bearer ${apiKey}` },

    };

  }

  if (syncTarget && syncToken) {

    proxy['/api/sync'] = {

      target: syncTarget,

      changeOrigin: true,

      secure: true,

      headers: { Authorization: `Bearer ${syncToken}` },

    };

  }



  return {

    plugins: [react()],

    assetsInclude: ['**/*.wasm'],

    server: {

      port: 5173,

      proxy: Object.keys(proxy).length ? proxy : undefined,

    },

    test: {

      environment: 'node',

    },

  };

});


