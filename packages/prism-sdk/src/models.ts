/**
 * Models API (`/v1/models`).
 *
 * 模型列表 API。
 */

import { prismFetch, type RequestContext } from './http.js';
import type { ModelListResponse } from './types.js';

export class Models {
  constructor(private readonly ctx: RequestContext) {}

  async list(): Promise<ModelListResponse> {
    const res = await prismFetch(this.ctx, '/v1/models', { method: 'GET' });
    return (await res.json()) as ModelListResponse;
  }
}
