"use client";

import { useEffect, useState } from "react";
import { GATE, type Evaluation, type ForecastResult, type ModelName, type Point } from "@/lib/forecast";

type Payload = {
  recent: { source: string; license: string; retrievedAt: string };
  splice: {
    series: Point[];
    factor: number;
    overlap: Array<{ year: number; oldKt: number; newKt: number; ratio: number }>;
  };
  result: ForecastResult;
};

const MODEL_LABELS: Record<ModelName, string> = {
  naive: "Persistance (dernière valeur)",
  drift: "Tendance moyenne",
  linear: "Droite de tendance (tout l'historique)",
  win10: "Droite sur les 10 dernières années",
  loglinear: "Croissance exponentielle",
};

const kt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
// Erreur logarithmique convertie en pourcentage approximatif.
const bias = (log: number) => `${Math.round((Math.exp(log) - 1) * 100)} %`;
const pct = (log: number) => `${Math.round((Math.exp(log) - 1) * 100)} %`;
const share = (x: number) => `${Math.round(x * 100)} %`;

const W = 640;
const H = 250;
const PAD = { l: 54, r: 44, t: 16, b: 30 };

function Chart({ series, result, spliceYear }: { series: Point[]; result: ForecastResult; spliceYear: number }) {
  const band = result.state === "insufficient_data" ? null : result.state === "forecast" ? result.band : result.band;
  const forecast = result.state === "forecast" ? result : null;
  const last = series[series.length - 1];
  const xMin = series[0].year;
  const xMax = band ? band.year : last.year;
  const yTop = Math.max(...series.map((p) => p.value), band?.upperKt ?? 0, forecast?.upperKt ?? 0) * 1.08;
  const x = (year: number) => PAD.l + ((year - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const y = (v: number) => H - PAD.b - (v / yTop) * (H - PAD.t - PAD.b);
  const ticks = [0, Math.round(yTop / 2 / 500) * 500, Math.round(yTop / 500) * 500];

  return (
    <svg
      className="fc-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Importations nettes de riz du Sénégal de ${xMin} à ${last.year}${band ? `, avec une fourchette de référence pour ${band.year}` : ""}`}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="fc-grid" />
          <text x={PAD.l - 8} y={y(t) + 4} className="fc-axis" textAnchor="end">
            {kt.format(t)}
          </text>
        </g>
      ))}
      {[xMin, 1980, 2000, last.year].filter((v, i, a) => a.indexOf(v) === i).map((yr) => (
        <text key={yr} x={x(yr)} y={H - 8} className="fc-axis" textAnchor="middle">
          {yr}
        </text>
      ))}
      <line x1={x(spliceYear)} x2={x(spliceYear)} y1={PAD.t} y2={H - PAD.b} className="fc-splice" />
      <text x={x(spliceYear) - 4} y={PAD.t + 10} className="fc-axis" textAnchor="end">
        changement de série
      </text>
      <polyline className="fc-line" fill="none" points={series.map((p) => `${x(p.year)},${y(p.value)}`).join(" ")} />
      {band && (
        <g>
          <line x1={x(band.year)} x2={x(band.year)} y1={y(band.upperKt)} y2={y(band.lowerKt)} className="fc-interval" />
          <circle cx={x(band.year)} cy={y(band.baselineKt)} r={4} className="fc-forecast-dot" />
        </g>
      )}
    </svg>
  );
}

function EvaluationTable({
  evaluations,
  selected,
  year,
  lastKt,
}: {
  evaluations: Evaluation[];
  selected: ModelName | null;
  year: number;
  lastKt: number;
}) {
  return (
    <table className="fc-table">
      <caption>
        Choix sur la première moitié des tests, évaluation sur la seconde ({evaluations[0]?.evaluationSteps} prévisions)
      </caption>
      <thead>
        <tr>
          <th scope="col">Modèle</th>
          <th scope="col">Erreur (choix)</th>
          <th scope="col">Erreur (éval.)</th>
          <th scope="col">Pas gagnés</th>
          <th scope="col">Valeur pour {year} (info., non retenue)</th>
        </tr>
      </thead>
      <tbody>
        {evaluations.map((e) => (
          <tr key={e.model} data-best={selected === e.model}>
            <th scope="row">{MODEL_LABELS[e.model]}</th>
            <td>{pct(e.selectionError)}</td>
            <td>{pct(e.evaluationError)}</td>
            <td>
              {e.wins}/{e.evaluationSteps}
            </td>
            <td>{kt.format(e.nextKt)} kt</td>
          </tr>
        ))}
        <tr>
          <th scope="row">{MODEL_LABELS.naive}</th>
          <td>—</td>
          <td>{evaluations[0] ? pct(evaluations[0].naiveEvaluationError) : "—"}</td>
          <td>référence</td>
          <td>{kt.format(lastKt)} kt</td>
        </tr>
      </tbody>
    </table>
  );
}

export function ForecastPanel() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/api/forecast")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((p: Payload) => live && setPayload(p))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
  }, []);

  if (error) {
    return (
      <section className="source-panel" aria-labelledby="fc-title">
        <h2 id="fc-title">Données officielles et prévision</h2>
        <p className="source-error" role="alert">
          Données indisponibles.
        </p>
      </section>
    );
  }
  if (!payload) return null;

  const { splice, result } = payload;
  const series = splice.series;
  const last = series[series.length - 1];
  const spliceYear = Math.min(...splice.overlap.map((o) => o.year));
  const naive = result.reports.find((r) => r.model === "naive")!;
  const selected = result.state === "reference_band" ? result.selected : result.state === "forecast" ? result.evaluation : null;
  const band = result.state === "insufficient_data" ? null : result.band;

  return (
    <section className="source-panel forecast-panel" aria-labelledby="fc-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Données officielles · FAOSTAT · {series[0].year} à {last.year}</p>
          <h2 id="fc-title">Importations nettes de riz du Sénégal</h2>
        </div>
        <span className="unit-tag">kt · unité FAO à confirmer (paddy probable)</span>
      </div>

      <div className="fc-grid-layout">
        <figure className="fc-figure">
          <Chart series={series} result={result} spliceYear={spliceYear} />
          <figcaption>
            Importations moins exportations, {series.length} années civiles. Avant {spliceYear}, l&apos;ancienne série
            (riz usiné) est multipliée par {splice.factor.toFixed(3)}, facteur mesuré sur les {splice.overlap.length} années
            communes ({splice.overlap.map((o) => o.year).join(", ")}) où le rapport varie de{" "}
            {Math.min(...splice.overlap.map((o) => o.ratio)).toFixed(3)} à{" "}
            {Math.max(...splice.overlap.map((o) => o.ratio)).toFixed(3)}.
          </figcaption>
        </figure>

        <div className="fc-side">
          {result.state === "forecast" ? (
            <div className="fc-result">
              <span className="badge badge-warn">Prévision publiée</span>
              <p className="fc-number">
                {kt.format(result.pointKt)} <span>kt en {result.year}</span>
              </p>
              <p className="fc-interval-text">
                Fourchette à {share(GATE.intervalLevel)} : {kt.format(result.lowerKt)} à {kt.format(result.upperKt)} kt.
                Modèle : {MODEL_LABELS[result.model]}.
              </p>
            </div>
          ) : result.state === "reference_band" ? (
            <div className="fc-result">
              <span className="badge badge-warn">Aucun modèle démontré · fourchette de référence</span>
              <p className="fc-number">
                {kt.format(result.band.lowerKt)}–{kt.format(result.band.upperKt)} <span>kt en {result.band.year}</span>
              </p>
              <p className="fc-interval-text">
                Fourchette autour de la dernière valeur observée ({kt.format(result.band.baselineKt)} kt en{" "}
                {result.band.baselineYear}), niveau annoncé {share(result.band.level)}. Elle a couvert{" "}
                {result.band.coverage.covered} des {result.band.coverage.evaluated} dernières années testées (
                {share(result.band.coverage.share ?? 0)}, intervalle à 95 % de {result.sensitivity.coverageWilson95 ? `${share(result.sensitivity.coverageWilson95[0])} à ${share(result.sensitivity.coverageWilson95[1])}` : "non évalué"}) : compatible avec le niveau annoncé, sans plus. Ce n&apos;est pas une prévision.
              </p>
            </div>
          ) : (
            <div className="fc-result fc-refused">
              <span className="badge badge-warn">Prévision refusée</span>
            </div>
          )}

          {result.state !== "forecast" && (
            <ul className="fc-refused">
              {result.reasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}

          {result.evaluations.length > 0 && <EvaluationTable evaluations={result.evaluations} selected={selected?.model ?? null} year={last.year + 1} lastKt={last.value} />}
        </div>
      </div>

      <div className="fc-notes">
        {result.state === "reference_band" && (
          <>
            <p>
              <strong>Ce que dit le test.</strong> Sur {naive.steps.length} prévisions à un an, le modèle choisi par la règle (
              {MODEL_LABELS[result.selected.model].toLowerCase()}) ne bat pas nettement la persistance. <strong>Ce résultat
              dépend de la règle de sélection.</strong> Règle fixée à l&apos;avance (choix sur la première moitié, évaluation
              sur la seconde) : erreur {result.selected.ratio.toFixed(2)} fois celle de la persistance, {result.selected.wins}{" "}
              pas gagnés sur {result.selected.evaluationSteps}.
              {result.sensitivity.rolling &&
                ` Choix glissant sur la performance passée : ${result.sensitivity.rolling.ratio.toFixed(2)} fois, ${result.sensitivity.rolling.wins} pas gagnés sur ${result.sensitivity.rolling.steps}.`}{" "}
              Aucune des deux règles ne montre de gain.
            </p>
            {result.sensitivity.notSelectedButBetter.length > 0 && (
              <p>
                <strong>Un autre modèle fait mieux, sans qu&apos;on puisse le retenir.</strong>{" "}
                {result.sensitivity.notSelectedButBetter
                  .map((e) => `${MODEL_LABELS[e.model]} : ${e.ratio.toFixed(2)} fois l'erreur de la persistance sur la seconde moitié, ${e.wins} pas gagnés sur ${e.evaluationSteps}`)
                  .join(" ; ")}
                . Aucune règle fondée sur le passé ne le choisit (il était moins bon au début de la série) : le retenir
                maintenant reviendrait à le choisir sur les données qui servent à l&apos;évaluer. Une tendance de croissance
                pourrait donc apporter un gain modeste, mais il n&apos;est pas démontré.
              </p>
            )}
            <p>
              Les erreurs sont mesurées en relatif, car la série a été multipliée par environ {Math.round(last.value / series[0].value)} entre{" "}
              {series[0].year} et {last.year}. La persistance sous-estime plutôt : {Math.round(result.sensitivity.persistenceBias.positiveShare * 100)} % de ses erreurs
              sont positives (biais moyen {bias(result.sensitivity.persistenceBias.meanLog)}) ; la fourchette, symétrique en relatif,
              ne corrige pas cette tendance haussière.
            </p>
            <p>
              <strong>Prévision retirée.</strong> Une première analyse sur 14 années (2010-2023) avait publié 2 005 kt pour 2024, entre 1 353 et 2 657 kt. Elle est
              retirée : sur la série longue, ce résultat ne tient pas.
            </p>
          </>
        )}
        <p>
          <strong>Pourquoi pas un « écart » ?</strong> Sur ces données observées, le bilan FAO s&apos;équilibre par
          construction (offre = production + importations − exportations − variation de stocks, vérifié sur 2010-2023 à 1
          kt près) : l&apos;écart calculé vaut zéro. Ce qui peut être suivi, c&apos;est la quantité importée.
        </p>
        <p>
          <strong>Unité.</strong> Les deux séries FAO ne sont pas dans la même unité : le rapport entre elles est constant
          ({splice.factor.toFixed(2)}), comme le facteur usuel entre riz paddy et riz usiné. La série récente est donc
          très probablement en équivalent paddy ; cela n&apos;a pas été confirmé dans la documentation FAO. Années civiles,
          pas campagnes commerciales. Ni prévision officielle ni recommandation d&apos;importation.
        </p>
        <p className="map-credit">
          FAO. 2025. FAOSTAT: Food Balances (2010-). Accessed on 3 November 2026. https://www.fao.org/faostat/en/#data/FBS
          Licence: CC-BY-4.0. FAO. 2024. FAOSTAT: Food Balances (to 2013, old methodology). Accessed on 3 November 2026.
          Licence: CC-BY-4.0. Données sélectionnées, converties et analysées par KAIROS ; la FAO n&apos;a ni cautionné ni
          approuvé cet usage.
        </p>
      </div>
    </section>
  );
}
