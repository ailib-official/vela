/**
 * Provider/model discovery from Prism `/v1/models` (+ optional admin health).
 *
 * 从 Prism `/v1/models` 发现供应商与模型（可选 `/admin/health` 延迟指标）。
 */

import type { PrismClient } from '@ailib-official/prism-sdk';
import { DEFAULT_BASE_URL } from '@ailib-official/prism-sdk';
import {
  MODEL_HINTS,
  P0_PROVIDER_ORDER,
  providerDisplayName,
  type P0ProviderId,
} from './providerMeta';

export type ProviderStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export type SortMode = 'name' | 'latency' | 'cost';

export interface ModelView {
  id: string;
  contextWindow?: number;
  pricingHint?: string;
}

export interface ProviderView {
  id: string;
  name: string;
  status: ProviderStatus;
  avgLatencyMs?: number;
  successRate?: number;
  models: ModelView[];
}

interface AdminHealthEntry {
  success_count: number;
  failure_count: number;
  avg_latency_ms: number;
}

function resolveBaseUrl(): string {
  const configured = import.meta.env.VITE_PRISM_BASE_URL?.trim();
  if (import.meta.env.DEV) {
    return configured ?? '';
  }
  return configured || DEFAULT_BASE_URL;
}

async function fetchAdminHealth(): Promise<Record<string, AdminHealthEntry> | null> {
  const token = import.meta.env.VITE_PRISM_ADMIN_TOKEN?.trim();
  if (!token) return null;

  const base = resolveBaseUrl();
  const url = `${base}/admin/health`.replace(/([^:]\/)\/+/g, '$1');

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, AdminHealthEntry>;
  } catch {
    return null;
  }
}

function healthToStatus(entry: AdminHealthEntry | undefined, hasModels: boolean): ProviderStatus {
  if (!entry) {
    return hasModels ? 'healthy' : 'down';
  }
  const total = entry.success_count + entry.failure_count;
  if (total === 0) {
    return hasModels ? 'healthy' : 'unknown';
  }
  const rate = entry.success_count / total;
  if (rate >= 0.95) return 'healthy';
  if (rate >= 0.7) return 'degraded';
  return 'down';
}

function sortProviders(providers: ProviderView[], mode: SortMode): ProviderView[] {
  const copy = [...providers];
  switch (mode) {
    case 'latency':
      return copy.sort((a, b) => {
        const la = a.avgLatencyMs ?? Number.POSITIVE_INFINITY;
        const lb = b.avgLatencyMs ?? Number.POSITIVE_INFINITY;
        if (la !== lb) return la - lb;
        return a.name.localeCompare(b.name);
      });
    case 'cost':
      return copy.sort((a, b) => {
        const ca = a.models[0]?.pricingHint ?? 'zzz';
        const cb = b.models[0]?.pricingHint ?? 'zzz';
        if (ca !== cb) return ca.localeCompare(cb);
        return a.name.localeCompare(b.name);
      });
    default:
      return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export interface LoadProviderNavigationResult {
  providers: ProviderView[];
  defaultModelId: string;
  offline: boolean;
  error: string | null;
}

export async function loadProviderNavigation(
  prism: PrismClient,
): Promise<LoadProviderNavigationResult> {
  let offline = false;
  let error: string | null = null;

  const [modelsRes, healthMap] = await Promise.all([
    prism.models.list().catch((e) => {
      offline = true;
      error = e instanceof Error ? e.message : 'Prism unavailable';
      return null;
    }),
    fetchAdminHealth(),
  ]);

  const modelsByProvider = new Map<string, ModelView[]>();
  if (modelsRes) {
    for (const m of modelsRes.data) {
      const pid = m.owned_by ?? 'unknown';
      const hints = MODEL_HINTS[m.id] ?? {};
      const list = modelsByProvider.get(pid) ?? [];
      list.push({
        id: m.id,
        contextWindow: hints.contextWindow,
        pricingHint: hints.pricingHint,
      });
      modelsByProvider.set(pid, list);
    }
  }

  const providers: ProviderView[] = P0_PROVIDER_ORDER.map((id: P0ProviderId) => {
    const models = modelsByProvider.get(id) ?? [];
    const health = healthMap?.[id];
    return {
      id,
      name: providerDisplayName(id),
      status: healthToStatus(health, models.length > 0),
      avgLatencyMs: health?.avg_latency_ms,
      successRate:
        health && health.success_count + health.failure_count > 0
          ? health.success_count / (health.success_count + health.failure_count)
          : undefined,
      models: models.sort((a, b) => a.id.localeCompare(b.id)),
    };
  });

  const sorted = sortProviders(providers, 'name');
  const firstModel =
    sorted.find((p) => p.models.length > 0)?.models[0]?.id ??
    modelsRes?.data[0]?.id ??
    '';

  return {
    providers: sorted,
    defaultModelId: firstModel,
    offline,
    error,
  };
}

export function sortProviderList(
  providers: ProviderView[],
  mode: SortMode,
): ProviderView[] {
  return sortProviders(providers, mode);
}
