import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { a2a } from "a2a-ai-provider";
import { isTestEnvironment } from "../constants";

export const myProvider = isTestEnvironment
  ? (() => {
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
    })()
  : customProvider({
      languageModels: {
        "chat-model": a2a("http://localhost:8089/transformation/a2a"), // note: no trailing slash
        "chat-model-reasoning": wrapLanguageModel({
          model: a2a("http://localhost:8089/transformation/a2a"),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        }),
        "title-model": a2a("http://localhost:8089/transformation/a2a"),
        "artifact-model": a2a("http://localhost:8089/transformation/a2a"),
      },
    });
