/**
 * OpenAI-compatible types for Prism Gateway `/v1/*`.
 *
 * Prism Gateway `/v1/*` 的 OpenAI 兼容类型定义。
 */

export interface PrismClientOptions {
  /** Gateway bearer key (`PRISM_GATEWAY_API_KEY`). */
  apiKey: string;
  /** Base URL without trailing slash. Default: https://api.prism.ailib.info */
  baseUrl?: string;
  /** Custom fetch (tests, Node polyfill). */
  fetch?: typeof fetch;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string | null;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
}

export interface ChatCompletionChunkDelta {
  role?: string;
  content?: string;
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: ChatCompletionChunkDelta;
  finish_reason: string | null;
}

export interface ChatCompletionChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
}

export interface ModelObject {
  id: string;
  object: string;
  created?: number;
  owned_by?: string;
}

export interface ModelListResponse {
  object: string;
  data: ModelObject[];
}

export class PrismError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string,
  ) {
    super(message);
    this.name = 'PrismError';
  }
}
