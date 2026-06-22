import { useCallback, useState } from 'react';
import { isSyncConfigured } from '../lib/syncClient';
import {
  getStoredSyncPassphrase,
  storeSyncPassphrase,
} from '../lib/syncCrypto';
import { pullAllFromCloud, pushAllToCloud } from '../lib/syncService';

interface Props {
  onSynced?: () => void;
}

function formatResult(
  action: 'Push' | 'Pull',
  r: Awaited<ReturnType<typeof pushAllToCloud>>,
): string {
  const parts = [`${action}: ${action === 'Push' ? r.pushed : r.pulled} conversation(s).`];
  if (r.conflicts.length) {
    parts.push(`Conflicts: ${r.conflicts.join(', ')} — pull first or retry.`);
  }
  if (r.errors.length) {
    parts.push(r.errors.join(' '));
  }
  return parts.join(' ');
}

export function SyncPanel({ onSynced }: Props) {
  const [passphrase, setPassphrase] = useState(getStoredSyncPassphrase());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const configured = isSyncConfigured();

  const remember = useCallback((value: string) => {
    setPassphrase(value);
    if (value.trim()) storeSyncPassphrase(value);
  }, []);

  const run = useCallback(
    async (action: 'push' | 'pull') => {
      setBusy(true);
      setError(null);
      setStatus(null);
      try {
        remember(passphrase);
        const result =
          action === 'push'
            ? await pushAllToCloud(passphrase)
            : await pullAllFromCloud(passphrase);
        setStatus(formatResult(action === 'push' ? 'Push' : 'Pull', result));
        if (result.pulled > 0 || result.pushed > 0) onSynced?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Sync failed');
      } finally {
        setBusy(false);
      }
    },
    [passphrase, remember, onSynced],
  );

  return (
    <section className="sync-panel">
      <h3 className="sync-title">Cloud sync</h3>
      <p className="sync-hint">E2E encrypted · passphrase never leaves this browser</p>
      {!configured && (
        <p className="sync-warn" role="status">
          Set <code>VITE_SYNC_AUTH_TOKEN</code> and proxy/base URL in <code>.env.local</code>.
        </p>
      )}
      <label className="sync-field">
        <span>Passphrase</span>
        <input
          type="password"
          value={passphrase}
          onChange={(e) => remember(e.target.value)}
          placeholder="Sync passphrase"
          autoComplete="off"
          disabled={busy}
        />
      </label>
      <div className="sync-actions">
        <button type="button" disabled={busy || !configured} onClick={() => void run('push')}>
          Push
        </button>
        <button type="button" disabled={busy || !configured} onClick={() => void run('pull')}>
          Pull
        </button>
      </div>
      {status && <p className="sync-status">{status}</p>}
      {error && (
        <p className="sidebar-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
