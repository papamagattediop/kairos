import { calculateBalance } from "../decision-engine";
import { PRODUCTS, displayFor } from "../products";
import { findDepartment, rankDepartments, riceSummary } from "../rice-yield";
import type { AssistantReply, ChatMessage, ToolSpec } from "./client";

export const AGENT_SYSTEM_PROMPT = `Tu es l'agent KAIROS, un suivi de l'offre alimentaire au Sénégal.
Règles : tu ne calcules jamais toi-même. Tout nombre de ta réponse vient d'un outil ou de la question de l'utilisateur.
N'écris pas de nombre en toutes lettres, ni de date ou d'année qui ne figure pas dans un résultat d'outil.
Pour les importations nettes de riz, utilise l'outil get_forecast. S'il indique qu'aucun modèle n'est revendiqué, ne parle jamais de « prévision » : décris la fourchette de référence autour de la dernière valeur, sa couverture mesurée et pourquoi aucun modèle n'a été retenu. Précise l'unité (équivalent paddy probable).
Pour le rendement du riz d'un département (kg/ha), utilise get_department_rice ; pour comparer ou classer, list_department_rice. L'estimation est la moyenne du département avec une bande d'erreurs observées : ce n'est pas une prévision par modèle. Dis-le, rappelle que la bande décrit l'ensemble du groupe de départements et non une garantie pour celui-ci, et que le gain apporté par la pluie est faible et fragile.
Si une donnée manque ou si un outil refuse, dis-le clairement, sans la remplacer.
Ne donne aucune recommandation de politique publique ni d'ordre d'importation.
Réponds en français, en quelques phrases, sans liste numérotée.`;

const NULLABLE_NUMBER = { type: ["number", "null"] };

export const AGENT_TOOLS: ToolSpec[] = [
  {
    type: "function",
    function: {
      name: "list_products",
      description: "Liste les produits suivis, leur niveau de maturité et ce qui peut en être affiché.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "compute_balance",
      description:
        "Calcule l'écart de disponibilité (kt) = utilisation - production - importations - stocks. Un terme inconnu doit valoir null : l'outil refuse alors de calculer. Chaque valeur doit venir de la question de l'utilisateur ou d'une extraction.",
      parameters: {
        type: "object",
        properties: {
          demandKt: NULLABLE_NUMBER,
          productionKt: NULLABLE_NUMBER,
          importsKt: NULLABLE_NUMBER,
          stockReleaseKt: NULLABLE_NUMBER,
        },
        required: ["demandKt", "productionKt", "importsKt", "stockReleaseKt"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_forecast",
      description:
        "Renvoie l'analyse des importations nettes de riz du Sénégal (série FAOSTAT 1961-2023, kt, année civile) : le test hors échantillon de plusieurs modèles et, selon le résultat, soit une prévision de modèle validée, soit une fourchette de référence autour de la dernière valeur (avec sa couverture mesurée), soit un refus avec ses raisons.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_department_rice",
      description:
        "Rendement du riz d'un département du Sénégal (Enquête Agricole Annuelle, kg/ha, 2017-2025) : historique, pluie, estimation de référence avec sa bande, ou refus motivé si les données sont insuffisantes.",
      parameters: { type: "object", properties: { department: { type: "string" } }, required: ["department"] },
    },
  },
  {
    type: "function",
    function: {
      name: "list_department_rice",
      description: "Classe les départements dont le rendement du riz est estimable, par rendement moyen décroissant (kg/ha).",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "extract_terms",
      description:
        "Extrait les termes du bilan depuis un texte source fourni par l'utilisateur. Chaque nombre est vérifié par le code contre la source.",
      parameters: {
        type: "object",
        properties: { source: { type: "string" } },
        required: ["source"],
      },
    },
  },
];

export type ToolDeps = {
  extract: (source: string) => Promise<unknown>;
  // Résumé de la prévision calculée par le code à partir des données FAOSTAT versionnées.
  forecast: () => Promise<unknown>;
  // Une valeur d'entrée du calcul doit venir de la question ou d'une extraction vérifiée.
  isTrusted: (n: number) => boolean;
};

// ---------- lecture des nombres ----------

// Jeton numérique : groupes de milliers à exactement 3 chiffres, sinon décimale.
// Une virgule suivie d'une espace termine le jeton ("1, 2 et 3" donne 1, 2 et 3).
const NUMBER_TOKEN =
  /\d{1,3}(?:[   ]\d{3})+(?:[.,]\d+)?|\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?|\d+(?:[.,]\d+)?/g;

function readings(token: string): number[] {
  const s = token.replace(/[\s  ]/g, "");
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  const num = (x: string) => Number(x);

  if (hasDot && hasComma) {
    const decimal = s.lastIndexOf(".") > s.lastIndexOf(",") ? "." : ",";
    const thousands = decimal === "." ? "," : ".";
    return [num(s.split(thousands).join("").replace(decimal, "."))];
  }
  if (hasDot || hasComma) {
    const sep = hasDot ? "." : ",";
    const parts = s.split(sep);
    if (parts.length > 2) return [num(parts.join(""))];
    // "1,250" peut être 1250 ou 1,25 : seul cas ambigu, on accepte les deux lectures.
    if (parts[1].length === 3 && parts[0].length <= 3) {
      return [num(parts.join("")), num(`${parts[0]}.${parts[1]}`)];
    }
    return [num(`${parts[0]}.${parts[1]}`)];
  }
  return [num(s)];
}

function tokensOf(text: string): string[] {
  return text.normalize("NFKC").match(NUMBER_TOKEN) ?? [];
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

// Tous les nombres d'une valeur JSON : feuilles numériques exactes, et nombres lus dans les chaînes.
export function collectNumbers(value: unknown): number[] {
  if (typeof value === "number") return Number.isFinite(value) ? [value] : [];
  if (typeof value === "string") return tokensOf(value).flatMap(readings);
  if (Array.isArray(value)) return value.flatMap(collectNumbers);
  if (value && typeof value === "object") return Object.values(value).flatMap(collectNumbers);
  return [];
}

// Nombres en toutes lettres (« un » est exclu : c'est aussi l'article).
const SPELLED = /\b(deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|vingt|trente|quarante|cinquante|soixante|cent|mille|millions?|milliards?)\b/gi;

// Éléments de la réponse qui ne viennent d'aucun outil ni de la question.
export function unverifiedNumbers(answer: string, results: unknown[], userNumbers: number[] = []): string[] {
  const known = [...results.flatMap(collectNumbers), ...userNumbers];
  const text = answer.normalize("NFKC");
  const flagged: string[] = [];

  for (const m of text.matchAll(NUMBER_TOKEN)) {
    // Un signe moins collé au nombre (hors tiret entre deux mots ou chiffres) change la valeur lue.
    const negative = /(?:^|[\s(])[-−–]$/.test(text.slice(Math.max(0, m.index - 2), m.index));
    const sign = negative ? -1 : 1;
    if (!readings(m[0]).some((n) => known.some((k) => close(k, sign * n)))) flagged.push((negative ? "-" : "") + m[0].trim());
  }
  for (const match of text.match(SPELLED) ?? []) flagged.push(match);
  for (const ch of text.match(/\p{Nd}/gu) ?? []) {
    if (!/[0-9]/.test(ch)) flagged.push(ch); // chiffre non ASCII qui a échappé à la normalisation
  }
  return flagged;
}

// ---------- outils ----------

export async function executeTool(name: string, rawArgs: string, deps: ToolDeps): Promise<unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawArgs || "{}");
  } catch {
    return { error: "arguments illisibles" };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { error: "arguments illisibles" };
  }
  const args = parsed as Record<string, unknown>;

  try {
    switch (name) {
      case "list_products":
        return PRODUCTS.map((p) => ({ ...p, display: displayFor(p.level) }));
      case "compute_balance": {
        const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
        const inputs = {
          demandKt: num(args.demandKt),
          productionKt: num(args.productionKt),
          importsKt: num(args.importsKt),
          stockReleaseKt: num(args.stockReleaseKt),
        };
        // Le message ne recopie pas la valeur refusée : elle deviendrait « connue » pour la vérification.
        if (Object.values(inputs).some((v) => v !== null && !deps.isTrusted(v))) {
          return { error: "valeur proposée absente de la question et de toute extraction vérifiée" };
        }
        return calculateBalance(inputs);
      }
      case "get_forecast":
        return await deps.forecast();
      case "get_department_rice": {
        const dep = typeof args.department === "string" ? findDepartment(args.department) : null;
        return dep ? riceSummary(dep) : { error: "département inconnu" };
      }
      case "list_department_rice":
        return { ranking: rankDepartments() };
      case "extract_terms":
        return typeof args.source === "string" && args.source.trim()
          ? await deps.extract(args.source)
          : { error: "source manquante" };
      default:
        return { error: `outil inconnu : ${name}` };
    }
  } catch {
    return { error: "outil indisponible" };
  }
}

// ---------- boucle de l'agent ----------

export type AgentResult = {
  answer: string;
  verified: boolean;
  unverifiedNumbers: string[];
  trace: Array<{ tool: string; args: string; result: unknown }>;
};

const MAX_ROUNDS = 4;
const MAX_CALLS_PER_ROUND = 3;
const MAX_CALLS_TOTAL = 6;

export async function runAgent(
  question: string,
  chat: (messages: ChatMessage[], tools: ToolSpec[]) => Promise<AssistantReply>,
  deps: Pick<ToolDeps, "extract" | "forecast">,
): Promise<AgentResult> {
  const messages: ChatMessage[] = [
    { role: "system", content: AGENT_SYSTEM_PROMPT },
    { role: "user", content: question },
  ];
  const trace: AgentResult["trace"] = [];
  const results: unknown[] = [];
  const userNumbers = collectNumbers(question);
  const trusted = [...userNumbers];
  const toolDeps: ToolDeps = {
    extract: deps.extract,
    forecast: deps.forecast,
    isTrusted: (n) => trusted.some((t) => close(t, n)),
  };
  let totalCalls = 0;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const reply = await chat(messages, AGENT_TOOLS);

    const seen = new Set<string>();
    const calls = reply.tool_calls
      .filter((c) => c?.function?.name)
      .slice(0, MAX_CALLS_PER_ROUND)
      .map((c, i) => {
        let id = c.id && !seen.has(c.id) ? c.id : `call_${round}_${i}`;
        while (seen.has(id)) id += "_";
        seen.add(id);
        return { ...c, id };
      });

    if (calls.length === 0) {
      const answer = (reply.content ?? "").trim();
      const bad = unverifiedNumbers(answer, results, userNumbers);
      return { answer, verified: answer !== "" && bad.length === 0, unverifiedNumbers: bad, trace };
    }
    if (totalCalls + calls.length > MAX_CALLS_TOTAL) break;
    totalCalls += calls.length;

    messages.push({ role: "assistant", content: reply.content, tool_calls: calls });
    for (const call of calls) {
      const result = await executeTool(call.function.name, call.function.arguments, toolDeps);
      if (call.function.name === "extract_terms" && result && typeof result === "object" && "inputs" in result) {
        trusted.push(...collectNumbers((result as { inputs: unknown }).inputs));
      }
      results.push(result);
      trace.push({ tool: call.function.name, args: call.function.arguments, result });
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  return {
    answer: "L'agent n'a pas abouti dans le nombre d'étapes autorisé.",
    verified: false,
    unverifiedNumbers: [],
    trace,
  };
}
