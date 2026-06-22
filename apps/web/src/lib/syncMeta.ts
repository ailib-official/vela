/**
 * Local sync revision tracking (LWW base_revision for PUT).
 *
 * 本地同步 revision 元数据。
 */

const STORAGE_KEY = 'vela_sync_revisions_v1';

type RevisionMap = Record<string, number>;

function readMap(): RevisionMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as RevisionMap;
  } catch {
    return {};
  }
}

function writeMap(map: RevisionMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getSyncRevision(conversationId: string): number {
  return readMap()[conversationId] ?? 0;
}

export function setSyncRevision(conversationId: string, revision: number): void {
  const map = readMap();
  map[conversationId] = revision;
  writeMap(map);
}
