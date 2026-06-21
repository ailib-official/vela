/**
 * Prism Gateway TypeScript client (OpenAI-compatible `/v1/*`).
 *
 * Prism Gateway 薄客户端（OpenAI 兼容 `/v1/*`）。
 */

import { ChatCompletions } from './chat.js';
import { DEFAULT_BASE_URL, type RequestContext } from './http.js';
import { Models } from './models.js';
import type { PrismClientOptions } from './types.js';

export class PrismClient {
  private readonly ctx: RequestContext;

  readonly chat: { completions: ChatCompletions };
  readonly models: Models;

  constructor(options: PrismClientOptions) {
    if (!options.apiKey?.trim()) {
      throw new Error('PrismClient requires a non-empty apiKey');
    }
    this.ctx = {
      baseUrl: options.baseUrl !== undefined ? options.baseUrl : DEFAULT_BASE_URL,
      apiKey: options.apiKey,
      fetchImpl: options.fetch ?? fetch,
    };
    const completions = new ChatCompletions(this.ctx);
    this.chat = { completions };
    this.models = new Models(this.ctx);
  }
}

export {
  PrismError,
  type ChatCompletionChunk,
  type ChatCompletionRequest,
  type ChatCompletionResponse,
  type ChatMessage,
  type ModelListResponse,
  type ModelObject,
  type PrismClientOptions,
} from './types.js';
export { DEFAULT_BASE_URL } from './http.js';
