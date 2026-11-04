import { calculateBalance } from "../decision-engine";
import { chatText, type ChatMessage } from "./client";
import {
  EXTRACTION_SYSTEM_PROMPT,
  parseJsonObject,
  validateExtraction,
} from "./extract-terms";

type Chat = (messages: ChatMessage[]) => Promise<string>;

// Spark propose, le code valide, le moteur calcule ou refuse.
export async function ingestSource(source: string, chat: Chat = chatText) {
  const text = await chat([
    { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
    { role: "user", content: source },
  ]);
  const { inputs, rejected, campaigns } = validateExtraction(parseJsonObject(text), source);

  return {
    // Texte fourni par l'utilisateur : pas une statistique officielle vérifiée.
    origin: "user_source" as const,
    inputs,
    rejected,
    // Campagnes citées dans la source : plusieurs valeurs = termes possiblement mélangés.
    campaigns,
    balance: calculateBalance(inputs),
  };
}
