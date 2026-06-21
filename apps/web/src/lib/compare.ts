/**
 * Parallel multi-model streaming comparison.
 *
 * 并行多模型流式对比。
 */

import type { PrismClient } from '@ailib-official/prism-sdk';
import { formatPrismError } from './config';

export interface CompareColumnState {
  modelId: string;
  content: string;
  streaming: boolean;
  error: string | null;
  firstTokenMs: number | null;
  doneMs: number | null;
}

export interface CompareRunResult {
  columns: CompareColumnState[];
}

export async function runModelComparison(
  prism: PrismClient,
  modelIds: string[],
  prompt: string,
  onUpdate: (columns: CompareColumnState[]) => void,
): Promise<CompareColumnState[]> {
  const trimmed = prompt.trim();
  if (!trimmed || modelIds.length < 2) {
    throw new Error('Select at least 2 models and enter a prompt.');
  }

  const columns: CompareColumnState[] = modelIds.map((modelId) => ({
    modelId,
    content: '',
    streaming: true,
    error: null,
    firstTokenMs: null,
    doneMs: null,
  }));

  const push = () => onUpdate(columns.map((c) => ({ ...c })));

  await Promise.all(
    modelIds.map(async (modelId, index) => {
      const started = performance.now();
      try {
        const stream = prism.chat.completions.createStream({
          model: modelId,
          messages: [{ role: 'user', content: trimmed }],
        });
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content ?? '';
          if (!delta) continue;
          if (columns[index].firstTokenMs === null) {
            columns[index].firstTokenMs = Math.round(performance.now() - started);
          }
          columns[index].content += delta;
          push();
        }
        columns[index].doneMs = Math.round(performance.now() - started);
      } catch (e) {
        columns[index].error = formatPrismError(e);
      } finally {
        columns[index].streaming = false;
        push();
      }
    }),
  );

  return columns;
}

export const MAX_COMPARE_MODELS = 3;
export const MIN_COMPARE_MODELS = 2;
