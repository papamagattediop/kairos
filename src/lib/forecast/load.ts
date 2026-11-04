import { readFileSync } from "node:fs";
import { join } from "node:path";
import { forecastNext, coverageOf, GATE, meanAbs, type ForecastResult } from "./index";
import { parseFaostatCsv, parseHistoricCsv, spliceNetImports, type FaostatSeries, type HistoricSeries, type Splice } from "./faostat";

export type Loaded = { recent: FaostatSeries; historic: HistoricSeries; splice: Splice; result: ForecastResult };

// Serveur uniquement : lit les deux CSV versionnés. Aucun appel réseau ni de modèle.
export function loadForecast(): Loaded {
  const dir = join(process.cwd(), "data", "sources");
  const recent = parseFaostatCsv(readFileSync(join(dir, "faostat-fbs-senegal-rice.csv"), "utf8"));
  const historic = parseHistoricCsv(readFileSync(join(dir, "faostat-fbs-senegal-rice-historic.csv"), "utf8"));
  const splice = spliceNetImports(historic.netImports, recent.netImports);
  return { recent, historic, splice, result: forecastNext(splice.series) };
}

const pct = (log: number) => Math.round((Math.exp(log) - 1) * 100);

// Résumé destiné à l'agent : nombres arrondis comme à l'écran, pour que la vérification
// des nombres de sa réponse les reconnaisse.
export function forecastSummary({ splice, result }: Loaded) {
  const round = (n: number) => Math.round(n);
  const naive = result.reports.find((r) => r.model === "naive")!;
  const series = splice.series;
  const last = series[series.length - 1];
  const common = {
    target:
      "importations nettes de riz du Sénégal (importations moins exportations), en kt, année civile, en équivalent paddy probable (série 1961-2009 convertie)",
    source: "FAOSTAT Food Balances (série récente 2010-2023 et ancienne série 1961-2013), licence CC-BY-4.0",
    observedYears: `${series[0].year} à ${last.year}`,
    unitFactorApplied: Number(splice.factor.toFixed(3)),
    lastObservedKt: round(last.value),
    state: result.state,
    testedForecasts: naive.steps.length,
    protocol:
      "modèle choisi sur la première moitié des prévisions testées, évalué sur la seconde ; erreurs en échelle relative (logarithmique)",
    thresholds: { minTestSteps: GATE.minTestSteps, maxRelativeError: GATE.maxRelativeError },
    caveat:
      "pas une prévision officielle ni une recommandation ; la conclusion dépend de la règle de sélection ; unité convertie avec un facteur mesuré sur 4 années communes, probablement paddy mais non confirmé",
  };
  const sens = result.state === "insufficient_data" ? null : result.sensitivity;
  const sensitivity = sens && {
    selectionRuleA: "modèle choisi sur la première moitié des tests, évalué sur la seconde",
    rollingSelectionB: sens.rolling && {
      description: "à chaque pas, modèle à plus faible erreur sur les pas passés",
      steps: sens.rolling.steps,
      ratioToPersistence: Number(sens.rolling.ratio.toFixed(2)),
      stepsWon: sens.rolling.wins,
    },
    modelsBeatingPersistenceButNotSelected: sens.notSelectedButBetter.map((e) => ({
      model: e.model,
      ratioToPersistence: Number(e.ratio.toFixed(2)),
      stepsWon: e.wins,
      evaluationSteps: e.evaluationSteps,
      valueForNextYearKt: Math.round(e.nextKt),
      note: "non retenu par la règle fixée à l'avance ; le retenir maintenant serait choisir sur les données d'évaluation",
    })),
    persistencePositiveErrorSharePercent: Math.round(sens.persistenceBias.positiveShare * 100),
    persistenceMeanBiasPercent: Math.round((Math.exp(sens.persistenceBias.meanLog) - 1) * 100),
    coverageWilson95Percent: sens.coverageWilson95 && sens.coverageWilson95.map((x) => Math.round(x * 100)),
  };
  const evals = result.evaluations.map((e) => ({
    model: e.model,
    selectionErrorPercent: pct(e.selectionError),
    evaluationErrorPercent: pct(e.evaluationError),
    ratioToPersistence: Number(e.ratio.toFixed(2)),
    stepsWonAgainstPersistence: e.wins,
    evaluationSteps: e.evaluationSteps,
  }));

  if (result.state === "forecast") {
    return {
      ...common,
      model: result.model,
      forecastYear: result.year,
      forecastKt: round(result.pointKt),
      lowerKt: round(result.lowerKt),
      upperKt: round(result.upperKt),
      evaluations: evals,
      sensitivity,
    };
  }
  if (result.state === "reference_band") {
    const cov = result.band.coverage;
    return {
      ...common,
      noModelClaimed: true,
      reasons: result.reasons,
      referenceYear: result.band.year,
      persistenceKt: round(result.band.baselineKt),
      referenceLowerKt: round(result.band.lowerKt),
      referenceUpperKt: round(result.band.upperKt),
      intervalLevelPercent: Math.round(result.band.level * 100),
      intervalCoveredForecasts: cov.covered,
      intervalEvaluatedOn: cov.evaluated,
      intervalObservedCoveragePercent: cov.share === null ? null : Math.round(cov.share * 100),
      persistenceErrorPercent: pct(meanAbs(naive.steps)),
      evaluations: evals,
      sensitivity,
    };
  }
  return { ...common, reasons: result.reasons, evaluations: evals, coverage: coverageOf(naive.steps) };
}
