// Extrait le bilan du riz du Sénégal depuis le fichier FAOSTAT « Food Balances (2010-) ».
// Usage : node scripts/build-faostat-csv.mjs <chemin vers FoodBalanceSheets_E_Africa_NOFLAG.csv> <date de récupération AAAA-MM-JJ>
// Le fichier source se télécharge ici (public, 4 Mo) :
//   https://bulks-faostat.fao.org/production/FoodBalanceSheets_E_Africa.zip
import { readFileSync, writeFileSync } from "node:fs";

const [inputPath, retrievedAt] = process.argv.slice(2);
if (!inputPath || !/^\d{4}-\d{2}-\d{2}$/.test(retrievedAt ?? "")) {
  console.error("Usage : node scripts/build-faostat-csv.mjs <fichier.csv> <AAAA-MM-JJ>");
  process.exit(1);
}

const AREA = "195"; // Senegal
const ITEM = "2807"; // Rice and products
const SOURCE_URL = "https://www.fao.org/faostat/en/#data/FBS";

// Définitions : la relation « offre = production + importations - exportations - variation »
// a été vérifiée sur les 14 années (écart de 0 à 1 kt, arrondis).
const ELEMENTS = {
  5511: ["Production", "Quantité produite (riz et produits ; l'unité exacte n'est pas précisée par le fichier, équivalent paddy probable)"],
  5611: ["Import quantity", "Importations"],
  5911: ["Export quantity", "Exportations"],
  5072: ["Stock Variation", "Variation de stocks : valeur positive = hausse des stocks (offre = production + importations - exportations - variation)"],
  5301: ["Domestic supply quantity", "Offre intérieure = somme des utilisations ci-dessous"],
  5142: ["Food", "Utilisation : alimentation humaine"],
  5521: ["Feed", "Utilisation : alimentation animale"],
  5527: ["Seed", "Utilisation : semences"],
  5123: ["Losses", "Utilisation : pertes"],
  5131: ["Processing", "Utilisation : transformation"],
  5154: ["Other uses (non-food)", "Utilisation : autres usages non alimentaires"],
  5170: ["Residuals", "Résiduel d'équilibrage"],
};

// Découpe une ligne CSV avec guillemets.
function parseLine(line) {
  const cells = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      cells.push(cur);
      cur = "";
    } else cur += c;
  }
  cells.push(cur);
  return cells;
}

const lines = readFileSync(inputPath, "latin1").split(/\r?\n/).filter(Boolean);
const header = parseLine(lines[0]);
const col = (name) => header.indexOf(name);
const iArea = col("Area Code");
const iItem = col("Item Code");
const iEl = col("Element Code");
const iUnit = col("Unit");
const years = header.map((h, i) => [h, i]).filter(([h]) => /^Y\d{4}$/.test(h));

const out = [
  "source,source_url,retrieved_at,product,element_code,element,year,calendar_year_basis,value,unit,definition,license",
];
let count = 0;
for (const line of lines.slice(1)) {
  const cells = parseLine(line);
  if (cells[iArea] !== AREA || cells[iItem] !== ITEM || !ELEMENTS[cells[iEl]]) continue;
  const [element, definition] = ELEMENTS[cells[iEl]];
  for (const [h, i] of years) {
    // Une cellule vide n'est jamais ignorée en silence : la série doit être complète.
    if (cells[i] === "") throw new Error(`valeur manquante : élément ${cells[iEl]}, ${h}`);
    const value = Number(cells[i]);
    if (!Number.isFinite(value)) throw new Error(`valeur illisible : ${cells[i]}`);
    out.push(
      [
        "FAOSTAT Food Balances (2010-)",
        SOURCE_URL,
        retrievedAt,
        "Rice and products (Senegal)",
        cells[iEl],
        element,
        h.slice(1),
        "calendar year",
        value,
        cells[iUnit],
        `"${definition}"`,
        "CC-BY-4.0",
      ].join(","),
    );
    count++;
  }
}

writeFileSync("data/sources/faostat-fbs-senegal-rice.csv", out.join("\n") + "\n");
console.log(`${count} lignes écrites`);
