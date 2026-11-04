"use client";

import { useMemo, useState } from "react";
import { AgentPanel } from "@/components/agent-panel";
import { ForecastPanel } from "@/components/forecast-panel";
import { DepartmentMap } from "@/components/map";
import { VegetationPanel } from "@/components/vegetation-panel";
import { WaterPanel } from "@/components/water-panel";
import { SourceIngest } from "@/components/source-ingest";
import {
  calculateBalance,
  type BalanceInputs,
} from "@/lib/decision-engine";

type InputField = keyof BalanceInputs;

const FIELD_CONFIG: Array<{
  name: InputField;
  label: string;
  description: string;
  allowNegative?: boolean;
}> = [
  {
    name: "demandKt",
    label: "Utilisation intérieure",
    description: "Consommation et autres utilisations, en milliers de tonnes",
  },
  {
    name: "productionKt",
    label: "Production disponible",
    description: "Production retenue pour la période, en milliers de tonnes",
  },
  {
    name: "importsKt",
    label: "Importations nettes",
    description: "Importations retenues pour la période, en milliers de tonnes",
  },
  {
    name: "stockReleaseKt",
    label: "Contribution nette des stocks",
    description:
      "Libération des stocks; une valeur négative signifie une reconstitution",
    allowNegative: true,
  },
];

const EMPTY_INPUTS: BalanceInputs = {
  demandKt: null,
  productionKt: null,
  importsKt: null,
  stockReleaseKt: null,
};

const DEMO_INPUTS: BalanceInputs = {
  demandKt: 2000,
  productionKt: 1250,
  importsKt: 600,
  stockReleaseKt: 0,
};

function formatKt(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(value);
}

export default function Home() {
  const [inputs, setInputs] = useState<BalanceInputs>(EMPTY_INPUTS);
  const [isDemo, setIsDemo] = useState(false);
  const result = useMemo(() => calculateBalance(inputs), [inputs]);

  function updateInput(field: InputField, raw: string) {
    const value = raw.trim() === "" ? null : Number(raw);
    setInputs((previous) => ({
      ...previous,
      [field]: value !== null && Number.isFinite(value) ? value : null,
    }));
    setIsDemo(false);
  }

  function loadDemo() {
    setInputs(DEMO_INPUTS);
    setIsDemo(true);
  }

  function clearInputs() {
    setInputs(EMPTY_INPUTS);
    setIsDemo(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="KAIROS, accueil">
          <span className="brand-mark" aria-hidden="true">
            K
          </span>
          <span>KAIROS</span>
        </a>
        <div className="topbar-meta">
          <span className="environment-label">LABORATOIRE DE SCÉNARIO</span>
          <span className="topbar-divider" aria-hidden="true" />
          <span>Sénégal / Riz</span>
        </div>
      </header>

      <section className="workspace" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">Bilan de disponibilité</p>
          <h1 id="page-title">Examiner un écart, sans masquer les hypothèses.</h1>
          <p className="intro-copy">
            Entrez les quatre termes du bilan. Le calcul reste local et
            déterministe. Une valeur manquante bloque le résultat.
          </p>
          <p className="intro-copy">
            <strong>Usage visé :</strong> un analyste de sécurité alimentaire ou un service d&apos;enquête agricole qui doit
            savoir quels départements ont assez de données pour estimer le rendement du riz, et où l&apos;enquête doit
            être renforcée. Sur 45 départements, KAIROS en estime 21 et déclare les 24 autres insuffisants.
          </p>
        </div>

        <DepartmentMap />

        <ForecastPanel />

        <WaterPanel />

        <VegetationPanel />

        <div className="mode-banner" role="note">
          <span className="mode-mark" aria-hidden="true">
            i
          </span>
          <p>
            Cette version calcule un <strong>scénario de disponibilité</strong>.
            Elle ne prédit pas une pénurie et ne recommande pas un ordre
            d&apos;importation.
          </p>
        </div>

        <div className="analysis-grid">
          <section className="inputs-panel" aria-labelledby="inputs-title">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Entrées du calcul</p>
                <h2 id="inputs-title">Bilan rizicole</h2>
              </div>
              <span className="unit-tag">kt / période</span>
            </div>

            <div className="field-list">
              {FIELD_CONFIG.map((field) => (
                <div className="field" key={field.name}>
                  <label htmlFor={field.name}>{field.label}</label>
                  <p id={`${field.name}-help`} className="field-description">
                    {field.description}
                  </p>
                  <div className="input-wrap">
                    <input
                      id={field.name}
                      aria-describedby={`${field.name}-help`}
                      type="number"
                      inputMode="decimal"
                      min={field.allowNegative ? undefined : "0"}
                      step="any"
                      value={inputs[field.name] ?? ""}
                      onChange={(event) =>
                        updateInput(field.name, event.target.value)
                      }
                      placeholder="À renseigner"
                    />
                    <span aria-hidden="true">kt</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="formula-block">
              <span className="formula-label">Équation utilisée</span>
              <code>
                Écart = utilisation - production - importations - stocks
              </code>
              <p>
                Les stocks sont une contribution nette : une valeur négative
                représente une reconstitution.
              </p>
            </div>

            <div className="panel-actions">
              <button className="button button-primary" onClick={loadDemo}>
                Charger le scénario fictif
              </button>
              <button className="button button-secondary" onClick={clearInputs}>
                Effacer les valeurs
              </button>
            </div>
          </section>

          <section
            className={`result-panel ${result.state === "scenario" ? "is-ready" : "is-refused"}`}
            aria-labelledby="result-title"
            aria-live="polite"
          >
            <div className="result-topline">
              <span className="eyebrow">Résultat du moteur</span>
              <span
                className={`status-label ${result.state === "scenario" ? "status-scenario" : "status-refused"}`}
              >
                <span className="status-dot" aria-hidden="true" />
                {result.state === "scenario"
                  ? "SCÉNARIO CALCULÉ"
                  : "DONNÉES INSUFFISANTES"}
              </span>
            </div>

            <h2 id="result-title">
              {result.state === "scenario"
                ? "Écart de disponibilité"
                : "Le ticket reste non certifié"}
            </h2>

            {result.state === "scenario" ? (
              <>
                <p className="result-intro">
                  Résultat arithmétique des valeurs saisies. Ce n&apos;est pas
                  une estimation officielle ni une instruction d&apos;achat.
                </p>
                <div className="result-number">
                  <strong>
                    {result.gapKt > 0 ? "+" : ""}
                    {formatKt(result.gapKt)}
                  </strong>
                  <span>kt</span>
                </div>
                <p className="result-interpretation">
                  {result.gapKt > 0
                    ? "Écart positif sous les hypothèses saisies."
                    : result.gapKt < 0
                      ? "Solde négatif sous les hypothèses saisies."
                      : "Les entrées saisies s'équilibrent."}
                </p>
                {isDemo && (
                  <div className="demo-warning" role="note">
                    <strong>Exemple fictif</strong>
                    <span>
                      Valeurs créées pour tester l&apos;interface. Elles ne
                      décrivent pas la situation du Sénégal.
                    </span>
                  </div>
                )}
                <div className="calculation-detail">
                  <span>Recalcul reproductible</span>
                  <code>
                    {formatKt(result.inputs.demandKt)} -{" "}
                    {formatKt(result.inputs.productionKt)} -{" "}
                    {formatKt(result.inputs.importsKt)} -{" "}
                    {formatKt(result.inputs.stockReleaseKt)} ={" "}
                    {formatKt(result.gapKt)} kt
                  </code>
                </div>
              </>
            ) : (
              <>
                <p className="result-intro">
                  Le moteur refuse de produire un résultat tant que les entrées
                  obligatoires ne sont pas complètes.
                </p>
                <div className="refusal-box">
                  <span className="refusal-symbol" aria-hidden="true">
                    !
                  </span>
                  <div>
                    <strong>À renseigner avant le calcul</strong>
                    <ul>
                      {result.missingInputs.map((missing) => (
                        <li key={missing}>{missing}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="refusal-footnote">
                  Aucun champ absent n&apos;est remplacé par zéro. Les données
                  officielles et leur période restent à vérifier.
                </p>
              </>
            )}

            <div className="result-footer">
              <span>Source de données</span>
              <strong>
                {isDemo
                  ? "Données synthétiques de démonstration"
                  : "Aucune source officielle connectée"}
              </strong>
            </div>
          </section>
        </div>

        <div className="tools-grid">
          <SourceIngest />
          <AgentPanel />
        </div>
        <footer className="page-footer">
          <span>KAIROS / Outil de scénario, pas une décision officielle</span>
          <span>Calcul local, aucune clé API requise</span>
        </footer>
      </section>
    </main>
  );
}
