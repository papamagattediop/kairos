// Surface en eau d'une zone de la vallée du fleuve Sénégal, sur plusieurs dates Sentinel-2.
// Deux mesures indépendantes, toutes deux issues de produits Copernicus :
//   1. NDWI = (B03 - B08) / (B03 + B08) > 0  (McFeeters, 1996), calculé sur les bandes brutes
//   2. classe « eau » (6) de la couche de classification de scène SCL (Sen2Cor, ESA)
// Aucune bibliothèque : l'API de données de Microsoft Planetary Computer fait le calcul côté serveur.
// Usage : node scripts/water-extent.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { SCL_CLOUD_OR_SHADOW, SCL_WATER, parseNpy, zoneGeometry } from "./lib/npy.mjs";

const STAC = "https://planetarycomputer.microsoft.com/api/stac/v1/search";
const DATA = "https://planetarycomputer.microsoft.com/api/data/v1/item/bbox";
const BBOX = [-16.28, 16.4, -16.14, 16.54]; // lon min, lat min, lon max, lat max
const W = 747;
const H = 774; // ~20 m par pixel sur cette zone
const MAX_CLOUD_ITEM = 20; // filtre de recherche sur la scène entière (%)
const MAX_CLOUD_AREA = 0.05; // une date est écartée si > 5 % de la zone est nuageuse

const { widthKm, heightKm, pixelKm2 } = zoneGeometry(BBOX, W, H);

async function getJson(url, body) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`STAC ${res.status}`);
  return res.json();
}

async function getNpy(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`données ${res.status}`);
  return parseNpy(Buffer.from(await res.arrayBuffer()));
}

const search = await getJson(STAC, {
  collections: ["sentinel-2-l2a"],
  bbox: BBOX,
  datetime: "2026-01-01T00:00:00Z/2026-11-02T00:00:00Z",
  query: { "eo:cloud_cover": { lt: MAX_CLOUD_ITEM } },
  sortby: [{ field: "datetime", direction: "asc" }],
  limit: 60,
});

// Une scène par date, tuile T28QCD uniquement (celle de la vallée), dédoublonnée par jour.
const items = [];
const seenDays = new Set();
for (const f of search.features) {
  const day = f.properties.datetime.slice(0, 10);
  if (!f.id.includes("T28QCD") || seenDays.has(day)) continue;
  seenDays.add(day);
  items.push({ id: f.id, day });
}

const rows = [];
for (const { id, day } of items) {
  const base = `${DATA}/${BBOX.join(",")}/${W}x${H}.npy?collection=sentinel-2-l2a&item=${id}`;
  try {
    const ndwi = await getNpy(`${base}&expression=(B03-B08)/(B03%2BB08)&asset_as_band=True`);
    const scl = await getNpy(`${base}&assets=SCL`);
    const n = W * H;
    let valid = 0;
    let ndwiWater = 0;
    let sclWater = 0;
    let sclCloud = 0;
    for (let i = 0; i < n; i++) {
      const mask = ndwi.get(n + i); // couche 2 : masque de validité (255 = valide)
      if (!mask) continue;
      valid++;
      const c = scl.get(i);
      const cloudy = SCL_CLOUD_OR_SHADOW.has(c);
      if (cloudy) sclCloud++;
      // NDWI : un nuage ou une ombre ne compte jamais comme de l'eau
      if (!cloudy && ndwi.get(i) > 0) ndwiWater++;
      if (c === SCL_WATER) sclWater++;
    }
    rows.push({
      date: day,
      item: id,
      validPixels: valid,
      cloudShare: Number((sclCloud / n).toFixed(4)),
      ndwiWaterKm2: Number(((ndwiWater * pixelKm2)).toFixed(2)),
      sclWaterKm2: Number(((sclWater * pixelKm2)).toFixed(2)),
      usable: valid / n > 0.95 && sclCloud / n <= MAX_CLOUD_AREA,
    });
    console.log(day, "NDWI", rows[rows.length - 1].ndwiWaterKm2, "km² | SCL", rows[rows.length - 1].sclWaterKm2, "km² | nuages", (rows[rows.length - 1].cloudShare * 100).toFixed(1) + "%", rows[rows.length - 1].usable ? "" : "(écartée)");
  } catch (error) {
    console.log(day, "ignorée :", error.message);
  }
}

mkdirSync("data/satellite", { recursive: true });
writeFileSync(
  "data/satellite/valley-water-extent.json",
  JSON.stringify(
    {
      retrievedAt: new Date().toISOString().slice(0, 10),
      bbox: BBOX,
      zoneAreaKm2: Number((widthKm * heightKm).toFixed(1)),
      pixelKm2: Number(pixelKm2.toFixed(6)),
      methods: {
        ndwi: "NDWI = (B03 - B08) / (B03 + B08) > 0 sur Sentinel-2 L2A (McFeeters, 1996), hors pixels de nuage ou d'ombre de nuage de la couche SCL",
        scl: "classe 6 (eau) de la couche de classification de scène Sen2Cor",
      },
      source: "Contains modified Copernicus Sentinel data 2026 (Sentinel-2 L2A, via Microsoft Planetary Computer)",
      note: "Mesures d'indice non validées contre des relevés de terrain. La surface en eau n'est pas une surface de riz.",
      rows,
    },
    null,
    2,
  ),
);
console.log(`${rows.length} dates écrites, ${rows.filter((r) => r.usable).length} utilisables`);
