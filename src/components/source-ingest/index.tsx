"use client";

import { useState } from "react";
import type { BalanceInputs, BalanceResult } from "@/lib/decision-engine";

type IngestResponse = {
  origin: string;
  inputs: BalanceInputs;
  rejected: Array<{ field: string; reason: string }>;
  campaigns: string[];
  balance: BalanceResult;
};

const LABELS: Record<keyof BalanceInputs, string> = {
  demandKt: "Utilisation intérieure",
  productionKt: "Production",
  importsKt: "Importations nettes",
  stockReleaseKt: "Contribution nette des stocks",
};

const FICTIONAL_SAMPLE =
  "Rice, Senegal MY2025/26 (fictional sample for interface testing): domestic consumption 2,000 (1000 MT); production 1,250 (1000 MT); imports 600 (1000 MT). Stock data not published.";

const kt = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

export function SourceIngest() {
  const [source, setSource] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestResponse | null>(null);

  async function extract() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResult(null);
        setError(data.error ?? "Extraction impossible.");
      } else {
        setResult(data);
      }
    } catch {
      setResult(null);
      setError("Service injoignable.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="source-panel" aria-labelledby="source-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Muse Spark lit, le code vérifie</p>
          <h2 id="source-title">Extraire le bilan d&apos;une source</h2>
        </div>
        <span className="unit-tag">Meta Model API</span>
      </div>

      <p className="source-help">
        Collez un extrait de bilan. Spark propose les termes avec leur citation ;
        le code ne retient un nombre que s&apos;il figure mot pour mot dans la source.
        Un terme absent reste vide et bloque le calcul.
      </p>

      <textarea
        className="source-input"
        value={source}
        onChange={(event) => setSource(event.target.value)}
        placeholder="Collez ici un extrait USDA, FAOSTAT ou ANSD…"
        rows={5}
        maxLength={20000}
        aria-label="Texte source du bilan"
      />

      <div className="panel-actions">
        <button
          className="button button-primary"
          data-pending={pending}
          aria-busy={pending}
          onClick={extract}
          disabled={pending || source.trim() === ""}
        >
          {pending ? "Extraction en cours…" : "Extraire avec Muse Spark"}
        </button>
        <button
          className="button button-secondary"
          onClick={() => setSource(FICTIONAL_SAMPLE)}
          disabled={pending}
        >
          Charger un extrait fictif
        </button>
      </div>

      {error && (
        <p className="source-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="source-result" aria-live="polite">
          <p className="source-origin">
            Origine : texte fourni, pas une statistique officielle vérifiée.
          </p>
          <ul className="term-list">
            {(Object.keys(LABELS) as Array<keyof BalanceInputs>).map((field) => (
              <li key={field}>
                <span>{LABELS[field]}</span>
                <strong>
                  {result.inputs[field] === null
                    ? "non extrait"
                    : `${kt.format(result.inputs[field] as number)} kt`}
                </strong>
              </li>
            ))}
          </ul>

          {result.rejected.length > 0 && (
            <div className="refusal-box">
              <div>
                <strong>Termes refusés par le contrôle</strong>
                <ul>
                  {result.rejected.map((r) => (
                    <li key={r.field}>
                      {LABELS[r.field as keyof BalanceInputs] ?? r.field} : {r.reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {result.campaigns.length > 1 && (
            <p className="source-error">
              Plusieurs campagnes citées ({result.campaigns.join(", ")}) : vérifiez
              que les termes concernent la même période.
            </p>
          )}

          {result.balance.state === "scenario" ? (
            <p className="source-gap">
              Écart de disponibilité : <strong>{kt.format(result.balance.gapKt)} kt</strong>
            </p>
          ) : (
            <p className="source-gap">
              Calcul refusé. Manquant : {result.balance.missingInputs.join(", ")}.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
