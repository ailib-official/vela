/**
 * HTTP transport for Prism Gateway.
 *
 * Prism Gateway HTTP 传输层。
 */

import { PrismError } from './types.js';

export const DEFAULT_BASE_URL = 'https://api.prism.ailib.info';

export interface RequestContext {
  baseUrl: string;
  apiKey: string;
  fetchImpl: typeof fetch;
}

export async function prismFetch(
  ctx: RequestContext,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const url = `${ctx.baseUrl.replace(/\/$/, '')}${path}`;
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${ctx.apiKey}`);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await ctx.fetchImpl(url, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new PrismError(
      `Prism API ${init.method ?? 'GET'} ${path} failed: ${res.status}`,
      res.status,
      body,
    );
  }
  return res;
}
