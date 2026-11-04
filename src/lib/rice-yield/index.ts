import generated from "./rice-yield.generated.json";

export type YearRecord = { year: number; areaHa: number; productionT: number; yieldKgHa: number; rainMm: number | null };
export type Department = { id: string; key: string; name: string; d: string; records: YearRecord[] };

export const RICE = generated as {
  width: number;
  height: number;
  mapSource: string;
  yieldSource: string;
  rainSource: string;
  departments: Department[];
};

// Règles fixées avant les tests (data/results/README.md) : 2021 est écartée parce que la source y fait
// s'effondrer les surfaces irriguées (Dagana : 775 ha au lieu d'environ 50 000).
export const EXCLUDED_YEARS: readonly number[] = [2021];
export const CAMPAIGN_YEARS = [2017, 2018, 2019, 2020, 2022, 2023, 2024, 2025] as const;
export const MIN_VALID_YEARS = 7;
export const MIN_MEAN_AREA_HA = 1000;
export const BAND_LEVEL = 0.8;
// Départements du nord où le riz est surtout irrigué (SAED) : la pluie locale n'y explique pas le rendement.
const IRRIGATED_NORTH = new Set(["Dagana", "Podor", "Matam", "Saint Louis", "Kanel", "Bakel"]);

export const validRecords = (dep: Department) => dep.records.filter((r) => !EXCLUDED_YEARS.includes(r.year));

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export type DepartmentStatus =
  | { state: "available"; group: "nord irrigué" | "sud pluvial"; validYears: number; meanAreaHa: number }
  | { state: "insufficient_data"; reason: string };

export function departmentStatus(dep: Department): DepartmentStatus {
  const valid = validRecords(dep);
  if (valid.length < MIN_VALID_YEARS) {
    return { state: "insufficient_data", reason: `Seulement ${valid.length} année(s) valide(s) de riz dans la source (minimum ${MIN_VALID_YEARS}).` };
  }
  const meanAreaHa = mean(valid.map((r) => r.areaHa));
  if (meanAreaHa < MIN_MEAN_AREA_HA) {
    return { state: "insufficient_data", reason: `Surface de riz moyenne de ${Math.round(meanAreaHa)} ha, sous le minimum de ${MIN_MEAN_AREA_HA} ha : rendement trop bruité.` };
  }
  return { state: "available", group: IRRIGATED_NORTH.has(dep.key) ? "nord irrigué" : "sud pluvial", validYears: valid.length, meanAreaHa: Math.round(meanAreaHa) };
}

const geoMeanYield = (recs: YearRecord[]) => Math.exp(mean(recs.map((r) => Math.log(r.yieldKgHa))));

// Erreurs absolues (en log) d'une année retirée, prédite par la moyenne géométrique des autres années du département.
function leaveOneYearOutErrors(dep: Department): number[] {
  const valid = validRecords(dep);
  return valid.map((held, i) => {
    const others = valid.filter((_, j) => j !== i);
    return Math.abs(Math.log(held.yieldKgHa) - mean(others.map((r) => Math.log(r.yieldKgHa))));
  });
}

const available = () => RICE.departments.filter((d) => departmentStatus(d).state === "available");

function groupErrors(group: string): number[] {
  return available()
    .filter((d) => (departmentStatus(d) as { group: string }).group === group)
    .flatMap(leaveOneYearOutErrors);
}

// Quantile empirique « rang le plus proche vers le haut ».
const quantile = (xs: number[], q: number) => [...xs].sort((a, b) => a - b)[Math.ceil(q * xs.length) - 1];

export type YieldEstimate = {
  meanYieldKgHa: number;
  bandLowKgHa: number;
  bandHighKgHa: number;
  bandLevelPct: number;
  bandErrorsCount: number;
  meanRelativeErrorPct: number;
  validYears: number;
  group: string;
  method: string;
};

// Estimation de référence = moyenne du département sur ses années valides. La bande vient des erreurs réelles
// obtenues en prédisant chaque année retirée dans le même groupe (nord irrigué ou sud pluvial).
export function estimateYield(dep: Department): YieldEstimate | null {
  const status = departmentStatus(dep);
  if (status.state !== "available") return null;
  const errors = groupErrors(status.group);
  if (errors.length === 0) return null;
  const q = quantile(errors, BAND_LEVEL);
  const centre = geoMeanYield(validRecords(dep));
  return {
    meanYieldKgHa: Math.round(centre),
    bandLowKgHa: Math.round(centre * Math.exp(-q)),
    bandHighKgHa: Math.round(centre * Math.exp(q)),
    bandLevelPct: BAND_LEVEL * 100,
    bandErrorsCount: errors.length,
    meanRelativeErrorPct: Math.round(100 * (Math.exp(mean(errors)) - 1) * 10) / 10,
    validYears: status.validYears,
    group: status.group,
    method:
      "Estimation = moyenne géométrique du département sur ses années valides. La bande contient 80 % des écarts observés en prédisant chaque année retirée, tous départements du groupe confondus : ce n'est pas une garantie pour ce département (couverture variable d'un département à l'autre). La pluie CHIRPS : gain d'environ 3 % au sud, fragile (un test parmi plusieurs, 8 campagnes), dégradation au nord. Le NDVI MODIS a été testé sur un sous-échantillon non représentatif (pixels valides rares en saison des pluies, dernière campagne absente) : non concluant.",
  };
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[-’']/g, " ").replace(/\s+/g, " ").trim();

export function findDepartment(query: string): Department | null {
  const q = norm(query);
  return RICE.departments.find((d) => norm(d.key) === q || norm(d.name) === q) ?? null;
}

export function rankDepartments() {
  return available()
    .map((d) => ({ department: d.name, group: (departmentStatus(d) as { group: string }).group, meanYieldKgHa: Math.round(geoMeanYield(validRecords(d))), validYears: validRecords(d).length }))
    .sort((a, b) => b.meanYieldKgHa - a.meanYieldKgHa);
}

// Résumé complet d'un département pour l'agent et la carte : tout nombre vient de ce calcul.
export function riceSummary(dep: Department) {
  const status = departmentStatus(dep);
  return {
    department: dep.name,
    status,
    excludedReason: "Une campagne est écartée pour tous les départements : les surfaces irriguées s'y effondrent dans la source.",
    // Historique seulement si le département est estimable ; la campagne écartée n'y figure pas.
    history: status.state === "available" ? validRecords(dep) : [],
    estimate: estimateYield(dep),
    source: RICE.yieldSource,
  };
}
