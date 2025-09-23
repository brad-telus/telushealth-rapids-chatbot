import type { ProviderV2 } from "@ai-sdk/provider";
import {
  generateId,
  type IdGenerator,
  withoutTrailingSlash,
} from "@ai-sdk/provider-utils";
import {
  A2aChatLanguageModel,
  type A2aChatSettings,
} from "./a2a-chat-language-model";

// Define your provider interface extending ProviderV2
interface A2aProvider extends ProviderV2 {
  (modelId: string, settings?: A2aChatSettings): A2aChatLanguageModel;

  // Add specific methods for different model types
  languageModel(
    modelId: string,
    settings?: A2aChatSettings
  ): A2aChatLanguageModel;
}

// Provider settings
interface A2aProviderSettings {
  /**
   * Custom ID generator
   */
  generateId?: IdGenerator;
  /**
   * Custom fetch implementation for HTTP requests
   */
  fetchImpl?: typeof fetch;
}

// Factory function to create provider instance
function createA2a(options: A2aProviderSettings = {}): A2aProvider {
  const createChatModel = (modelId: string, settings: A2aChatSettings = {}) =>
    new A2aChatLanguageModel(
      withoutTrailingSlash(modelId) as string,
      settings,
      {
        provider: "a2a",
        generateId: options.generateId ?? generateId,
        fetchImpl: options.fetchImpl,
      }
    );

  const provider = function (modelId: string, settings?: A2aChatSettings) {
    if (new.target) {
      throw new Error(
        "The model factory function cannot be called with the new keyword."
      );
    }

    return createChatModel(modelId, settings);
  };

  provider.languageModel = createChatModel;

  return provider as A2aProvider;
}

const a2a = createA2a();

export { a2a, createA2a };
