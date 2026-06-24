import { afterEach, describe, expect, it, vi } from 'vitest';
import { decideRoute, toRoutingSuggestion } from './decideRoute';

describe('decideRoute', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts to /v1/route/decide with bearer auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        model: 'deepseek-chat',
        provider_id: 'deepseek',
        reason: 'lowest_cost',
        estimated_cost_per_1k_prompt_usd: 0.00014,
        fallback_chain: ['groq'],
        disclaimer: 'NOT_PRODUCTION_SLA',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await decideRoute(
      { baseUrl: 'https://api.prism.ailib.info', apiKey: 'test-key' },
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'hello' }],
        optimize: 'cost',
      },
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.prism.ailib.info/v1/route/decide',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
    expect(result.provider_id).toBe('deepseek');
    const suggestion = toRoutingSuggestion(result);
    expect(suggestion.source).toBe('prism');
    expect(suggestion.modelId).toBe('deepseek-chat');
  });

  it('uses relative path when baseUrl empty (dev proxy)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        model: 'gpt-4o-mini',
        provider_id: 'openai',
        reason: 'lowest_cost',
        estimated_cost_per_1k_prompt_usd: 0.00015,
        fallback_chain: [],
        disclaimer: 'NOT_PRODUCTION_SLA',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await decideRoute({ baseUrl: '', apiKey: 'k' }, { model: 'gpt-4o-mini' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/v1/route/decide',
      expect.any(Object),
    );
  });
});
