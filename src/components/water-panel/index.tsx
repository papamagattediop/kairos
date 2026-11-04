import extent from "../../../data/satellite/valley-water-extent.json";

type Row = { date: string; ndwiWaterKm2: number; sclWaterKm2: number; usable: boolean; cloudShare: number };

const rows = (extent.rows as Row[]).filter((r) => r.usable);
const discarded = extent.rows.length - rows.length;

const W = 640;
const H = 230;
const PAD = { l: 44, r: 16, t: 14, b: 28 };
const t0 = Date.parse("2026-01-01");
const t1 = Date.parse("2026-11-01");
const yMax = Math.ceil(Math.max(...rows.flatMap((r) => [r.ndwiWaterKm2, r.sclWaterKm2])) / 5) * 5;
const x = (date: string) => PAD.l + ((Date.parse(date) - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);
const y = (v: number) => H - PAD.b - (v / yMax) * (H - PAD.t - PAD.b);
const line = (seg: Row[], pick: (r: Row) => number) => seg.map((r) => `${x(r.date)},${y(pick(r))}`).join(" ");

function correlation(a: number[], b: number[]) {
  const mean = (v: number[]) => v.reduce((s, n) => s + n, 0) / v.length;
  const ma = mean(a);
  const mb = mean(b);
  let num = 0;
  let da = 0;
  let db = 0;
  a.forEach((v, i) => {
    num += (v - ma) * (b[i] - mb);
    da += (v - ma) ** 2;
    db += (b[i] - mb) ** 2;
  });
  return num / Math.sqrt(da * db);
}

const corr = correlation(
  rows.map((r) => r.ndwiWaterKm2),
  rows.map((r) => r.sclWaterKm2),
);
const comparable = rows
  .filter((r) => r.sclWaterKm2 >= 1)
  .map((r) => ({ date: r.date, ratio: r.ndwiWaterKm2 / r.sclWaterKm2 }));
const ratios = comparable.map((c) => c.ratio);
const lowest = comparable.reduce((a, b) => (b.ratio < a.ratio ? b : a));
const median = [...ratios].sort((a, b) => a - b)[Math.floor(ratios.length / 2)];

// Une ligne ne relie que des dates voisines : un trou (dates écartées) reste un trou.
const MAX_GAP_DAYS = 12;
const segments = rows.reduce<Row[][]>((acc, r) => {
  const last = acc[acc.length - 1];
  const gap = last ? (Date.parse(r.date) - Date.parse(last[last.length - 1].date)) / 86_400_000 : 0;
  if (last && gap <= MAX_GAP_DAYS) last.push(r);
  else acc.push([r]);
  return acc;
}, []);
const months = [
  ["2026-01-01", "janv."],
  ["2026-04-01", "avr."],
  ["2026-07-01", "juil."],
  ["2026-10-01", "oct."],
] as const;

export function WaterPanel() {
  return (
    <section className="source-panel" aria-labelledby="water-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Données Copernicus · Sentinel-2</p>
          <h2 id="water-title">Surface en eau, vallée du fleuve Sénégal</h2>
        </div>
        <span className="unit-tag">km² · zone de {extent.zoneAreaKm2} km²</span>
      </div>

      <div className="fc-grid-layout">
        <figure className="fc-figure">
          <svg
            className="fc-chart"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Surface en eau mesurée par deux méthodes sur ${rows.length} dates de 2026`}
          >
            {[0, yMax / 2, yMax].map((t) => (
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
                <polyline className="fc-line" fill="none" points={line(seg, (r) => r.ndwiWaterKm2)} />
                <polyline className="fc-line-alt" fill="none" points={line(seg, (r) => r.sclWaterKm2)} />
              </g>
            ))}
            {rows.map((r) => (
              <g key={r.date}>
                <circle cx={x(r.date)} cy={y(r.ndwiWaterKm2)} r={2.5} className="fc-dot" />
                <circle cx={x(r.date)} cy={y(r.sclWaterKm2)} r={2.5} className="fc-dot-alt" />
              </g>
            ))}
          </svg>
          <figcaption>
            <span className="legend-line legend-line-ndwi" aria-hidden="true" /> Indice NDWI &gt; 0 (hors nuages et
            ombres) · <span className="legend-line legend-line-scl" aria-hidden="true" /> Classe « eau » de la couche
            de classification Sen2Cor. {rows.length} dates utilisables sur {extent.rows.length} ({discarded} écartées :
            plus de 5 % de nuages). Les lignes ne relient que des dates voisines.
          </figcaption>
        </figure>

        <div className="fc-side">
          <p className="map-lede">
            Les deux méthodes sont corrélées ({corr.toFixed(2)} sur {rows.length} dates) mais <strong>divergent</strong> : le
            rapport NDWI / classe eau est de {median.toFixed(2)} en médiane et va de {Math.min(...ratios).toFixed(2)} à{" "}
            {Math.max(...ratios).toFixed(2)}. Aucune n&apos;est validée contre des relevés de terrain.
          </p>
          <ul className="fc-caveats">
            <li>La surface en eau n&apos;est pas une surface de riz et n&apos;alimente aucun chiffre du bilan.</li>
            <li>
              La hausse de janvier à mars apparaît avec les deux méthodes ; celle d&apos;août n&apos;apparaît qu&apos;avec le
              NDWI. La cause de ces variations (cultures irriguées, saison des pluies, autre) n&apos;a pas été établie.
            </li>
            <li>
              Le rapport minimum vient d&apos;une seule date ({lowest.date}) dont la mesure NDWI est très basse par rapport
              aux dates voisines : artefact probable, non vérifié, conservé dans les statistiques.
            </li>
            <li>Une seule zone de {extent.zoneAreaKm2} km², une seule année, résolution de 20 m.</li>
          </ul>
          <p className="map-credit">
            {extent.source}. Méthodes : {extent.methods.ndwi} ; {extent.methods.scl}. Reproduire : node scripts/water-extent.mjs.
          </p>
        </div>
      </div>
    </section>
  );
}
