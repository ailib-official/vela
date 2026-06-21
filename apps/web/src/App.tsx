import { useCallback, useEffect, useState } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { ConversationSidebar } from './components/ConversationSidebar';
import { ProviderNav } from './components/ProviderNav';
import { createConversation, type Conversation } from './lib/db';
import './App.css';

export default function App() {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [sidebarKey, setSidebarKey] = useState(0);
  const [selectedModel, setSelectedModel] = useState('');

  useEffect(() => {
    void (async () => {
      setConversation(await createConversation());
    })();
  }, []);

  const bumpSidebar = useCallback(() => setSidebarKey((k) => k + 1), []);

  const handleProviderReady = useCallback((defaultModelId: string) => {
    setSelectedModel((prev) => prev || defaultModelId);
  }, []);

  const handleConversationUpdated = useCallback(
    (conv: Conversation) => {
      setConversation(conv);
      bumpSidebar();
    },
    [bumpSidebar],
  );

  if (!conversation) {
    return <main className="app loading">Loading…</main>;
  }

  return (
    <main className="app layout">
      <ConversationSidebar
        activeId={conversation.id}
        refreshKey={sidebarKey}
        onSelect={setConversation}
        onNew={setConversation}
      />
      <ChatPanel
        key={conversation.id}
        conversation={conversation}
        model={selectedModel}
        onConversationUpdated={handleConversationUpdated}
      />
      <ProviderNav
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        onReady={handleProviderReady}
      />
    </main>
  );
}
