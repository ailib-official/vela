#!/usr/bin/env node
/**
 * PR-V1-001 smoke: prism-sdk against production Prism Gateway.
 * Usage: PRISM_API_KEY=... node scripts/smoke-prism.mjs
 */
import { PrismClient } from '../packages/prism-sdk/dist/index.js';

const apiKey = process.env.PRISM_API_KEY?.trim();
if (!apiKey) {
  console.error('FAIL: set PRISM_API_KEY');
  process.exit(1);
}

const baseUrl = process.env.PRISM_BASE_URL || 'https://api.prism.ailib.info';
const model = process.env.PRISM_SMOKE_MODEL || 'deepseek-chat';

const prism = new PrismClient({ apiKey, baseUrl });

async function main() {
  const report = { baseUrl, model, steps: [] };

  try {
    const models = await prism.models.list();
    const ids = models.data.map((m) => m.id);
    report.steps.push({ name: 'models.list', ok: true, count: ids.length, sample: ids.slice(0, 3) });
    if (!ids.length) throw new Error('no models returned');

    const useModel = ids.includes(model) ? model : ids[0];
    report.model = useModel;

    let streamed = '';
    const stream = prism.chat.completions.createStream({
      model: useModel,
      messages: [{ role: 'user', content: 'Reply with exactly: VELA_SMOKE_OK' }],
    });
    for await (const chunk of stream) {
      streamed += chunk.choices[0]?.delta?.content ?? '';
    }
    const streamOk = streamed.length > 0;
    report.steps.push({
      name: 'chat.stream',
      ok: streamOk,
      chars: streamed.length,
      preview: streamed.slice(0, 120),
    });
    if (!streamOk) throw new Error('empty stream');

    report.ok = true;
    console.log(JSON.stringify(report, null, 2));
  } catch (e) {
    report.ok = false;
    report.error = e instanceof Error ? e.message : String(e);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }
}

main();
