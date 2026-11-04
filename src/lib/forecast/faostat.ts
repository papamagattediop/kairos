import type { Point } from "./index";

export type FaostatSeries = {
  source: string;
  license: string;
  retrievedAt: string;
  production: Point[];
  imports: Point[];
  exports: Point[];
  stockVariation: Point[];
  domesticSupply: Point[];
  netImports: Point[];
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
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

const CODES = {
  production: "5511",
  imports: "5611",
  exports: "5911",
  stockVariation: "5072",
  domesticSupply: "5301",
} as const;

// Lit data/sources/faostat-fbs-senegal-rice.csv. Toute valeur illisible lève une erreur :
// on ne comble jamais une ligne douteuse.
export function parseFaostatCsv(text: string): FaostatSeries {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = splitCsvLine(lines[0]);
  const idx = (name: string) => {
    const i = header.indexOf(name);
    if (i === -1) throw new Error(`colonne absente : ${name}`);
    return i;
  };
  const iCode = idx("element_code");
  const iYear = idx("year");
  const iValue = idx("value");
  const iUnit = idx("unit");
  const iSource = idx("source");
  const iLicense = idx("license");
  const iRetrieved = idx("retrieved_at");
  const iBasis = idx("calendar_year_basis");

  const byCode = new Map<string, Point[]>();
  let source = "";
  let license = "";
  let retrievedAt = "";
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const year = Number(cells[iYear]);
    const value = Number(cells[iValue]);
    if (!Number.isInteger(year) || !Number.isFinite(value)) throw new Error(`ligne illisible : ${line}`);
    if (cells[iUnit] !== "1000 t") throw new Error(`unité inattendue : ${cells[iUnit]}`);
    if (cells[iBasis] !== "calendar year") throw new Error(`base d'année inattendue : ${cells[iBasis]}`);
    if (source && (source !== cells[iSource] || license !== cells[iLicense])) {
      throw new Error("source ou licence incohérente dans le fichier");
    }
    source = cells[iSource];
    license = cells[iLicense];
    retrievedAt = cells[iRetrieved];
    const list = byCode.get(cells[iCode]) ?? [];
    list.push({ year, value });
    byCode.set(cells[iCode], list);
  }

  const get = (code: string) => (byCode.get(code) ?? []).sort((a, b) => a.year - b.year);
  const imports = get(CODES.imports);
  const exports_ = get(CODES.exports);

  // Une donnée manquante ou en double n'est jamais comblée ni ignorée : on s'arrête.
  for (const [code, list] of byCode) {
    if (new Set(list.map((p) => p.year)).size !== list.length) {
      throw new Error(`année en double pour l'élément ${code}`);
    }
  }
  const yearsOf = (list: Point[]) => list.map((p) => p.year).join(",");
  if (imports.length === 0 || yearsOf(imports) !== yearsOf(exports_)) {
    throw new Error("importations et exportations n'ont pas les mêmes années");
  }
  for (const code of Object.values(CODES)) {
    if (yearsOf(get(code)) !== yearsOf(imports)) throw new Error(`années incohérentes pour l'élément ${code}`);
  }

  const exportsByYear = new Map(exports_.map((p) => [p.year, p.value]));
  const netImports = imports.map((p) => ({
    year: p.year,
    value: p.value - (exportsByYear.get(p.year) as number),
  }));

  return {
    source,
    license,
    retrievedAt,
    production: get(CODES.production),
    imports,
    exports: exports_,
    stockVariation: get(CODES.stockVariation),
    domesticSupply: get(CODES.domesticSupply),
    netImports,
  };
}

// ---------- historique 1961-2013 (ancienne nomenclature, riz en équivalent usiné) ----------

export type HistoricSeries = {
  source: string;
  license: string;
  retrievedAt: string;
  production: Point[];
  imports: Point[];
  exports: Point[];
  netImports: Point[];
};

export function parseHistoricCsv(text: string): HistoricSeries {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const header = splitCsvLine(lines[0]);
  const idx = (name: string) => {
    const i = header.indexOf(name);
    if (i === -1) throw new Error(`colonne absente : ${name}`);
    return i;
  };
  const [iCode, iYear, iValue, iUnit, iSource, iLicense, iRetrieved, iBasis, iProduct] = [
    "element_code", "year", "value", "unit", "source", "license", "retrieved_at", "calendar_year_basis", "product",
  ].map(idx);

  const byCode = new Map<string, Point[]>();
  let source = "";
  let license = "";
  let retrievedAt = "";
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const year = Number(cells[iYear]);
    const value = Number(cells[iValue]);
    if (!Number.isInteger(year) || !Number.isFinite(value)) throw new Error(`ligne illisible : ${line}`);
    if (cells[iUnit] !== "1000 t") throw new Error(`unité inattendue : ${cells[iUnit]}`);
    if (cells[iBasis] !== "calendar year") throw new Error(`base d'année inattendue : ${cells[iBasis]}`);
    if (!/Milled Equivalent/.test(cells[iProduct])) throw new Error(`produit inattendu : ${cells[iProduct]}`);
    if (source && (source !== cells[iSource] || license !== cells[iLicense])) {
      throw new Error("source ou licence incohérente dans le fichier");
    }
    source = cells[iSource];
    license = cells[iLicense];
    retrievedAt = cells[iRetrieved];
    const list = byCode.get(cells[iCode]) ?? [];
    list.push({ year, value });
    byCode.set(cells[iCode], list);
  }

  const get = (code: string) => (byCode.get(code) ?? []).sort((a, b) => a.year - b.year);
  for (const [code, list] of byCode) {
    if (new Set(list.map((p) => p.year)).size !== list.length) throw new Error(`année en double pour l'élément ${code}`);
  }
  const [production, imports, exports_] = [get("5511"), get("5611"), get("5911")];
  const years = (l: Point[]) => l.map((p) => p.year).join(",");
  if (imports.length === 0 || years(imports) !== years(exports_) || years(imports) !== years(production)) {
    throw new Error("années incohérentes entre production, importations et exportations");
  }
  const consecutive = imports.every((p, i) => i === 0 || p.year === imports[i - 1].year + 1);
  if (!consecutive) throw new Error("années non consécutives dans l'historique");

  const expByYear = new Map(exports_.map((p) => [p.year, p.value]));
  const netImports = imports.map((p) => ({ year: p.year, value: p.value - (expByYear.get(p.year) as number) }));
  return { source, license, retrievedAt, production, imports, exports: exports_, netImports };
}

export type Splice = {
  series: Point[];
  factor: number;
  overlap: Array<{ year: number; oldKt: number; newKt: number; ratio: number }>;
};

// Les deux séries ne sont pas dans la même unité (riz usiné avant 2010, probablement équivalent
// paddy ensuite). Le facteur est mesuré sur les années communes et accepté seulement s'il est
// stable : sinon on s'arrête, on ne fabrique pas une série continue.
export function spliceNetImports(historic: Point[], recent: Point[], tolerance = 0.01): Splice {
  const recentByYear = new Map(recent.map((p) => [p.year, p.value]));
  const overlap = historic
    .filter((p) => recentByYear.has(p.year) && p.value > 0)
    .map((p) => ({
      year: p.year,
      oldKt: p.value,
      newKt: recentByYear.get(p.year) as number,
      ratio: (recentByYear.get(p.year) as number) / p.value,
    }));
  if (overlap.length < 3) throw new Error("recouvrement insuffisant pour mesurer le facteur d'unité");
  const factor = overlap.reduce((s, o) => s + o.ratio, 0) / overlap.length;
  if (overlap.some((o) => Math.abs(o.ratio / factor - 1) > tolerance)) {
    throw new Error("facteur d'unité instable sur les années communes : épissage refusé");
  }
  const firstRecent = Math.min(...recent.map((p) => p.year));
  const series = [
    ...historic.filter((p) => p.year < firstRecent).map((p) => ({ year: p.year, value: p.value * factor })),
    ...recent,
  ].sort((a, b) => a.year - b.year);
  return { series, factor, overlap };
}
