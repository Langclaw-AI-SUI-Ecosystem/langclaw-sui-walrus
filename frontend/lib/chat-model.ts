export const FIXED_CHAT_MODEL_ID = "gpt-5.4-nano";
export const FIXED_CHAT_MODEL_LABEL = "GPT-5.4 nano";

export const DEFAULT_CHAT_MODEL_ID = FIXED_CHAT_MODEL_ID;
export const DEFAULT_AGENT_MODEL_ID = DEFAULT_CHAT_MODEL_ID;

export function resolveChatModel(_requestedModel?: string | null) {
  void _requestedModel;
  return FIXED_CHAT_MODEL_ID;
}
