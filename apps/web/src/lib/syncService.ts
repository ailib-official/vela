/**
 * Push/pull orchestration for Vela IndexedDB ↔ sync API.
 *
 * Vela 本地历史与云同步 API 的推拉编排。
 */

import {
  exportConversationSnapshot,
  importConversationSnapshot,
  listConversations,
} from './db';
import { SyncClient, SyncConflictError } from './syncClient';
import {
  decryptPayload,
  encryptPayload,
  envelopeFromBase64,
  envelopeToBase64,
} from './syncCrypto';
import { getSyncRevision, setSyncRevision } from './syncMeta';
import { buildSnapshot, parseSnapshot } from './syncPayload';

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: string[];
  errors: string[];
}

function requirePassphrase(passphrase: string): void {
  if (!passphrase.trim()) throw new Error('Enter a sync passphrase.');
}

export async function pushAllToCloud(
  passphrase: string,
  client = new SyncClient(),
): Promise<SyncResult> {
  requirePassphrase(passphrase);
  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: [], errors: [] };
  const convs = await listConversations();

  for (const conv of convs) {
    try {
      const snap = await exportConversationSnapshot(conv.id);
      if (!snap) continue;
      const envelope = await encryptPayload(JSON.stringify(buildSnapshot(snap.conversation, snap.messages)), passphrase);
      const meta = await client.saveConversation(conv.id, {
        title: conv.title,
        ciphertextB64: envelopeToBase64(envelope),
        baseRevision: getSyncRevision(conv.id),
      });
      setSyncRevision(conv.id, meta.revision);
      result.pushed += 1;
    } catch (e) {
      if (e instanceof SyncConflictError) {
        setSyncRevision(conv.id, e.currentRevision);
        result.conflicts.push(conv.title);
      } else {
        result.errors.push(`${conv.title}: ${e instanceof Error ? e.message : 'push failed'}`);
      }
    }
  }
  return result;
}

export async function pullAllFromCloud(
  passphrase: string,
  client = new SyncClient(),
): Promise<SyncResult> {
  requirePassphrase(passphrase);
  const result: SyncResult = { pushed: 0, pulled: 0, conflicts: [], errors: [] };
  const remote = await client.listConversations();

  for (const meta of remote) {
    try {
      const blob = await client.fetchConversation(meta.id);
      const envelopeJson = envelopeFromBase64(blob.ciphertext_b64);
      const plaintext = await decryptPayload(envelopeJson, passphrase);
      const snap = parseSnapshot(plaintext);
      await importConversationSnapshot(snap.conversation, snap.messages);
      setSyncRevision(meta.id, blob.revision);
      result.pulled += 1;
    } catch (e) {
      const label = meta.title || meta.id;
      if (e instanceof Error && e.message.includes('decrypt')) {
        result.errors.push(`${label}: wrong passphrase or corrupted blob`);
      } else {
        result.errors.push(`${label}: ${e instanceof Error ? e.message : 'pull failed'}`);
      }
    }
  }
  return result;
}
