import { useCallback, useEffect, useMemo, useState } from 'react';

import { ChatPanel } from './components/ChatPanel';

import { ComparePanel } from './components/ComparePanel';

import { ConversationSidebar } from './components/ConversationSidebar';

import { ProviderNav } from './components/ProviderNav';

import { createPrismClient } from './lib/config';

import { createConversation, type Conversation } from './lib/db';

import './App.css';



type AppMode = 'chat' | 'compare';



export default function App() {

  const [mode, setMode] = useState<AppMode>('chat');

  const [conversation, setConversation] = useState<Conversation | null>(null);

  const [sidebarKey, setSidebarKey] = useState(0);

  const [selectedModel, setSelectedModel] = useState('');

  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const prism = useMemo(() => createPrismClient(), []);



  useEffect(() => {

    void (async () => {

      setConversation(await createConversation());

    })();

  }, []);



  useEffect(() => {

    let cancelled = false;

    (async () => {

      try {

        const res = await prism.models.list();

        if (cancelled) return;

        setAvailableModels(res.data.map((m) => m.id));

      } catch {

        if (!cancelled) setAvailableModels([]);

      }

    })();

    return () => {

      cancelled = true;

    };

  }, [prism]);



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



  const defaultCompareModels = selectedModel

    ? [selectedModel, ...availableModels.filter((id) => id !== selectedModel)]

    : availableModels;



  return (

    <main className={`app layout${mode === 'compare' ? ' compare-mode' : ''}`}>

      <ConversationSidebar
        activeId={conversation.id}
        refreshKey={sidebarKey}
        onSelect={setConversation}
        onNew={setConversation}
        onSynced={bumpSidebar}
      />

      <div className="main-column">

        <nav className="mode-tabs" aria-label="App mode">

          <button

            type="button"

            className={mode === 'chat' ? 'active' : ''}

            onClick={() => setMode('chat')}

          >

            Chat

          </button>

          <button

            type="button"

            className={mode === 'compare' ? 'active' : ''}

            onClick={() => setMode('compare')}

          >

            Compare

          </button>

        </nav>

        {mode === 'chat' ? (

          <ChatPanel
            key={conversation.id}
            conversation={conversation}
            model={selectedModel}
            availableModels={availableModels}
            onApplyModel={setSelectedModel}
            onConversationUpdated={handleConversationUpdated}
          />

        ) : (

          <ComparePanel

            availableModels={availableModels}

            defaultModels={defaultCompareModels}

          />

        )}

      </div>

      {mode === 'chat' && (

        <ProviderNav

          selectedModel={selectedModel}

          onSelectModel={setSelectedModel}

          onReady={handleProviderReady}

        />

      )}

    </main>

  );

}


