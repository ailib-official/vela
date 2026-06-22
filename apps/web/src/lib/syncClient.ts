/**
 * Cloud sync API client — ciphertext blobs only (EOS-P2-003 compatible).
 *
 * 云同步 API 客户端（仅密文 blob）。
 */

export interface ConversationMeta {
  id: string;
  title: string;
  revision: number;
  byte_size: number;
  updated_at: number;
}

export class SyncConflictError extends Error {
  readonly code = 'sync_conflict' as const;
  constructor(
    message: string,
    readonly currentRevision: number,
  ) {
    super(message);
    this.name = 'SyncConflictError';
  }
}

export interface SyncClientOptions {
  baseUrl?: string;
  authToken?: string;
}

function resolveSyncConfig(): { baseUrl: string; authToken: string } {
  const configured = import.meta.env.VITE_SYNC_BASE_URL?.trim();
  const baseUrl = import.meta.env.DEV ? configured ?? '' : configured || '';
  const authToken = import.meta.env.VITE_SYNC_AUTH_TOKEN?.trim() ?? '';
  return { baseUrl, authToken };
}

export function isSyncConfigured(): boolean {
  const { authToken } = resolveSyncConfig();
  return Boolean(authToken);
}

export class SyncClient {
  private readonly baseUrl: string;
  private readonly authToken: string;

  constructor(options?: SyncClientOptions) {
    const resolved = resolveSyncConfig();
    this.baseUrl = options?.baseUrl ?? resolved.baseUrl;
    this.authToken = options?.authToken ?? resolved.authToken;
  }

  private headers(json = false): HeadersInit {
    const h: Record<string, string> = {};
    if (this.authToken) h.Authorization = `Bearer ${this.authToken}`;
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  async listConversations(): Promise<ConversationMeta[]> {
    const resp = await fetch(`${this.baseUrl}/api/sync/conversations`, {
      headers: this.headers(),
    });
    const data = (await resp.json().catch(() => ({}))) as {
      conversations?: ConversationMeta[];
      error?: string;
    };
    if (!resp.ok) throw new Error(data.error ?? `List failed (${resp.status})`);
    return data.conversations ?? [];
  }

  async fetchConversation(id: string): Promise<ConversationMeta & { ciphertext_b64: string }> {
    const resp = await fetch(
      `${this.baseUrl}/api/sync/conversations/${encodeURIComponent(id)}`,
      { headers: this.headers() },
    );
    const data = (await resp.json().catch(() => ({}))) as ConversationMeta & {
      ciphertext_b64?: string;
      error?: string;
    };
    if (!resp.ok) throw new Error(data.error ?? `Fetch failed (${resp.status})`);
    if (!data.ciphertext_b64) throw new Error('Missing ciphertext in response');
    return { ...data, ciphertext_b64: data.ciphertext_b64 };
  }

  async saveConversation(
    id: string,
    payload: { title: string; ciphertextB64: string; baseRevision: number },
  ): Promise<ConversationMeta> {
    const resp = await fetch(
      `${this.baseUrl}/api/sync/conversations/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: this.headers(true),
        body: JSON.stringify({
          title: payload.title,
          ciphertext_b64: payload.ciphertextB64,
          base_revision: payload.baseRevision,
        }),
      },
    );
    const data = (await resp.json().catch(() => ({}))) as ConversationMeta & {
      error?: string;
      current_revision?: number;
    };
    if (resp.status === 409) {
      throw new SyncConflictError(
        data.error ?? 'Sync conflict — cloud has a newer revision',
        data.current_revision ?? 0,
      );
    }
    if (!resp.ok) throw new Error(data.error ?? `Save failed (${resp.status})`);
    return data;
  }
}
