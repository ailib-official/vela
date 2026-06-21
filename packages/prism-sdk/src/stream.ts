/**
 * SSE line parser for OpenAI-style streaming chat completions.
 *
 * OpenAI 风格 SSE 流式响应解析器。
 */

import type { ChatCompletionChunk } from './types.js';

export async function* parseSseJsonStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<ChatCompletionChunk> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let lineBreak = buffer.indexOf('\n');
      while (lineBreak >= 0) {
        const line = buffer.slice(0, lineBreak).trim();
        buffer = buffer.slice(lineBreak + 1);
        lineBreak = buffer.indexOf('\n');

        if (!line || line.startsWith(':')) continue;
        if (!line.startsWith('data:')) continue;

        const data = line.slice(5).trim();
        if (data === '[DONE]') return;

        yield JSON.parse(data) as ChatCompletionChunk;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
