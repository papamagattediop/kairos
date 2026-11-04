import { loadForecast } from "../../../lib/forecast/load";

// Aucun appel de modèle ici : données officielles + code déterministe.
export async function GET() {
  try {
    return Response.json(loadForecast());
  } catch (error) {
    console.error("forecast: lecture des données impossible", error);
    return Response.json({ error: "Données indisponibles." }, { status: 500 });
  }
}
