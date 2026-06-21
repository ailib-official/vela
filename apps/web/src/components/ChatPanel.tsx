import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage } from '@ailib-official/prism-sdk';
import { createPrismClient, formatPrismError } from '../lib/config';
import {
  getMessages,
  putMessage,
  titleFromFirstUserMessage,
  updateConversation,
  type Conversation,
  type StoredMessage,
} from '../lib/db';

export interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  conversation: Conversation;
  onConversationUpdated: (conv: Conversation) => void;
  model: string;
}

export function ChatPanel({ conversation, onConversationUpdated, model }: Props) {
  const prism = useMemo(() => createPrismClient(), []);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const convRef = useRef(conversation);
  convRef.current = conversation;

  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    (async () => {
      try {
        const stored = await getMessages(conversation.id);
        if (cancelled) return;
        setMessages(
          stored.map((m) => ({ id: m.id, role: m.role, content: m.content })),
        );
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Load failed');
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const persistMessage = async (msg: StoredMessage, titleHint?: string) => {
    await putMessage(msg);
    const conv = convRef.current;
    let title = conv.title;
    if (title === 'New chat' && titleHint) {
      title = titleFromFirstUserMessage(titleHint);
    }
    const updated = { ...conv, title, updatedAt: Date.now() };
    convRef.current = updated;
    await updateConversation(updated);
    onConversationUpdated(updated);
  };

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !model || streaming) return;

    setError(null);
    setInput('');
    const now = Date.now();
    const userMsg: UiMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '' },
    ]);
    setStreaming(true);

    await persistMessage(
      {
        id: userMsg.id,
        conversationId: conversation.id,
        role: 'user',
        content: text,
        model,
        timestamp: now,
      },
      text,
    );

    const history: ChatMessage[] = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let assistantText = '';
    try {
      const stream = prism.chat.completions.createStream({
        model,
        messages: history,
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (!delta) continue;
        assistantText += delta;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + delta } : m,
          ),
        );
      }
      await persistMessage({
        id: assistantId,
        conversationId: conversation.id,
        role: 'assistant',
        content: assistantText,
        model,
        timestamp: Date.now(),
      });
    } catch (e) {
      setError(formatPrismError(e));
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setStreaming(false);
    }
  }, [
    input,
    model,
    messages,
    prism,
    streaming,
    conversation.id,
    onConversationUpdated,
  ]);

  return (
    <div className="chat-panel">
      <header className="chat-header">
        <h1>{conversation.title}</h1>
        <p className="subtitle">A-layer navigation client → Prism Gateway</p>
        {model && (
          <p className="active-model">
            Active model: <code>{model}</code>
          </p>
        )}
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <div className="messages" aria-live="polite">
        {loadingHistory && <p className="placeholder">Loading history…</p>}
        {!loadingHistory && messages.length === 0 && (
          <p className="placeholder">Send a message to chat via Prism.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.role}`}>
            <span className="role">{m.role}</span>
            <div className="content">{m.content || (streaming ? '…' : '')}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message…"
          rows={2}
          disabled={streaming || !model || loadingHistory}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button type="submit" disabled={streaming || !input.trim() || !model}>
          {streaming ? 'Streaming…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
