import type {
  CoreAssistantMessage,
  CoreToolMessage,
  UIMessage,
  UIMessagePart,
} from 'ai';
import { type ClassValue, clsx } from 'clsx';
import { formatISO } from 'date-fns';
import { twMerge } from 'tailwind-merge';
import type { DBMessage, Document } from '@/lib/db/schema';
import { ChatSDKError, type ErrorCode } from './errors';
import type { ChatMessage, ChatTools, CustomUIDataTypes } from './types';
import { basePath as BASE_PATH } from "../next.config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const { code, cause } = await response.json();
    throw new ChatSDKError(code as ErrorCode, cause);
  }

  return response.json();
};

export async function fetchWithErrorHandlers(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const { code, cause } = await response.json();
      throw new ChatSDKError(code as ErrorCode, cause);
    }

    return response;
  } catch (error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new ChatSDKError('offline:chat');
    }

    throw error;
  }
}

export function getLocalStorage(key: string) {
  if (typeof window !== 'undefined') {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }
  return [];
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function getMostRecentUserMessage(messages: UIMessage[]) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getDocumentTimestampByIndex(
  documents: Document[],
  index: number,
) {
  if (!documents) { return new Date(); }
  if (index > documents.length) { return new Date(); }

  return documents[index].createdAt;
}

export function getTrailingMessageId({
  messages,
}: {
  messages: ResponseMessage[];
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) { return null; }

  return trailingMessage.id;
}

export function sanitizeText(text: string) {
  return text.replace('<has_function_call>', '');
}

export function convertToUIMessages(messages: DBMessage[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as 'user' | 'assistant' | 'system',
    parts: message.parts as UIMessagePart<CustomUIDataTypes, ChatTools>[],
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}

export function getTextFromMessage(message: ChatMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

/**
 * Utility functions for handling basePath-aware URLs
 */

/**
 * Creates a basePath-aware URL for server-side redirects
 * @param path - The path to append to basePath (should start with /)
 * @param baseUrl - The base URL (from request.url)
 * @returns Complete URL with basePath
 */
export function createBasepathUrl(path: string, baseUrl: string): string {
  return new URL(`${BASE_PATH}${path}`, baseUrl).toString();
}

/**
 * Creates a basePath-aware path for client-side navigation
 * @param path - The path to append to basePath (should start with /)
 * @returns Path with basePath prefix
 */
export function createBasepathPath(path: string): string {
  return `${BASE_PATH}${path}`;
}

/**
 * Gets the current basePath
 * @returns The basePath string
 */
export function getBasePath(): string {
  return BASE_PATH;
}

/**
 * Centralized basePath-aware API utilities
 *
 * These functions should be used instead of manually calling createBasepathPath
 * to ensure consistent basePath handling across the application.
 *
 * Usage examples:
 * - API calls: apiFetch("/api/chat", options)
 * - SWR keys: apiKey("/api/history") or apiKeyWithParams("/api/vote", { chatId })
 * - Navigation: updateUrl("/chat/123")
 * - Server redirects: createRedirectUrl("/login", request.url)
 */

/**
 * Makes a basePath-aware API fetch call
 * @param endpoint - API endpoint (should start with /)
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function apiFetch(endpoint: string, options?: RequestInit): Promise<Response> {
  return fetch(createBasepathPath(endpoint), options);
}

/**
 * Makes a basePath-aware API fetch call with error handling
 * @param endpoint - API endpoint (should start with /)
 * @param options - Fetch options
 * @returns Promise<Response>
 */
export async function apiRequestWithErrorHandlers(endpoint: string, options?: RequestInit): Promise<Response> {
  return fetchWithErrorHandlers(createBasepathPath(endpoint), options);
}

/**
 * Creates a basePath-aware SWR key for API endpoints
 * @param endpoint - API endpoint (should start with /)
 * @returns basePath-aware endpoint string
 */
export function apiKey(endpoint: string): string {
  return createBasepathPath(endpoint);
}

/**
 * Creates a basePath-aware SWR key with parameters.
 * @param endpoint - API endpoint (e.g., "/api/vote")
 * @param params - Parameters to append
 * @returns basePath-aware endpoint string with parameters
 */
export function apiKeyWithParams(endpoint: string, params: Record<string, string | number>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, String(value));
  });
  return createBasepathPath(`${endpoint}?${searchParams.toString()}`);
}

/**
 * Centralized basePath-aware navigation utilities
 */

/**
 * Updates the browser URL using basePath-aware paths
 * @param path - The path to navigate to (should start with /)
 */
export function updateUrl(path: string): void {
  window.history.replaceState({}, "", createBasepathPath(path));
}

/**
 * Creates a basePath-aware Next.js redirect URL for server-side redirects
 * @param path - The path to redirect to (should start with /)
 * @param baseUrl - The base URL (from request.url)
 * @returns Complete URL with basePath
 */
export function createRedirectUrl(path: string, baseUrl: string): string {
  return createBasepathUrl(path, baseUrl);
}
