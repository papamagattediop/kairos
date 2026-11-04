"use client";

import { useState } from "react";
import valley from "../../../public/sam/valley.json";
import seg from "../../../public/sam/valley-segments.json";

type Row = {
  concept: string;
  areaHa: number;
  instances: Array<{ box: number[]; confidence: number | null }>;
  landCoverShares?: Record<string, number>;
  overlay?: string;
};

const fmt = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
const pct = (x: number) => `${Math.round(x * 100)} %`;

export function SamSegments() {
  const rows = seg.results as Row[];
  const matched = rows.filter((r) => r.areaHa > 0 && r.overlay);
  const [shown, setShown] = useState<Set<string>>(new Set(matched.slice(0, 1).map((r) => r.concept)));
  const proposed = seg.rounds.reduce((n, r) => n + r.proposed.length, 0);

  const toggle = (concept: string) =>
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(concept)) next.delete(concept);
      else next.add(concept);
      return next;
    });

  return (
    <figure className="sam-figure">
      <div className="sam-frame">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={valley.image} alt="Image Sentinel-2 de la vallée du fleuve avec les masques segmentés par SAM 3.1" width={valley.width} height={valley.height} loading="lazy" />
        {matched.map(
          (r) =>
            shown.has(r.concept) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={r.concept} className="sam-mask" src={r.overlay} alt="" aria-hidden="true" />
            ),
        )}
      </div>

      <figcaption>
        <strong>Muse Spark propose · SAM 3.1 segmente · le code mesure</strong>
        <span>
          Spark a regardé l&apos;image et proposé {proposed} concepts en {seg.rounds.length} tours (il reçoit la liste des concepts sans résultat pour en
          reformuler). SAM en a reconnu <b>{matched.length}</b>. Surfaces et recoupements sont calculés par le code.
        </span>

        <ul className="sam-list">
          {matched.map((r) => {
            const top = Object.entries(r.landCoverShares ?? {})[0];
            return (
              <li key={r.concept}>
                <label>
                  <input type="checkbox" checked={shown.has(r.concept)} onChange={() => toggle(r.concept)} />
                  <b>« {r.concept} »</b> · {fmt(r.areaHa)} ha
                </label>
                {top && (
                  <span>
                    {pct(top[1])} du masque tombe sur la classe « {top[0]} » d&apos;ESA WorldCover 2021
                  </span>
                )}
              </li>
            );
          })}
        </ul>

        <span>
          Sans résultat : {rows.filter((r) => !r.areaHa).map((r) => `« ${r.concept} »`).join(", ")}. SAM est très sensible au libellé : seuls des
          noms de cours d&apos;eau ont répondu. Aucun masque de parcelle de riz n&apos;a été obtenu, donc aucun chiffre du rendement ou de la production n&apos;en
          dépend.
        </span>
        <span className="map-credit">{seg.attribution} Recoupement avec la couche d&apos;occupation du sol, pas validation sur le terrain.</span>
      </figcaption>
    </figure>
  );
}
