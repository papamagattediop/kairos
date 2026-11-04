import type { BalanceInputs } from "../decision-engine";

type Field = keyof BalanceInputs;

const FIELDS: Field[] = [
  "demandKt",
  "productionKt",
  "importsKt",
  "stockReleaseKt",
];

// Le libellé du terme doit figurer dans la citation : une citation ne peut pas
// servir un terme sans rapport.
const KEYWORDS: Record<Field, RegExp> = {
  demandKt: /consumption|consommation|utilisation|\buse\b|demand/i,
  productionKt: /production/i,
  importsKt: /import/i,
  stockReleaseKt: /stock/i,
};

// L'unité est lue dans la citation par le code, jamais prise sur parole du
// modèle. Ordre : motifs les plus spécifiques d'abord.
const UNIT_PATTERNS: Array<{ pattern: RegExp; toKt: (n: number) => number }> = [
  { pattern: /\(?\s*(?:1000|1,000|thousand)\s*(?:mt|t|tonnes?|tons?|metric tons?)\s*\)?/i, toKt: (n) => n },
  { pattern: /\bk\s?t\b|\bkilotonnes?\b/i, toKt: (n) => n },
  { pattern: /\bmillion\s+(?:metric\s+)?(?:tonnes?|tons?)\b|\bmmt\b/i, toKt: (n) => n * 1000 },
  { pattern: /\b(?:metric\s+)?(?:tonnes?|tons?)\b/i, toKt: (n) => n / 1000 },
];

const YEAR_PATTERN = /\b(?:MY\s?)?(?:19|20)\d{2}(?:\s?[/-]\s?(?:\d{4}|\d{2}))?\b/gi;
const MIN_QUOTE_CHARS = 15;

export const EXTRACTION_SYSTEM_PROMPT = `Tu extrais des termes d'un bilan alimentaire depuis un texte source.
Réponds uniquement par un objet JSON, sans texte autour, de la forme :
{"demandKt":T,"productionKt":T,"importsKt":T,"stockReleaseKt":T}
où T = {"value": nombre tel qu'écrit dans la source ou null, "quote": extrait EXACT de la source ou null}.
demandKt = utilisation intérieure, productionKt = production, importsKt = importations nettes, stockReleaseKt = contribution nette des stocks.
Chaque extrait doit contenir le libellé du terme, son unité et un seul nombre (celui de "value").
Règles : ne calcule rien, ne convertis rien, n'estime rien. Si un terme n'est pas écrit dans la source, mets value et quote à null.`;

export type ExtractionResult = {
  inputs: BalanceInputs;
  rejected: Array<{ field: string; reason: string }>;
  campaigns: string[];
};

function normalize(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

// Convention unique : un séparateur isolé suivi de 3 chiffres est un séparateur
// de milliers ("1,250" et "1.250" valent 1250); sinon c'est une décimale.
function parseNumber(token: string): number | null {
  const lastDot = token.lastIndexOf(".");
  const lastComma = token.lastIndexOf(",");
  let t = token;
  if (lastDot !== -1 && lastComma !== -1) {
    const decimal = lastDot > lastComma ? "." : ",";
    const thousands = decimal === "." ? "," : ".";
    t = t.split(thousands).join("").replace(decimal, ".");
  } else if (lastDot !== -1 || lastComma !== -1) {
    const sep = lastDot !== -1 ? "." : ",";
    const parts = t.split(sep);
    const groupedThousands = parts.length > 2 || parts[parts.length - 1].length === 3;
    t = groupedThousands ? parts.join("") : parts.join(".");
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

// La citation ne doit pas couper un nombre de la source ("1,2" dans "1,250").
function quoteIsBounded(haystack: string, quote: string): boolean {
  let from = 0;
  for (;;) {
    const i = haystack.indexOf(quote, from);
    if (i === -1) return false;
    const before = haystack[i - 1] ?? "";
    const after = haystack[i + quote.length] ?? "";
    const afterNext = haystack[i + quote.length + 1] ?? "";
    const cutsAfter = /\d/.test(after) || (/[.,]/.test(after) && /\d/.test(afterNext));
    const cutsBefore = /[\d.,]/.test(before) && /^\d/.test(quote);
    if (!cutsAfter && !cutsBefore) return true;
    from = i + 1;
  }
}

type Parsed = { valueKt: number } | { reason: string };

function readQuote(field: Field, quote: string): Parsed {
  if (!KEYWORDS[field].test(quote)) return { reason: "libellé du terme absent de l'extrait" };

  const unit = UNIT_PATTERNS.find((u) => u.pattern.test(quote));
  if (!unit) {
    return { reason: /\bmt\b/i.test(quote) ? "unité MT ambiguë" : "unité absente de l'extrait" };
  }

  // On retire unité et années avant de chercher le nombre, pour qu'ils ne soient pas lus comme valeur.
  const stripped = quote.replace(unit.pattern, " ").replace(YEAR_PATTERN, " ");
  const tokens = [...stripped.matchAll(/\d[\d.,]*\d|\d/g)];
  if (tokens.length === 0) return { reason: "aucun nombre dans l'extrait" };
  if (tokens.length > 1) return { reason: "plusieurs nombres dans l'extrait" };

  const [token] = tokens;
  const value = parseNumber(token[0]);
  if (value === null) return { reason: "nombre illisible" };

  const at = token.index ?? 0;
  const prev = stripped[at - 1] ?? "";
  const prevPrev = stripped[at - 2] ?? "";
  const next = stripped[at + token[0].length] ?? "";
  const negative =
    prev === "−" ||
    (prev === "-" && (at === 1 || /[\s(]/.test(prevPrev))) ||
    (prev === "(" && next === ")");

  return { valueKt: unit.toKt(negative ? -value : value) };
}

export function parseJsonObject(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Le modèle propose, le code décide : le nombre et l'unité sont relus par le code
// dans une citation vérifiée mot pour mot dans la source. Sinon le terme reste
// null et le moteur de bilan refusera.
export function validateExtraction(raw: unknown, source: string): ExtractionResult {
  const inputs: BalanceInputs = {
    demandKt: null,
    productionKt: null,
    importsKt: null,
    stockReleaseKt: null,
  };
  const rejected: ExtractionResult["rejected"] = [];
  const haystack = normalize(source);
  const campaigns = [
    ...new Set(
      (source.match(YEAR_PATTERN) ?? []).map((c) => c.replace(/\s/g, "")).filter((c) => /[/-]/.test(c)),
    ),
  ];
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const usedQuotes = new Set<string>();

  for (const field of FIELDS) {
    const term = obj[field];
    if (term === null || term === undefined) continue;
    if (typeof term !== "object") {
      rejected.push({ field, reason: "terme mal formé" });
      continue;
    }
    const { value, quote } = term as { value?: unknown; quote?: unknown };
    if (value === null || value === undefined) continue;

    if (typeof value !== "number" || !Number.isFinite(value)) {
      rejected.push({ field, reason: "valeur non numérique" });
      continue;
    }
    if (typeof quote !== "string") {
      rejected.push({ field, reason: "extrait manquant" });
      continue;
    }
    const q = normalize(quote);
    if (q.length < MIN_QUOTE_CHARS) {
      rejected.push({ field, reason: "extrait trop court" });
      continue;
    }
    if (!quoteIsBounded(haystack, q)) {
      rejected.push({ field, reason: "extrait absent de la source" });
      continue;
    }
    if (usedQuotes.has(q)) {
      rejected.push({ field, reason: "extrait déjà utilisé pour un autre terme" });
      continue;
    }

    const parsed = readQuote(field, q);
    if ("reason" in parsed) {
      rejected.push({ field, reason: parsed.reason });
      continue;
    }
    // Le modèle doit être d'accord avec la lecture du code, sinon on refuse.
    const stated = normalizeStated(value, q);
    if (stated === null || Math.abs(stated - parsed.valueKt) > 1e-9 * Math.max(1, Math.abs(stated))) {
      rejected.push({ field, reason: "valeur annoncée différente de l'extrait" });
      continue;
    }
    if (parsed.valueKt < 0 && field !== "stockReleaseKt") {
      rejected.push({ field, reason: "valeur négative non autorisée pour ce terme" });
      continue;
    }

    usedQuotes.add(q);
    inputs[field] = parsed.valueKt;
  }

  return { inputs, rejected, campaigns };
}

// Compare dans la même unité que le code : le modèle annonce le nombre tel qu'écrit.
function normalizeStated(value: number, quote: string): number | null {
  const unit = UNIT_PATTERNS.find((u) => u.pattern.test(quote));
  return unit ? unit.toKt(value) : null;
}
