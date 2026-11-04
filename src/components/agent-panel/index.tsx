"use client";

import { useState } from "react";

type AgentResponse = {
  answer: string;
  verified: boolean;
  unverifiedNumbers: string[];
  trace: Array<{ tool: string; args: string; result: unknown }>;
};

const TOOL_LABELS: Record<string, string> = {
  list_products: "Liste des produits",
  compute_balance: "Calcul du bilan (code)",
  extract_terms: "Extraction des termes (vérifiée par le code)",
  get_forecast: "Importations nettes de riz (FAOSTAT, code)",
  get_department_rice: "Rendement du riz d'un département (EAA, code)",
  list_department_rice: "Classement des départements (EAA, code)",
};

const DEPARTMENT_QUESTION =
  "Quel rendement attendre pour le riz à Kolda, comment se compare-t-il à Dagana, et à quel point peut-on se fier à cette estimation ?";

const EXAMPLE =
  "Voici un extrait : Rice, Senegal MY2025/26 (fictional sample): domestic consumption 2,000 (1000 MT); production 1,250 (1000 MT); imports 600 (1000 MT). Stock data not published. Extrais le bilan et dis-moi si l'écart peut être calculé.";

const FAOSTAT_QUESTION =
  "Que montrent les données FAOSTAT sur les importations nettes de riz du Sénégal, et que donne le modèle pour l'année suivante ? Rappelle ses limites.";

export function AgentPanel() {
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentResponse | null>(null);

  async function ask() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await response.json();
      if (!response.ok) {
        setResult(null);
        setError(data.error ?? "L'agent n'a pas répondu.");
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
    <section className="source-panel" aria-labelledby="agent-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Agent à outils</p>
          <h2 id="agent-title">Interroger l&apos;agent KAIROS</h2>
        </div>
        <span className="unit-tag">Muse Spark 1.3</span>
      </div>

      <p className="source-help">
        Spark choisit les outils ; le code calcule. Tout nombre de la réponse doit
        provenir d&apos;un outil ou de votre question, sinon la réponse est signalée comme non vérifiée.
      </p>

      <textarea
        className="source-input"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="Posez une question, ou collez un extrait de bilan avec votre question…"
        rows={4}
        maxLength={2000}
        aria-label="Question pour l'agent"
      />

      <div className="panel-actions">
        <button
          className="button button-primary"
          data-pending={pending}
          aria-busy={pending}
          onClick={ask}
          disabled={pending || question.trim() === ""}
        >
          {pending ? "L'agent travaille…" : "Interroger l'agent"}
        </button>
        <button
          className="button button-secondary"
          onClick={() => setQuestion(EXAMPLE)}
          disabled={pending}
        >
          Charger un exemple fictif
        </button>
        <button
          className="button button-secondary"
          onClick={() => setQuestion(FAOSTAT_QUESTION)}
          disabled={pending}
        >
          Question sur les données FAOSTAT
        </button>
        <button
          className="button button-secondary"
          onClick={() => setQuestion(DEPARTMENT_QUESTION)}
          disabled={pending}
        >
          Rendement du riz par département
        </button>
      </div>

      {error && (
        <p className="source-error" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="source-result" aria-live="polite">
          <p className="agent-answer">{result.answer}</p>
          <p className={result.verified ? "badge badge-ok" : "badge badge-warn"}>
            {result.verified
              ? "Nombres connus : chacun figure dans une sortie d'outil ou dans votre question"
              : `Nombres non vérifiés : ${result.unverifiedNumbers.join(", ") || "réponse incomplète"}`}
          </p>
          <p className="map-credit">
            Réponse rédigée par un modèle, non officielle. Un nombre « connu » n&apos;est pas prouvé exact : vérifiez-le
            dans la trace des outils ci-dessous et dans les panneaux de données.
          </p>
          {result.trace.length > 0 && (
            <ol className="trace-list">
              {result.trace.map((step, i) => (
                <li key={i}>{TOOL_LABELS[step.tool] ?? step.tool}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
