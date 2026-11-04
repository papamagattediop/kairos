"use client";

import { useMemo, useState } from "react";
import { SamSegments } from "@/components/sam-segments";
import {
  CAMPAIGN_YEARS,
  EXCLUDED_YEARS,
  RICE,
  departmentStatus,
  estimateYield,
  rankDepartments,
  validRecords,
  type Department,
} from "@/lib/rice-yield";

const fmt = (n: number) => n.toLocaleString("fr-FR");

// Échelle séquentielle : plus le rendement moyen est élevé, plus l'ocre est clair et saturé.
function shade(value: number, lo: number, hi: number) {
  const t = hi === lo ? 0.5 : (value - lo) / (hi - lo);
  return `hsl(38 ${Math.round(35 + 55 * t)}% ${Math.round(22 + 40 * t)}%)`;
}

function YearBars({ dep }: { dep: Department }) {
  const max = Math.max(...dep.records.map((r) => r.yieldKgHa), 1);
  const years = [...CAMPAIGN_YEARS, ...EXCLUDED_YEARS].sort();
  return (
    <svg className="year-bars" viewBox={`0 0 ${years.length * 22} 64`} role="img" aria-label={`Rendement par campagne, ${dep.name}`}>
      {years.map((y, i) => {
        const r = dep.records.find((x) => x.year === y);
        const excluded = EXCLUDED_YEARS.includes(y);
        const h = r ? Math.max(2, (r.yieldKgHa / max) * 44) : 0;
        return (
          <g key={y} transform={`translate(${i * 22} 0)`}>
            {r && <rect x={2} y={50 - h} width={16} height={h} data-excluded={excluded} />}
            <text x={10} y={62} textAnchor="middle">{String(y).slice(2)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function DepartmentMap() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const ranking = useMemo(() => rankDepartments(), []);
  const lo = ranking[ranking.length - 1].meanYieldKgHa;
  const hi = ranking[0].meanYieldKgHa;
  const meanByKey = useMemo(() => new Map(ranking.map((r) => [r.department, r.meanYieldKgHa])), [ranking]);
  const selected = RICE.departments.find((d) => d.id === selectedId) ?? null;
  const status = selected ? departmentStatus(selected) : null;
  const estimate = selected ? estimateYield(selected) : null;

  return (
    <section className="map-section" aria-labelledby="map-title">
      <div className="map-panel">
        <svg viewBox={`0 0 ${RICE.width} ${RICE.height}`} role="group" aria-label={`Carte des ${RICE.departments.length} départements du Sénégal, rendement moyen du riz`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="7" height="7" fill="var(--surface-raised)" />
              <line x1="0" y1="0" x2="0" y2="7" stroke="var(--line-strong)" strokeWidth="1.4" />
            </pattern>
          </defs>
          {RICE.departments.map((dep) => {
            const s = departmentStatus(dep);
            const value = meanByKey.get(dep.name);
            return (
              <path
                key={dep.id}
                d={dep.d}
                className="region"
                data-state={s.state}
                data-selected={dep.id === selectedId}
                style={s.state === "available" && value ? { fill: shade(value, lo, hi) } : undefined}
                tabIndex={0}
                role="button"
                aria-pressed={dep.id === selectedId}
                aria-label={`${dep.name} : ${s.state === "available" && value ? `rendement moyen ${fmt(value)} kilogrammes par hectare` : "données insuffisantes"}`}
                onClick={() => setSelectedId(dep.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedId(dep.id);
                  }
                }}
              />
            );
          })}
        </svg>
      </div>

      <aside className="map-side">
        <div>
          <p className="eyebrow">Riz · carte par département</p>
          <h2 id="map-title">Où le rendement du riz peut-il être estimé ?</h2>
        </div>

        <p className="map-lede">
          <strong>{ranking.length} départements sur {RICE.departments.length}</strong> ont assez d&apos;années de riz dans l&apos;Enquête Agricole Annuelle pour une estimation ; les autres restent en <strong>données insuffisantes</strong>. L&apos;estimation est la moyenne du département avec une bande d&apos;erreurs observées, pas une prévision par modèle.
        </p>

        <div className="map-readout" aria-live="polite">
          {selected && status ? (
            status.state === "available" && estimate ? (
              <>
                <strong>{selected.name}</strong>
                <span>
                  {status.group} · {status.validYears} campagnes · estimation de référence (moyenne géométrique){" "}
                  <b>{fmt(estimate.meanYieldKgHa)} kg/ha</b>, bande de {fmt(estimate.bandLowKgHa)} à {fmt(estimate.bandHighKgHa)} kg/ha : elle contient {estimate.bandLevelPct} % des écarts observés dans le groupe « {estimate.group} » ({estimate.bandErrorsCount} écarts), pas une garantie pour ce département. Erreur moyenne du groupe : {String(estimate.meanRelativeErrorPct).replace(".", ",")} %.
                </span>
                <YearBars dep={selected} />
                <span className="bars-note">
                  Barres : rendement par campagne (années {CAMPAIGN_YEARS[0]} à {CAMPAIGN_YEARS[CAMPAIGN_YEARS.length - 1]}). L&apos;année {EXCLUDED_YEARS[0]} est écartée (barre hachurée) : surfaces irriguées effondrées dans la source. Seules {validRecords(selected).length} campagnes servent au calcul.
                </span>
              </>
            ) : (
              <>
                <strong>{selected.name}</strong>
                <span>{status.state === "insufficient_data" ? status.reason : ""}</span>
              </>
            )
          ) : (
            <span>Sélectionnez un département pour voir son estimation.</span>
          )}
        </div>

        <div className="map-legend-block">
          <p className="map-legend">
            <span className="legend-ramp" style={{ background: `linear-gradient(90deg, ${shade(lo, lo, hi)}, ${shade(hi, lo, hi)})` }} aria-hidden="true" />
            Rendement moyen : {fmt(lo)} à {fmt(hi)} kg/ha
          </p>
          <p className="map-legend">
            <span className="legend-swatch" aria-hidden="true" />
            Données insuffisantes
          </p>
        </div>

        <SamSegments />
        <p className="map-credit">Frontières : {RICE.mapSource}. Rendements : {RICE.yieldSource}.</p>
      </aside>
    </section>
  );
}
