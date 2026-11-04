// Tracés SVG des 45 départements (geoBoundaries ADM2) + historique EAA du riz et pluie CHIRPS par département
// -> src/lib/rice-yield/rice-yield.generated.json. Aucun calcul d'estimation ici : le code TypeScript
// (src/lib/rice-yield) calcule moyennes, bandes et statuts à partir de ces enregistrements.
// Entrées : data/incoming/geoboundaries-adm2/ (non versionné), data/sources/eaa-rice-departments.csv,
// data/sources/chirps-departments.csv. Usage : node scripts/build-rice-yield.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const WIDTH = 640;
const geo = JSON.parse(readFileSync("data/incoming/geoboundaries-adm2/geoBoundaries-SEN-ADM2_simplified.geojson", "utf8"));
const DISPLAY = { "Saint Louis": "Saint-Louis", Thies: "Thiès", Sedhiou: "Sédhiou", Kedougou: "Kédougou", Mbacke: "Mbacké", Guediawaye: "Guédiawaye", Kebemer: "Kébémer", Guinguineo: "Guinguinéo", Linguere: "Linguère", Ranerou: "Ranérou", "Malem Hodar": "Malem Hodar", "Medina Yoroufoula": "Médina Yoroufoula" };

const polygons = (g) => (g.type === "Polygon" ? [g.coordinates] : g.coordinates);
let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
for (const f of geo.features) for (const poly of polygons(f.geometry)) for (const [lon, lat] of poly[0]) {
  minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon); minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
}
const kx = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
const scale = WIDTH / ((maxLon - minLon) * kx);
const height = Math.round((maxLat - minLat) * scale);
const px = (lon) => ((lon - minLon) * kx * scale).toFixed(1);
const py = (lat) => ((maxLat - lat) * scale).toFixed(1);

const csv = (path) => {
  const [head, ...lines] = readFileSync(path, "utf8").trim().split("\n");
  const cols = head.split(";");
  return lines.map((l) => Object.fromEntries(l.split(";").map((v, i) => [cols[i], v])));
};
const eaa = csv("data/sources/eaa-rice-departments.csv");
const rain = new Map(csv("data/sources/chirps-departments.csv").map((r) => [`${r.departement}|${r.annee}`, Number(r.pluie_jun_oct_mm)]));

const departments = geo.features.map((f) => {
  const key = f.properties.shapeName;
  const d = polygons(f.geometry)
    .map((poly) => poly.map((ring) => "M" + ring.map(([lon, lat]) => `${px(lon)} ${py(lat)}`).join("L") + "Z").join(""))
    .join("");
  const records = eaa
    .filter((r) => r.departement === key)
    .map((r) => ({
      year: Number(r.annee),
      areaHa: Number(r.superficie_ha),
      productionT: Number(r.production_t),
      yieldKgHa: Number(r.rendement_kg_ha),
      rainMm: rain.get(`${key}|${r.annee}`) ?? null,
    }))
    .sort((a, b) => a.year - b.year);
  return { id: f.properties.shapeID, key, name: DISPLAY[key] ?? key, d, records };
});

mkdirSync("src/lib/rice-yield", { recursive: true });
writeFileSync(
  "src/lib/rice-yield/rice-yield.generated.json",
  JSON.stringify({
    width: WIDTH,
    height,
    mapSource: "geoBoundaries (geoboundaries.org) gbOpen SEN ADM2, CC BY 3.0 IGO, géométrie simplifiée",
    yieldSource: "DAPSA, Enquête Agricole Annuelle 2017-2025, tableau 18.3 du portail Senegal Open Data ; rendement recalculé = production / surface",
    rainSource: "CHIRPS v3.0 (Climate Hazards Center, UC Santa Barbara), pluie cumulée juin-octobre, moyenne départementale",
    departments,
  }),
);
console.log(departments.length, "départements,", departments.filter((x) => x.records.length).length, "avec riz,", `${WIDTH}x${height}`);
