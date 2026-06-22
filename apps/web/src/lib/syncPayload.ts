/**
 * Vela conversation snapshot format for E2E sync envelopes.
 *
 * Vela 会话快照格式（加密前明文 JSON）。
 */

import type { Conversation, StoredMessage } from './db';

export interface ConversationSnapshotV1 {
  v: 1;
  conversation: Conversation;
  messages: StoredMessage[];
}

export function buildSnapshot(
  conversation: Conversation,
  messages: StoredMessage[],
): ConversationSnapshotV1 {
  return { v: 1, conversation, messages };
}

export function parseSnapshot(json: string): ConversationSnapshotV1 {
  const data = JSON.parse(json) as ConversationSnapshotV1;
  if (data.v !== 1 || !data.conversation?.id) {
    throw new Error('Invalid Vela snapshot format');
  }
  return data;
}
