/**
 * IndexedDB persistence for Vela conversations (PR-V1-002).
 *
 * Vela 会话本地持久化（IndexedDB）。
 */

const DB_NAME = 'vela';
const DB_VERSION = 1;

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface StoredMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  model?: string;
  timestamp: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('conversations')) {
        const conv = db.createObjectStore('conversations', { keyPath: 'id' });
        conv.createIndex('updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains('messages')) {
        const msg = db.createObjectStore('messages', { keyPath: 'id' });
        msg.createIndex('conversationId', 'conversationId');
        msg.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function listConversations(): Promise<Conversation[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction('conversations', 'readonly').objectStore('conversations').getAll();
    req.onsuccess = () => {
      const rows = (req.result as Conversation[]).sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getMessages(conversationId: string): Promise<StoredMessage[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const store = db.transaction('messages', 'readonly').objectStore('messages');
    const idx = store.index('conversationId');
    const req = idx.getAll(conversationId);
    req.onsuccess = () => {
      const rows = (req.result as StoredMessage[]).sort((a, b) => a.timestamp - b.timestamp);
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function createConversation(title = 'New chat'): Promise<Conversation> {
  const db = await openDb();
  const now = Date.now();
  const conv: Conversation = {
    id: crypto.randomUUID(),
    title,
    createdAt: now,
    updatedAt: now,
  };
  const tx = db.transaction('conversations', 'readwrite');
  tx.objectStore('conversations').put(conv);
  await txDone(tx);
  return conv;
}

export async function updateConversation(conv: Conversation): Promise<void> {
  const db = await openDb();
  const tx = db.transaction('conversations', 'readwrite');
  tx.objectStore('conversations').put(conv);
  await txDone(tx);
}

export async function putMessage(msg: StoredMessage): Promise<void> {
  const db = await openDb();
  const tx = db.transaction('messages', 'readwrite');
  tx.objectStore('messages').put(msg);
  await txDone(tx);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(['conversations', 'messages'], 'readwrite');
  tx.objectStore('conversations').delete(conversationId);
  const idx = tx.objectStore('messages').index('conversationId');
  const req = idx.getAllKeys(conversationId);
  await new Promise<void>((resolve, reject) => {
    req.onsuccess = () => {
      const store = tx.objectStore('messages');
      for (const key of req.result) store.delete(key);
      resolve();
    };
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
}

export function titleFromFirstUserMessage(content: string): string {
  const line = content.trim().split(/\n/)[0] ?? 'New chat';
  return line.length > 48 ? `${line.slice(0, 48)}…` : line;
}
