/**
 * E2E sync crypto (EOS-P2-003 / BIZ-004) — AES-256-GCM + PBKDF2.
 *
 * 端到端同步加密；密钥不出浏览器。
 */

const ENVELOPE_V = 1;
const PBKDF2_ITERATIONS = 210_000;

function b64Encode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

function b64Decode(str: string): Uint8Array {
  const binary = atob(str);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new Uint8Array(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptPayload(plaintext: string, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  );
  return JSON.stringify({
    v: ENVELOPE_V,
    alg: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256',
    salt: b64Encode(salt),
    iv: b64Encode(iv),
    ciphertext: b64Encode(new Uint8Array(ciphertext)),
  });
}

export async function decryptPayload(envelopeJson: string, passphrase: string): Promise<string> {
  const envelope = JSON.parse(envelopeJson) as { v: number; salt: string; iv: string; ciphertext: string };
  if (envelope.v !== ENVELOPE_V) throw new Error('Unsupported envelope version');
  const salt = b64Decode(envelope.salt);
  const iv = b64Decode(envelope.iv);
  const data = b64Decode(envelope.ciphertext);
  const key = await deriveKey(passphrase, salt);
  const plainBuf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(iv) },
    key,
    new Uint8Array(data),
  );
  return new TextDecoder().decode(plainBuf);
}

export function envelopeToBase64(envelopeJson: string): string {
  return b64Encode(new TextEncoder().encode(envelopeJson));
}

export function envelopeFromBase64(b64: string): string {
  return new TextDecoder().decode(b64Decode(b64));
}

export const SYNC_PASSPHRASE_KEY = 'vela_sync_passphrase_v1';

export function getStoredSyncPassphrase(): string {
  try {
    return sessionStorage.getItem(SYNC_PASSPHRASE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function storeSyncPassphrase(value: string): void {
  sessionStorage.setItem(SYNC_PASSPHRASE_KEY, value);
}
