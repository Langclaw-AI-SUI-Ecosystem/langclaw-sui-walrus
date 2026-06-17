"use client";

import { useMemo } from "react";

import { type RouterModel } from "@/lib/langclaw-api";

export const DEFAULT_CHAT_MODEL_ID = "gpt-5-mini";
export const DEFAULT_AGENT_MODEL_ID = "gpt-5.2";
export const DEFAULT_IMAGE_MODEL_ID = "gpt-image-1";
export const DEFAULT_AUDIO_MODEL_ID = "gpt-4o-mini-transcribe";

const fallbackModels: RouterModel[] = [
  {
    id: DEFAULT_CHAT_MODEL_ID,
    name: "GPT-5 mini",
    type: "chatbot",
  },
  {
    id: DEFAULT_IMAGE_MODEL_ID,
    name: "GPT Image 1",
    type: "text-to-image",
  },
  {
    id: DEFAULT_AUDIO_MODEL_ID,
    name: "GPT-4o mini transcribe",
    type: "audio",
  },
  {
    id: DEFAULT_AGENT_MODEL_ID,
    name: "GPT-5.2",
    type: "chatbot",
  },
];

export function useRouterModels() {
  const models = fallbackModels;

  return useMemo(
    () => {
      const audioModels = models.filter((model) =>
        modelSupportsService(model, "audio")
      );
      const chatModels = ensureModel(
        models.filter((model) => modelSupportsService(model, "chat")),
        fallbackModels[0]
      );
      const imageModels = ensureModel(
        models.filter((model) => modelSupportsService(model, "image")),
        fallbackModels[1]
      );

      return {
        audioModels,
        chatModels,
        error: "",
        imageModels,
        isLoading: false,
        models,
      };
    },
    [models]
  );
}

export function getModelLabel(model: RouterModel) {
  return model.name && model.name !== model.id ? `${model.name} (${model.id})` : model.id;
}

function ensureModel(models: RouterModel[], fallback: RouterModel) {
  return models.some((model) => model.id === fallback.id)
    ? models
    : [fallback, ...models];
}

export function modelSupportsService(
  model: RouterModel,
  service: "audio" | "chat" | "image"
) {
  const id = model.id.toLowerCase();
  const type = String(model.type ?? "").toLowerCase();
  const hasPromptPricing = Boolean(model.pricing?.prompt);
  const hasCompletionPricing = Boolean(model.pricing?.completion);
  const hasImagePricing = Boolean(model.pricing?.image);

  if (service === "image") {
    return (
      hasImagePricing ||
      type.includes("image") ||
      type.includes("text-to-image") ||
      id.includes("image")
    );
  }

  if (service === "audio") {
    return (
      type.includes("audio") ||
      type.includes("speech") ||
      type.includes("transcription") ||
      id.includes("whisper")
    );
  }

  if (type.includes("image") || type.includes("audio") || id.includes("whisper")) {
    return false;
  }

  return (
    hasPromptPricing ||
    hasCompletionPricing ||
    type.includes("chat") ||
    type.includes("llm") ||
    type.includes("language") ||
    type.includes("instruct") ||
    !type
  );
}
