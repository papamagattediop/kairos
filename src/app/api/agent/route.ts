import { runAgent } from "../../../lib/meta/agent";
import { chatRaw } from "../../../lib/meta/client";
import { forecastSummary, loadForecast } from "../../../lib/forecast/load";
import { ingestSource } from "../../../lib/meta/ingest";
import { createLimiter } from "../../../lib/rate-limit";

const MAX_QUESTION_CHARS = 2_000;
const MAX_BODY_BYTES = 30_000;
// Un appel d'agent peut coûter plusieurs appels au modèle : limites plus strictes.
// Limite globale (une seule clé) : un en-tête x-forwarded-for forgé ne la contourne pas.
const allow = createLimiter(10, 60_000, 60);

export async function POST(request: Request) {
  if (!allow("global")) {
    return Response.json({ error: "Trop de requêtes, réessayez plus tard." }, { status: 429 });
  }

  // On mesure le corps réellement lu, pas seulement l'en-tête content-length.
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "Requête trop volumineuse." }, { status: 413 });
  }
  let body: { question?: unknown } | null = null;
  try {
    body = JSON.parse(raw);
  } catch {
    body = null;
  }
  const question = typeof body?.question === "string" ? body.question.trim() : "";

  if (!question) {
    return Response.json({ error: "Champ 'question' requis." }, { status: 400 });
  }
  if (question.length > MAX_QUESTION_CHARS) {
    return Response.json(
      { error: `Question limitée à ${MAX_QUESTION_CHARS} caractères.` },
      { status: 413 },
    );
  }

  try {
    const result = await runAgent(
      question,
      (messages, tools) => chatRaw(messages, tools),
      {
        extract: (source) => ingestSource(source.slice(0, 20_000)),
        forecast: async () => forecastSummary(loadForecast()),
      },
    );
    return Response.json(result);
  } catch (error) {
    console.error("agent: appel Meta échoué", error);
    return Response.json({ error: "Agent indisponible." }, { status: 502 });
  }
}
