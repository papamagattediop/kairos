import { readReplay, recordMode, replayMode, writeReplay } from "./replay";

const BASE_URL = "https://api.meta.ai/v1";

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type ToolSpec = {
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
};

export type AssistantReply = { content: string | null; tool_calls: ToolCall[] };

type FetchLike = typeof fetch;

// Spark raisonne avant de répondre : un max_tokens trop bas renvoie un contenu vide.
const MAX_TOKENS = 8000;
const TIMEOUT_MS = 60_000;

export async function chatRaw(
  messages: ChatMessage[],
  tools?: ToolSpec[],
  fetchImpl: FetchLike = fetch,
): Promise<AssistantReply> {
  const body = JSON.stringify({
    model: process.env.META_MODEL ?? "muse-spark-1.3",
    messages,
    max_tokens: MAX_TOKENS,
    ...(tools ? { tools } : {}),
  });

  if (replayMode()) {
    const saved = readReplay<AssistantReply>(body);
    if (!saved) throw new Error("Rejeu : aucune réponse enregistrée pour cette requête");
    return saved;
  }

  const key = process.env.MODEL_API_KEY;
  if (!key) throw new Error("MODEL_API_KEY manquante (voir .env.example)");

  const response = await fetchImpl(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`Meta API: HTTP ${response.status}`);

  const data = await response.json();
  const message = data?.choices?.[0]?.message;
  if (!message) throw new Error("Meta API: réponse vide");
  const reply: AssistantReply = {
    content: typeof message.content === "string" ? message.content : null,
    // On écarte les appels d'outils sans nom de fonction : le modèle peut renvoyer des entrées mal formées.
    tool_calls: Array.isArray(message.tool_calls)
      ? message.tool_calls.filter((c: ToolCall) => typeof c?.function?.name === "string")
      : [],
  };
  if (recordMode()) {
    try {
      writeReplay(body, reply);
    } catch (error) {
      // Un échec d'enregistrement ne doit pas perdre une réponse déjà obtenue.
      console.error("replay: enregistrement impossible", error);
    }
  }
  return reply;
}

export async function chatText(
  messages: ChatMessage[],
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const reply = await chatRaw(messages, undefined, fetchImpl);
  if (!reply.content || reply.content.trim() === "") {
    throw new Error("Meta API: réponse vide");
  }
  return reply.content;
}
