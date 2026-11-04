// Prévision à un pas des importations nettes, évaluée en ERREUR RELATIVE (logarithmique) sur une série
// longue. Le protocole est fixé avant de lire le résultat :
//   1. backtest à origine glissante sur tous les pas possibles ;
//   2. le modèle est CHOISI sur la première moitié des pas et ÉVALUÉ sur la seconde ;
//   3. il n'est publié que s'il bat la persistance de façon nette ET majoritaire sur la seconde moitié ;
//   4. sinon, on publie une fourchette de référence autour de la persistance, à condition que sa
//      couverture ait été mesurée et soit proche du niveau annoncé. Aucun modèle n'est alors revendiqué.

export type Point = { year: number; value: number };
export type ModelName = "naive" | "drift" | "linear" | "win10" | "loglinear";

export const MODELS: ModelName[] = ["naive", "drift", "linear", "win10", "loglinear"];

export const GATE = {
  minTrain: 10, // années d'entraînement avant le premier test
  minTestSteps: 30, // prévisions hors échantillon requises
  maxRelativeError: 0.9, // erreur relative du modèle <= 90 % de celle de la persistance (sur l'évaluation)
  minWinShare: 0.5, // il doit battre la persistance sur plus de la moitié des pas de l'évaluation
  intervalLevel: 0.8, // niveau annoncé de la fourchette
  minIntervalErrors: 20, // erreurs passées nécessaires pour former une fourchette
  minIntervalSteps: 20, // pas avec fourchette évaluable requis
  coverageTolerance: 0.15, // couverture observée à +- 15 points du niveau annoncé
} as const;

const clampPositive = (v: number) => Math.max(v, 1);

function ols(xs: number[], vs: number[]) {
  const n = xs.length;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = vs.reduce((s, v) => s + v, 0) / n;
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  const sxy = xs.reduce((s, x, i) => s + (x - mx) * (vs[i] - my), 0);
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx };
}

export function predict(model: ModelName, train: Point[], year: number): number {
  const last = train[train.length - 1];
  const xs = train.map((p) => p.year);
  const vs = train.map((p) => p.value);

  switch (model) {
    case "naive":
      return last.value;
    case "drift": {
      const first = train[0];
      return last.value + ((last.value - first.value) / (last.year - first.year)) * (year - last.year);
    }
    case "linear": {
      const { slope, intercept } = ols(xs, vs);
      return clampPositive(intercept + slope * year);
    }
    case "win10": {
      const { slope, intercept } = ols(xs.slice(-10), vs.slice(-10));
      return clampPositive(intercept + slope * year);
    }
    case "loglinear": {
      const { slope, intercept } = ols(xs, vs.map((v) => Math.log(clampPositive(v))));
      return Math.exp(intercept + slope * year);
    }
  }
}

// Quantile empirique des erreurs absolues passées : rang ceil((m + 1) * niveau), plafonné au maximum.
export function quantileHalfWidth(absErrors: number[], level: number): number {
  const sorted = [...absErrors].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length, Math.ceil((sorted.length + 1) * level)) - 1];
}

export type Step = {
  year: number;
  predicted: number;
  actual: number;
  logError: number; // log(réel) - log(prévu) : erreur relative
  halfWidthLog: number | null;
  covered: boolean | null;
};

export type ModelReport = {
  model: ModelName;
  steps: Step[];
};

export const logError = (actual: number, predicted: number) => Math.log(clampPositive(actual)) - Math.log(clampPositive(predicted));
export const meanAbs = (steps: Step[]) => steps.reduce((s, x) => s + Math.abs(x.logError), 0) / steps.length;
/** Erreur relative moyenne en pourcentage (exp(erreur log) - 1 est une approximation : on affiche l'erreur log). */
export const toPercent = (log: number) => (Math.exp(log) - 1) * 100;

export function backtest(series: Point[], model: ModelName, minTrain: number = GATE.minTrain): ModelReport {
  const data = [...series].sort((a, b) => a.year - b.year);
  const steps: Step[] = [];
  for (let i = minTrain; i < data.length; i++) {
    const predicted = predict(model, data.slice(0, i), data[i].year);
    const err = logError(data[i].value, predicted);
    // La fourchette n'utilise que les erreurs des pas précédents : jamais l'année testée.
    const past = steps.map((s) => Math.abs(s.logError));
    const halfWidthLog = past.length >= GATE.minIntervalErrors ? quantileHalfWidth(past, GATE.intervalLevel) : null;
    steps.push({
      year: data[i].year,
      predicted,
      actual: data[i].value,
      logError: err,
      halfWidthLog,
      covered: halfWidthLog === null ? null : Math.abs(err) <= halfWidthLog,
    });
  }
  return { model, steps };
}

export function coverageOf(steps: Step[]) {
  const evaluated = steps.filter((s) => s.covered !== null);
  return {
    evaluated: evaluated.length,
    covered: evaluated.filter((s) => s.covered).length,
    share: evaluated.length ? evaluated.filter((s) => s.covered).length / evaluated.length : null,
  };
}

export type Evaluation = {
  model: ModelName;
  selectionError: number; // erreur log moyenne sur la 1re moitié
  evaluationError: number; // erreur log moyenne sur la 2e moitié
  naiveEvaluationError: number;
  ratio: number; // evaluationError / naiveEvaluationError
  wins: number; // pas de la 2e moitié où |erreur| < |erreur de la persistance|
  evaluationSteps: number;
  nextKt: number; // valeur que ce modèle donnerait pour l'année suivante (information, jamais publiée comme prévision)
};

export type Era = { label: string; from: number; to: number; model: number; naive: number; steps: number };

export type Rolling = { burn: number; steps: number; error: number; persistenceError: number; ratio: number; wins: number };

// Sensibilité de la conclusion à la règle de sélection, et biais de la persistance.
export type Sensitivity = {
  // Règle B : à chaque pas, le modèle est celui qui a la plus faible erreur moyenne sur les pas PASSÉS.
  rolling: Rolling | null;
  // Modèles qui passent le seuil sur la seconde moitié mais n'ont pas été retenus par la règle de sélection.
  notSelectedButBetter: Evaluation[];
  persistenceBias: { meanLog: number; positiveShare: number; n: number };
  coverageWilson95: [number, number] | null;
};

export type Band = {
  baselineKt: number; // dernière valeur observée (persistance)
  baselineYear: number;
  year: number;
  lowerKt: number;
  upperKt: number;
  halfWidthLog: number;
  level: number;
  coverage: ReturnType<typeof coverageOf>;
};

export type ForecastResult =
  | {
      state: "forecast";
      model: ModelName;
      year: number;
      pointKt: number;
      lowerKt: number;
      upperKt: number;
      evaluation: Evaluation;
      band: Band;
      sensitivity: Sensitivity;
      reports: ModelReport[];
      evaluations: Evaluation[];
      eras: Era[];
    }
  | {
      state: "reference_band";
      reasons: string[];
      band: Band;
      sensitivity: Sensitivity;
      reports: ModelReport[];
      evaluations: Evaluation[];
      selected: Evaluation;
      eras: Era[];
    }
  | {
      state: "insufficient_data";
      reasons: string[];
      reports: ModelReport[];
      evaluations: Evaluation[];
    };

// Intervalle de Wilson à 95 % d'une proportion k / n.
export function wilson95(k: number, n: number): [number, number] {
  const z = 1.96;
  const p = k / n;
  const denom = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [centre - half, centre + half];
}

export function rollingSelection(reports: ModelReport[], burn: number): Rolling | null {
  const naive = reports.find((r) => r.model === "naive")!;
  const candidates = reports.filter((r) => r.model !== "naive");
  const n = naive.steps.length;
  if (n <= burn) return null;
  let err = 0;
  let nv = 0;
  let wins = 0;
  for (let k = burn; k < n; k++) {
    const best = candidates.reduce((a, b) => {
      const mean = (r: ModelReport) => r.steps.slice(0, k).reduce((s, x) => s + Math.abs(x.logError), 0) / k;
      return mean(b) < mean(a) ? b : a;
    });
    const e = Math.abs(best.steps[k].logError);
    const p = Math.abs(naive.steps[k].logError);
    err += e;
    nv += p;
    if (e < p) wins++;
  }
  const steps = n - burn;
  return { burn, steps, error: err / steps, persistenceError: nv / steps, ratio: err / nv, wins };
}

function isConsecutive(data: Point[]): boolean {
  return data.every((p, i) => i === 0 || p.year === data[i - 1].year + 1);
}

const ERAS: Array<[string, number, number]> = [
  ["jusqu'en 1990", 0, 1990],
  ["1991 à 2005", 1991, 2005],
  ["2006 et après", 2006, 9999],
];

export function forecastNext(series: Point[]): ForecastResult {
  const data = [...series].sort((a, b) => a.year - b.year);
  const reports = MODELS.map((m) => backtest(data, m));
  const naive = reports.find((r) => r.model === "naive")!;

  if (!isConsecutive(data)) {
    return { state: "insufficient_data", reasons: ["Années non consécutives ou en double : la série n'est pas utilisable telle quelle."], reports, evaluations: [] };
  }
  if (data.some((p) => !Number.isFinite(p.value) || p.value <= 0)) {
    return {
      state: "insufficient_data",
      reasons: ["La série contient une valeur nulle, négative ou illisible : l'erreur relative n'est pas définie."],
      reports,
      evaluations: [],
    };
  }
  if (naive.steps.length < GATE.minTestSteps) {
    return {
      state: "insufficient_data",
      reasons: [`Seulement ${naive.steps.length} prévisions hors échantillon possibles (minimum ${GATE.minTestSteps}).`],
      reports,
      evaluations: [],
    };
  }

  const half = Math.floor(naive.steps.length / 2);
  const naiveEval = naive.steps.slice(half);
  const evaluations: Evaluation[] = reports
    .filter((r) => r.model !== "naive")
    .map((r) => {
      const evalSteps = r.steps.slice(half);
      const ev = meanAbs(evalSteps);
      const nv = meanAbs(naiveEval);
      return {
        model: r.model,
        selectionError: meanAbs(r.steps.slice(0, half)),
        evaluationError: ev,
        naiveEvaluationError: nv,
        ratio: ev / nv,
        wins: evalSteps.filter((s, i) => Math.abs(s.logError) < Math.abs(naiveEval[i].logError)).length,
        evaluationSteps: evalSteps.length,
        nextKt: predict(r.model, data, data[data.length - 1].year + 1),
      };
    });

  // Choix sur la première moitié UNIQUEMENT : la seconde n'a pas servi à choisir.
  const selected = [...evaluations].sort((a, b) => a.selectionError - b.selectionError)[0];
  const selectedReport = reports.find((r) => r.model === selected.model)!;

  const eras: Era[] = ERAS.map(([label, from, to]) => {
    const pick = (r: ModelReport) => r.steps.filter((s) => s.year >= from && s.year <= to);
    const m = pick(selectedReport);
    const n = pick(naive);
    return { label, from, to, model: m.length ? meanAbs(m) : NaN, naive: n.length ? meanAbs(n) : NaN, steps: m.length };
  }).filter((e) => e.steps > 0);

  // Fourchette de référence : persistance, demi-largeur = quantile des erreurs relatives passées.
  const last = data[data.length - 1];
  const halfWidthLog = quantileHalfWidth(naive.steps.map((s) => Math.abs(s.logError)), GATE.intervalLevel);
  const coverage = coverageOf(naive.steps);
  const band: Band = {
    baselineKt: last.value,
    baselineYear: last.year,
    year: last.year + 1,
    lowerKt: last.value * Math.exp(-halfWidthLog),
    upperKt: last.value * Math.exp(halfWidthLog),
    halfWidthLog,
    level: GATE.intervalLevel,
    coverage,
  };

  const naiveSigned = naive.steps.map((s) => s.logError);
  const sensitivity: Sensitivity = {
    rolling: rollingSelection(reports, 12),
    notSelectedButBetter: evaluations.filter(
      (e) => e.model !== selected.model && e.ratio <= GATE.maxRelativeError && e.wins > GATE.minWinShare * e.evaluationSteps,
    ),
    persistenceBias: {
      meanLog: naiveSigned.reduce((s, v) => s + v, 0) / naiveSigned.length,
      positiveShare: naiveSigned.filter((v) => v > 0).length / naiveSigned.length,
      n: naiveSigned.length,
    },
    coverageWilson95: coverage.evaluated > 0 ? wilson95(coverage.covered, coverage.evaluated) : null,
  };

  const reasons: string[] = [];
  if (!(selected.ratio <= GATE.maxRelativeError)) {
    reasons.push(
      `Le modèle choisi sur la première moitié (${selected.model}) ne bat pas nettement la persistance sur la seconde : erreur relative ${selected.ratio.toFixed(2)} fois celle de la persistance (il faut ${GATE.maxRelativeError} ou moins).`,
    );
  }
  if (selected.wins <= GATE.minWinShare * selected.evaluationSteps) {
    reasons.push(`Il ne la bat que sur ${selected.wins} pas sur ${selected.evaluationSteps} (majorité requise).`);
  }

  if (reasons.length === 0) {
    const year = last.year + 1;
    const pointKt = predict(selected.model, data, year);
    return {
      state: "forecast",
      model: selected.model,
      year,
      pointKt,
      lowerKt: pointKt * Math.exp(-halfWidthLog),
      upperKt: pointKt * Math.exp(halfWidthLog),
      evaluation: selected,
      band,
      sensitivity,
      reports,
      evaluations,
      eras,
    };
  }

  // La fourchette de référence n'est publiée que si sa couverture a été mesurée et tient son niveau.
  const calibrated =
    coverage.share !== null &&
    coverage.evaluated >= GATE.minIntervalSteps &&
    Math.abs(coverage.share - GATE.intervalLevel) <= GATE.coverageTolerance;
  if (!calibrated) {
    reasons.push(
      `La fourchette de référence n'est pas assez calibrée (couverture ${coverage.share === null ? "non évaluée" : Math.round(coverage.share * 100) + " %"} sur ${coverage.evaluated} prévisions, niveau annoncé ${Math.round(GATE.intervalLevel * 100)} %).`,
    );
    return { state: "insufficient_data", reasons, reports, evaluations };
  }
  return { state: "reference_band", reasons, band, sensitivity, reports, evaluations, selected, eras };
}
