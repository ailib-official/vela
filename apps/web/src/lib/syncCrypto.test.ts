import { describe, expect, it } from 'vitest';
import {
  decryptPayload,
  encryptPayload,
  envelopeFromBase64,
  envelopeToBase64,
} from './syncCrypto';
import { buildSnapshot, parseSnapshot } from './syncPayload';

describe('syncCrypto', () => {
  it('encrypt/decrypt round-trip', async () => {
    const plain = JSON.stringify({ hello: 'vela', n: 42 });
    const envelope = await encryptPayload(plain, 'test-passphrase');
    const out = await decryptPayload(envelope, 'test-passphrase');
    expect(out).toBe(plain);
  });

  it('rejects wrong passphrase', async () => {
    const envelope = await encryptPayload('{}', 'correct');
    await expect(decryptPayload(envelope, 'wrong')).rejects.toThrow();
  });

  it('envelope base64 round-trip', async () => {
    const envelope = await encryptPayload('{"v":1}', 'p');
    const b64 = envelopeToBase64(envelope);
    expect(envelopeFromBase64(b64)).toBe(envelope);
  });
});

describe('syncPayload', () => {
  it('parses valid snapshot', () => {
    const snap = buildSnapshot(
      { id: 'c1', title: 'T', createdAt: 1, updatedAt: 2 },
      [],
    );
    expect(parseSnapshot(JSON.stringify(snap)).conversation.id).toBe('c1');
  });
});
