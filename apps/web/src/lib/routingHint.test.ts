import { describe, expect, it } from 'vitest';
import { suggestModel } from './routingHint';

const MODELS = ['gpt-4o-mini', 'deepseek-chat', 'gemini-2.5-flash-lite', 'claude-3-5-haiku-20241022'];

describe('routingHint', () => {
  it('suggests large-context model for long prompts', () => {
    const long = 'x'.repeat(13_000);
    const s = suggestModel(long, MODELS, 'deepseek-chat', null);
    expect(s?.modelId).toBe('gemini-2.5-flash-lite');
  });

  it('suggests cheap model for short prompts', () => {
    const s = suggestModel('hi', MODELS, 'gemini-2.5-flash-lite', null);
    expect(s?.modelId).toBe('gpt-4o-mini');
  });

  it('returns null when current model already optimal', () => {
    const s = suggestModel('hi', MODELS, 'gpt-4o-mini', null);
    expect(s).toBeNull();
  });

  it('suggests capable model for code blocks', () => {
    const s = suggestModel('```rust\nfn main() {}\n```', MODELS, 'deepseek-chat', null);
    expect(s?.modelId).toMatch(/gpt-4o|claude/);
  });
});
