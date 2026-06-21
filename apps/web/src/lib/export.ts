/**
 * Export conversation to Markdown (PR-V1-002).
 */

import type { Conversation, StoredMessage } from './db';

export function conversationToMarkdown(
  conv: Conversation,
  messages: StoredMessage[],
): string {
  const lines = [
    `# ${conv.title}`,
    '',
    `_Exported from Vela · ${new Date(conv.updatedAt).toISOString()}_`,
    '',
  ];
  for (const m of messages) {
    const heading = m.role === 'user' ? '## User' : '## Assistant';
    lines.push(heading, '', m.content, '');
    if (m.model) lines.push(`_model: ${m.model}_`, '');
  }
  return lines.join('\n').trimEnd() + '\n';
}

export function downloadMarkdown(filename: string, body: string): void {
  const blob = new Blob([body], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
