// Indice de végétation (NDVI) des surfaces classées « cultures » dans la zone de la vallée du fleuve
// Sénégal, sur les dates Sentinel-2 retenues par scripts/water-extent.mjs.
//   - Occupation du sol : ESA WorldCover 2021 (10 m), classe 40 = cultures. Carte fixe de 2021 :
//     elle ne dit pas ce qui est cultivé en 2026 ni quelle culture.
//   - NDVI = (B08 - B04) / (B08 + B04) sur la réflectance. Les produits L2A récents portent un décalage
//     de 1000 sur les valeurs numériques : NDVI = (B08 - B04) / (B08 + B04 - 2000).
//   - Pixels écartés : nuage, ombre de nuage (SCL 3, 8, 9, 10), eau (SCL 6), pixels invalides et valeurs
//     hors de [-1, 1]. Un dénominateur nul ou négatif n'est pas détecté directement (le serveur ne renvoie
//     que le rapport) : une relecture indépendante n'en a observé aucun sur 4 dates « cultures » rejouées.
//     La classe SCL 7 (non classé) est conservée. Les deux couches sont lues à 20 m par le service, qui
//     sous-échantillonne les sources de 10 m : le masque « cultures » est un échantillon, pas un décompte exact.
// Aucune bibliothèque : l'API de données de Microsoft Planetary Computer calcule côté serveur.
// Usage : node scripts/vegetation-index.mjs   (après scripts/water-extent.mjs)
import { readFileSync, writeFileSync } from "node:fs";
import { SCL_CLOUD_OR_SHADOW, SCL_WATER, parseNpy, zoneGeometry } from "./lib/npy.mjs";

const DATA = "https://planetarycomputer.microsoft.com/api/data/v1/item/bbox";
const WORLDCOVER_ITEM = "ESA_WorldCover_10m_2021_v200_N15W018";
const CROPLAND = 40;
const GREEN_NDVI = 0.4; // seuil indicatif de couvert vert : non étalonné sur cette zone
const BBOX = [-16.28, 16.4, -16.14, 16.54];
const W = 747;
const H = 774;

const water = JSON.parse(readFileSync("data/satellite/valley-water-extent.json", "utf8"));
const { zoneKm2, pixelKm2 } = zoneGeometry(BBOX, W, H);

async function getNpy(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`données ${res.status}`);
  return parseNpy(Buffer.from(await res.arrayBuffer()));
}

const n = W * H;
const wcUrl = `${DATA}/${BBOX.join(",")}/${W}x${H}.npy?collection=esa-worldcover&item=${WORLDCOVER_ITEM}&assets=map`;
const wc = await getNpy(wcUrl);
const classCounts = {};
for (let i = 0; i < n; i++) classCounts[wc.get(i)] = (classCounts[wc.get(i)] ?? 0) + 1;
const croplandPixels = classCounts[CROPLAND] ?? 0;
console.log("WorldCover, classes (pixels):", JSON.stringify(classCounts));
console.log(`cultures : ${croplandPixels} pixels = ${(croplandPixels * pixelKm2).toFixed(1)} km² (${((croplandPixels / n) * 100).toFixed(1)} % de la zone)`);

const rows = [];
for (const day of water.rows.filter((r) => r.usable)) {
  const base = `${DATA}/${BBOX.join(",")}/${W}x${H}.npy?collection=sentinel-2-l2a&item=${day.item}`;
  try {
    const ndvi = await getNpy(`${base}&expression=(B08-B04)/(B08%2BB04-2000)&asset_as_band=True`);
    const scl = await getNpy(`${base}&assets=SCL`);
    let cropValid = 0;
    let cropSum = 0;
    let cropGreen = 0;
    let zoneValid = 0;
    let zoneSum = 0;
    const cropValues = [];
    for (let i = 0; i < n; i++) {
      if (!ndvi.get(n + i)) continue; // masque de validité
      const c = scl.get(i);
      const v = ndvi.get(i);
      if (SCL_CLOUD_OR_SHADOW.has(c) || c === SCL_WATER || !Number.isFinite(v) || v < -1 || v > 1) continue;
      zoneValid++;
      zoneSum += v;
      if (wc.get(i) === CROPLAND) {
        cropValid++;
        cropSum += v;
        cropValues.push(v);
        if (v > GREEN_NDVI) cropGreen++;
      }
    }
    cropValues.sort((a, b) => a - b);
    const q = (p) => (cropValues.length ? cropValues[Math.min(cropValues.length - 1, Math.floor(p * cropValues.length))] : null);
    rows.push({
      date: day.date,
      item: day.item,
      croplandValidPixels: cropValid,
      croplandValidShare: Number((cropValid / Math.max(croplandPixels, 1)).toFixed(3)),
      croplandNdviMean: cropValid ? Number((cropSum / cropValid).toFixed(3)) : null,
      croplandNdviP10: cropValid ? Number(q(0.1).toFixed(3)) : null,
      croplandNdviP90: cropValid ? Number(q(0.9).toFixed(3)) : null,
      croplandGreenShare: cropValid ? Number((cropGreen / cropValid).toFixed(3)) : null,
      zoneNdviMean: zoneValid ? Number((zoneSum / zoneValid).toFixed(3)) : null,
    });
    const r = rows[rows.length - 1];
    console.log(day.date, "NDVI cultures", r.croplandNdviMean, `[p10 ${r.croplandNdviP10} – p90 ${r.croplandNdviP90}]`, "vert", r.croplandGreenShare, "| pixels valides", r.croplandValidShare);
  } catch (error) {
    console.log(day.date, "ignorée :", error.message);
  }
}

writeFileSync(
  "data/satellite/valley-vegetation.json",
  JSON.stringify(
    {
      retrievedAt: new Date().toISOString().slice(0, 10),
      bbox: BBOX,
      zoneAreaKm2: Number(zoneKm2.toFixed(1)),
      landCover: {
        source: "ESA WorldCover 2021 v200 (10 m), via Microsoft Planetary Computer",
        item: WORLDCOVER_ITEM,
        croplandClass: CROPLAND,
        croplandKm2: Number((croplandPixels * pixelKm2).toFixed(1)),
        croplandShareOfZone: Number((croplandPixels / n).toFixed(3)),
        classPixelCounts: classCounts,
      },
      method: {
        ndvi: "NDVI = (B08 - B04) / (B08 + B04 - 2000) sur Sentinel-2 L2A (décalage de réflectance de 1000 compensé)",
        masked: "nuage, ombre de nuage (SCL 3, 8, 9, 10), eau (SCL 6), pixels invalides",
        greenThreshold: GREEN_NDVI,
        resolutionMeters: 20,
      },
      source: "Contains modified Copernicus Sentinel data 2026 (Sentinel-2 L2A) ; ESA WorldCover 2021 (CC BY 4.0), via Microsoft Planetary Computer",
      note: "Indice de végétation des surfaces classées cultures en 2021. Il ne dit ni quelle culture, ni le rendement, ni la production, et n'est pas validé contre des relevés de terrain.",
      rows,
    },
    null,
    2,
  ),
);
console.log(`${rows.length} dates écrites`);
