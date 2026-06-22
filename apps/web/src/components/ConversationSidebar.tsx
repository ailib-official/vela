import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createConversation,
  deleteConversation,
  getMessages,
  listConversations,
  type Conversation,
} from '../lib/db';
import { conversationToMarkdown, downloadMarkdown } from '../lib/export';
import { SyncPanel } from './SyncPanel';

interface Props {
  activeId: string | null;
  onSelect: (conv: Conversation) => void;
  onNew: (conv: Conversation) => void;
  refreshKey: number;
  onSynced?: () => void;
}

export function ConversationSidebar({
  activeId,
  onSelect,
  onNew,
  refreshKey,
  onSynced,
}: Props) {
  const [items, setItems] = useState<Conversation[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await listConversations());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((c) => c.title.toLowerCase().includes(q));
  }, [items, query]);

  const handleNew = async () => {
    const conv = await createConversation();
    await load();
    onNew(conv);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this conversation and all messages?')) return;
    await deleteConversation(id);
    await load();
    if (activeId === id) {
      const conv = await createConversation();
      onNew(conv);
    }
  };

  const handleExport = async (conv: Conversation) => {
    const messages = await getMessages(conv.id);
    const md = conversationToMarkdown(conv, messages);
    const safe = conv.title.replace(/[^\w\-]+/g, '_').slice(0, 40) || 'chat';
    downloadMarkdown(`${safe}.md`, md);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>History</h2>
        <button type="button" onClick={() => void handleNew()}>
          New
        </button>
      </div>
      <input
        className="sidebar-search"
        placeholder="Search…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error && <p className="sidebar-error">{error}</p>}
      <ul className="conv-list">
        {filtered.map((c) => (
          <li key={c.id} className={c.id === activeId ? 'active' : ''}>
            <button type="button" className="conv-title" onClick={() => onSelect(c)}>
              <span className="conv-name">{c.title}</span>
              <span className="conv-date">
                {new Date(c.updatedAt).toLocaleString()}
              </span>
            </button>
            <div className="conv-actions">
              <button type="button" title="Export Markdown" onClick={() => void handleExport(c)}>
                ↓
              </button>
              <button type="button" title="Delete" onClick={() => void handleDelete(c.id)}>
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
      <SyncPanel
        onSynced={async () => {
          await load();
          onSynced?.();
        }}
      />
    </aside>
  );
}
