import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMessage } from '@ailib-official/prism-sdk';
import { createPrismClient, formatPrismError } from '../lib/config';

interface UiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function ChatPanel() {
  const prism = useMemo(() => createPrismClient(), []);
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState('');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingModels, setLoadingModels] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await prism.models.list();
        if (cancelled) return;
        const ids = res.data.map((m) => m.id);
        setModels(ids);
        setModel(ids[0] ?? '');
      } catch (e) {
        if (!cancelled) setError(formatPrismError(e));
      } finally {
        if (!cancelled) setLoadingModels(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [prism]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !model || streaming) return;

    setError(null);
    setInput('');
    const userMsg: UiMessage = { id: crypto.randomUUID(), role: 'user', content: text };
    const assistantId = crypto.randomUUID();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: 'assistant', content: '' },
    ]);
    setStreaming(true);

    const history: ChatMessage[] = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const stream = prism.chat.completions.createStream({
        model,
        messages: history,
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (!delta) continue;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + delta } : m,
          ),
        );
      }
    } catch (e) {
      setError(formatPrismError(e));
      setMessages((prev) => prev.filter((m) => m.id !== assistantId));
    } finally {
      setStreaming(false);
    }
  }, [input, model, messages, prism, streaming]);

  return (
    <div className="chat-panel">
      <header className="chat-header">
        <h1>Vela</h1>
        <p className="subtitle">A-layer navigation client → Prism Gateway</p>
        <label className="model-row">
          Model
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={loadingModels || streaming}
          >
            {models.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <div className="messages" aria-live="polite">
        {messages.length === 0 && (
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
          disabled={streaming || !model}
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
