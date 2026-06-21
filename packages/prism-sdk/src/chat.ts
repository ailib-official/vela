/**
 * Chat completions API (`/v1/chat/completions`).
 *
 * 聊天补全 API。
 */

import { prismFetch, type RequestContext } from './http.js';
import { parseSseJsonStream } from './stream.js';
import type {
  ChatCompletionChunk,
  ChatCompletionRequest,
  ChatCompletionResponse,
} from './types.js';

export class ChatCompletions {
  constructor(private readonly ctx: RequestContext) {}

  async create(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const res = await prismFetch(this.ctx, '/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({ ...request, stream: false }),
    });
    return (await res.json()) as ChatCompletionResponse;
  }

  async *createStream(
    request: Omit<ChatCompletionRequest, 'stream'>,
  ): AsyncGenerator<ChatCompletionChunk> {
    const res = await prismFetch(this.ctx, '/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({ ...request, stream: true }),
    });
    if (!res.body) {
      throw new Error('Streaming response has no body');
    }
    yield* parseSseJsonStream(res.body);
  }
}
