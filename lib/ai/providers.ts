import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { createA2a } from "../a2a-provider";
import { isTestEnvironment } from "../constants";

// Function to create provider with request context
export function createProvider(cookieHeader?: string) {
  if (isTestEnvironment) {
    const {
      artifactModel,
      chatModel,
      reasoningModel,
      titleModel,
    } = require("./models.mock");
    return customProvider({
      languageModels: {
        "chat-model": chatModel,
        "chat-model-reasoning": reasoningModel,
        "title-model": titleModel,
        "artifact-model": artifactModel,
      },
    });
  }

  // Create custom fetch implementation that includes cookies
  const fetchWithCookies = cookieHeader
    ? (url: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        headers.set("Cookie", cookieHeader);
        return fetch(url, {
          ...init,
          headers,
        });
      }
    : undefined;

  // Create A2A provider with custom fetch implementation
  const a2aProvider = createA2a({
    ...(fetchWithCookies && { fetchImpl: fetchWithCookies }),
  });

  const baseUrl = "http://localhost:8089/transformation/a2a";

  return customProvider({
    languageModels: {
      "chat-model": a2aProvider(baseUrl),
      "chat-model-reasoning": wrapLanguageModel({
        model: a2aProvider(baseUrl),
        middleware: extractReasoningMiddleware({ tagName: "think" }),
      }),
      "title-model": a2aProvider(baseUrl),
      "artifact-model": a2aProvider(baseUrl),
    },
  });
}

// Default provider for backward compatibility
export const myProvider = createProvider();
