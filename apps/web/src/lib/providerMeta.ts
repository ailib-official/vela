/**
 * Static P0 provider display metadata (gateway config mirror).
 *
 * P0 供应商展示元数据（与 gateway 配置对齐）。
 */

export const P0_PROVIDER_ORDER = [
  'openai',
  'deepseek',
  'gemini',
  'anthropic',
  'qwen',
] as const;

export type P0ProviderId = (typeof P0_PROVIDER_ORDER)[number];

export const PROVIDER_DISPLAY: Record<P0ProviderId, { name: string }> = {
  openai: { name: 'OpenAI' },
  deepseek: { name: 'DeepSeek' },
  gemini: { name: 'Google Gemini' },
  anthropic: { name: 'Anthropic' },
  qwen: { name: 'Qwen (DashScope)' },
};

/** Known model hints from production gateway config (not returned by `/v1/models`). */
export const MODEL_HINTS: Record<
  string,
  { contextWindow?: number; pricingHint?: string }
> = {
  'gpt-4o-mini': { contextWindow: 128_000, pricingHint: '$' },
  'deepseek-chat': { contextWindow: 64_000, pricingHint: '$' },
  'gemini-2.5-flash-lite': { contextWindow: 1_000_000, pricingHint: '$' },
  'claude-3-5-haiku-20241022': { contextWindow: 200_000, pricingHint: '$$' },
  'qwen-plus': { contextWindow: 131_072, pricingHint: '$' },
};

export function providerDisplayName(id: string): string {
  return PROVIDER_DISPLAY[id as P0ProviderId]?.name ?? id;
}
