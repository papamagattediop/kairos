// Extrait l'historique FAOSTAT 1961-2013 du riz du Sénégal (ancienne nomenclature : « Rice (Milled Equivalent) »).
// Usage : node scripts/build-faostat-historic-csv.mjs <FoodBalanceSheetsHistoric_E_Africa_NOFLAG.csv> <AAAA-MM-JJ>
// Fichier source (public, 5 Mo) : https://bulks-faostat.fao.org/production/FoodBalanceSheetsHistoric_E_Africa.zip
import { readFileSync, writeFileSync } from "node:fs";

const [inputPath, retrievedAt] = process.argv.slice(2);
if (!inputPath || !/^\d{4}-\d{2}-\d{2}$/.test(retrievedAt ?? "")) {
  console.error("Usage : node scripts/build-faostat-historic-csv.mjs <fichier.csv> <AAAA-MM-JJ>");
  process.exit(1);
}

const AREA = "195"; // Senegal
const ITEM = "2805"; // Rice (Milled Equivalent)
const SOURCE_URL = "https://www.fao.org/faostat/en/#data/FBS";

const ELEMENTS = {
  5511: ["Production", "Quantité produite (riz en équivalent usiné)"],
  5611: ["Import quantity", "Importations (riz en équivalent usiné)"],
  5911: ["Export quantity", "Exportations (riz en équivalent usiné)"],
};

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
const [iArea, iItem, iEl, iUnit] = ["Area Code", "Item Code", "Element Code", "Unit"].map(col);
const years = header.map((h, i) => [h, i]).filter(([h]) => /^Y\d{4}$/.test(h));

const out = ["source,source_url,retrieved_at,product,element_code,element,year,calendar_year_basis,value,unit,definition,license"];
let count = 0;
for (const line of lines.slice(1)) {
  const cells = parseLine(line);
  if (cells[iArea] !== AREA || cells[iItem] !== ITEM || !ELEMENTS[cells[iEl]]) continue;
  const [element, definition] = ELEMENTS[cells[iEl]];
  for (const [h, i] of years) {
    if (cells[i] === "") throw new Error(`valeur manquante : élément ${cells[iEl]}, ${h}`);
    const value = Number(cells[i]);
    if (!Number.isFinite(value)) throw new Error(`valeur illisible : ${cells[i]}`);
    out.push(
      [
        "FAOSTAT Food Balances (to 2013 - old methodology)",
        SOURCE_URL,
        retrievedAt,
        "Rice (Milled Equivalent) (Senegal)",
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
writeFileSync("data/sources/faostat-fbs-senegal-rice-historic.csv", out.join("\n") + "\n");
console.log(`${count} lignes écrites`);
