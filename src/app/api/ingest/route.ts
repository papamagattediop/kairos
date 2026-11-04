import { ingestSource } from "../../../lib/meta/ingest";
import { createLimiter } from "../../../lib/rate-limit";

const MAX_SOURCE_CHARS = 20_000;
const MAX_BODY_BYTES = 60_000;
// Limite globale (une seule clé) : aucun proxy de confiance n'est configuré, donc
// un en-tête x-forwarded-for forgé ne doit pas pouvoir contourner le limiteur.
// 20 requêtes par minute et 200 appels au modèle par jour.
const allow = createLimiter(20, 60_000, 200);

export async function POST(request: Request) {
  if (!allow("global")) {
    return Response.json({ error: "Trop de requêtes, réessayez plus tard." }, { status: 429 });
  }

  // On mesure le corps réellement lu, pas seulement l'en-tête content-length.
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "Requête trop volumineuse." }, { status: 413 });
  }
  let body: { source?: unknown } | null = null;
  try {
    body = JSON.parse(raw);
  } catch {
    body = null;
  }
  const source = typeof body?.source === "string" ? body.source.trim() : "";

  if (!source) {
    return Response.json({ error: "Champ 'source' requis." }, { status: 400 });
  }
  if (source.length > MAX_SOURCE_CHARS) {
    return Response.json(
      { error: `Source limitée à ${MAX_SOURCE_CHARS} caractères.` },
      { status: 413 },
    );
  }

  try {
    return Response.json(await ingestSource(source));
  } catch (error) {
    // Le détail reste côté serveur : il peut contenir des informations de configuration.
    console.error("ingest: appel Meta échoué", error);
    return Response.json(
      { error: "Service d'extraction indisponible." },
      { status: 502 },
    );
  }
}
