import vegetation from "../../../data/satellite/valley-vegetation.json";

type Row = {
  date: string;
  croplandValidShare: number;
  croplandNdviMean: number | null;
  croplandNdviP10: number | null;
  croplandNdviP90: number | null;
  croplandGreenShare: number | null;
};

// Une date n'est tracée que si la quasi-totalité des pixels « cultures » est exploitable.
const MIN_VALID_SHARE = 0.9;
const rows = (vegetation.rows as Row[]).filter(
  (r) => r.croplandNdviMean !== null && r.croplandNdviP10 !== null && r.croplandNdviP90 !== null && r.croplandValidShare >= MIN_VALID_SHARE,
);

const W = 640;
const H = 230;
const PAD = { l: 44, r: 16, t: 14, b: 28 };
const t0 = Date.parse("2026-01-01");
const t1 = Date.parse("2026-11-01");
const x = (date: string) => PAD.l + ((Date.parse(date) - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);
const yMin = -0.1;
const yMax = 0.9;
const y = (v: number) => H - PAD.b - ((v - yMin) / (yMax - yMin)) * (H - PAD.t - PAD.b);

const MAX_GAP_DAYS = 12;
const segments = rows.reduce<Row[][]>((acc, r) => {
  const last = acc[acc.length - 1];
  const gap = last ? (Date.parse(r.date) - Date.parse(last[last.length - 1].date)) / 86_400_000 : 0;
  if (last && gap <= MAX_GAP_DAYS) last.push(r);
  else acc.push([r]);
  return acc;
}, []);

const mean = (r: Row) => r.croplandNdviMean as number;
const lowest = rows.reduce((a, b) => (mean(b) < mean(a) ? b : a));
const highest = rows.reduce((a, b) => (mean(b) > mean(a) ? b : a));
const months = [
  ["2026-01-01", "janv."],
  ["2026-04-01", "avr."],
  ["2026-07-01", "juil."],
  ["2026-10-01", "oct."],
] as const;

function band(seg: Row[]) {
  const top = seg.map((r) => `${x(r.date)},${y(r.croplandNdviP90 as number)}`);
  const bottom = [...seg].reverse().map((r) => `${x(r.date)},${y(r.croplandNdviP10 as number)}`);
  return [...top, ...bottom].join(" ");
}

export function VegetationPanel() {
  const lc = vegetation.landCover;
  const totalPixels = Object.values(lc.classPixelCounts as Record<string, number>).reduce((a, b) => a + b, 0);
  return (
    <section className="source-panel" aria-labelledby="veg-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Données Copernicus · Sentinel-2 et ESA WorldCover</p>
          <h2 id="veg-title">Indice de végétation des surfaces classées « cultures »</h2>
        </div>
        <span className="unit-tag">NDVI · {lc.croplandKm2} km²</span>
      </div>

      <div className="fc-grid-layout">
        <figure className="fc-figure">
          <svg
            className="fc-chart"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Indice de végétation moyen des surfaces classées cultures sur ${rows.length} dates de 2026`}
          >
            {[0, 0.4, 0.8].map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="fc-grid" />
                <text x={PAD.l - 8} y={y(t) + 4} className="fc-axis" textAnchor="end">
                  {t}
                </text>
              </g>
            ))}
            {months.map(([d, label]) => (
              <text key={d} x={x(d)} y={H - 8} className="fc-axis" textAnchor="middle">
                {label}
              </text>
            ))}
            {segments.map((seg) => (
              <g key={seg[0].date}>
                {seg.length > 1 && <polygon className="veg-band" points={band(seg)} />}
                <polyline
                  className="fc-line"
                  fill="none"
                  points={seg.map((r) => `${x(r.date)},${y(mean(r))}`).join(" ")}
                />
              </g>
            ))}
            {rows.map((r) => (
              <circle key={r.date} cx={x(r.date)} cy={y(mean(r))} r={2.5} className="fc-dot" />
            ))}
          </svg>
          <figcaption>
            Ligne : NDVI moyen. Zone teintée : du 10<sup>e</sup> au 90<sup>e</sup> centile des pixels. {rows.length} dates
            tracées (pixels « cultures » exploitables à {Math.round(MIN_VALID_SHARE * 100)} % ou plus ; nuages, ombres et eau
            exclus). Les lignes ne relient que des dates voisines.
          </figcaption>
        </figure>

        <div className="fc-side">
          <p className="map-lede">
            Le NDVI moyen des surfaces classées « cultures » va de <strong>{mean(lowest).toFixed(2)}</strong> (
            {lowest.date}) à <strong>{mean(highest).toFixed(2)}</strong> ({highest.date}). C&apos;est un indice de verdure,
            pas une mesure de production.
          </p>
          <ul className="fc-caveats">
            <li>
              La carte d&apos;occupation du sol date de 2021 : elle ne dit pas ce qui est cultivé en 2026, ni quelle culture.
              Dans cette zone, {Math.round(lc.croplandShareOfZone * 100)} % des pixels sont classés « cultures » et environ{" "}
              {Math.round(((lc.classPixelCounts as Record<string, number>)["90"] / totalPixels) * 100)} % « zones humides » : les
              rizières peuvent relever de l&apos;une ou de l&apos;autre, ce qui n&apos;a pas été vérifié.
            </li>
            <li>
              Le seuil de « couvert vert » (NDVI &gt; {vegetation.method.greenThreshold}) est indicatif et non étalonné ; il n&apos;est
              pas utilisé ici.
            </li>
            <li>
              Les {rows.length} dates sont celles où la zone était peu nuageuse : l&apos;échantillonnage est irrégulier (par
              exemple aucune date entre le 6 avril et le 3 mai), et la fourchette annoncée ne vaut que pour ces dates. Le
              motif saisonnier n&apos;est pas un calendrier cultural.
            </li>
            <li>Aucune validation sur le terrain. Aucun chiffre du bilan ni de la prévision n&apos;en dépend.</li>
          </ul>
          <p className="map-credit">
            {vegetation.source}. {vegetation.method.ndvi}. Reproduire : node scripts/water-extent.mjs puis node
            scripts/vegetation-index.mjs.
          </p>
        </div>
      </div>
    </section>
  );
}
