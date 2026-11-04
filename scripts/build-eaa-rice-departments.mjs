// Tableau EAA du riz par département (2017-2025) -> data/sources/eaa-rice-departments.csv
// Entrée : data/incoming/eaa/eaa-opendata-18.3.json (non versionné, voir data/incoming/MANIFEST.md)
// Le rendement de la colonne source n'est pas utilisé (unité cassée en 2025) : rendement = production / surface.
import fs from "node:fs";

const NAME_FIX = {
  "malem hoddar": "Malem Hodar",
  "medina yoro foulah": "Medina Yoroufoula",
  nioro: "Nioro Du Rip",
  "saint-louis": "Saint Louis",
};
const norm = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const adm2 = JSON.parse(fs.readFileSync("data/incoming/geoboundaries-adm2/geoBoundaries-SEN-ADM2_simplified.geojson", "utf8"));
const adm2Names = new Map(adm2.features.map((f) => [norm(f.properties.shapeName), f.properties.shapeName]));

const j = JSON.parse(fs.readFileSync("data/incoming/eaa/eaa-opendata-18.3.json", "utf8"));
const table = new Map(); // "dep|year" -> {area, prod}
const unmatched = new Set();
for (const c of j.cells) {
  if (c["types-de-culture"] !== "Riz" || c.Value == null) continue;
  const key = c.indicateurs === "Superficie agricole par département" ? "area" : c.indicateurs === "Production agricole par département" ? "prod" : null;
  if (!key) continue;
  const raw = c["régions-et-départements"];
  const n = norm(raw);
  const dep = adm2Names.get(NAME_FIX[n] ? norm(NAME_FIX[n]) : n);
  if (!dep) { unmatched.add(raw); continue; }
  const k = `${dep}|${c.Time.slice(0, 4)}`;
  const o = table.get(k) ?? {};
  o[key] = c.Value;
  table.set(k, o);
}
const rows = ["departement;annee;superficie_ha;production_t;rendement_kg_ha"];
for (const [k, o] of [...table].sort()) {
  const [dep, year] = k.split("|");
  if (!(o.area > 0) || !(o.prod > 0)) continue;
  rows.push([dep, year, o.area, o.prod, Math.round((o.prod / o.area) * 1000)].join(";"));
}
fs.mkdirSync("data/sources", { recursive: true });
fs.writeFileSync("data/sources/eaa-rice-departments.csv", rows.join("\n") + "\n");
console.log(rows.length - 1, "lignes; départements sans correspondance ADM2:", [...unmatched].join(", ") || "aucun");
