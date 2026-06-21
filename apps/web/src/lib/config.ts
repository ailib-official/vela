/**
 * Prism endpoint configuration for the Vela web app.
 *
 * Vela Web 应用的 Prism 端点配置。
 */

import { DEFAULT_BASE_URL, PrismClient } from '@ailib-official/prism-sdk';

export function createPrismClient(): PrismClient {
  const apiKey = import.meta.env.VITE_PRISM_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'Missing VITE_PRISM_API_KEY. Copy apps/web/.env.example to .env.local',
    );
  }

  const configured = import.meta.env.VITE_PRISM_BASE_URL?.trim();
  const baseUrl = import.meta.env.DEV
    ? configured ?? ''
    : configured || DEFAULT_BASE_URL;

  return new PrismClient({
    apiKey,
    baseUrl,
  });
}

export function formatPrismError(err: unknown): string {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status;
    if (status === 401) return 'Authentication failed — check your Prism API key.';
    if (status === 429) return 'Rate limited — try again shortly.';
    if (status >= 500) return 'Prism gateway error — try again later.';
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred.';
}
