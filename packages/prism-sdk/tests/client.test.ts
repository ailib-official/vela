import { describe, expect, it } from 'vitest';
import { PrismClient } from '../src/index.js';

describe('PrismClient', () => {
  it('rejects empty api key', () => {
    expect(() => new PrismClient({ apiKey: '' })).toThrow(/apiKey/);
  });

  it('lists models via fetch mock', async () => {
    const fetchMock = async () =>
      new Response(
        JSON.stringify({
          object: 'list',
          data: [{ id: 'deepseek-chat', object: 'model' }],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );

    const client = new PrismClient({
      apiKey: 'test-key',
      baseUrl: 'https://example.test',
      fetch: fetchMock as typeof fetch,
    });

    const models = await client.models.list();
    expect(models.data).toHaveLength(1);
    expect(models.data[0]?.id).toBe('deepseek-chat');
  });
});
