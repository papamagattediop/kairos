"""NDVI MODIS (MOD13Q1, 250 m, 16 jours) des surfaces cultivées par département -> data/sources/modis-ndvi-departments.csv
 - Grille 0,0025 degré (environ 280 m) sur [-17.6, -11.3] x [12.2, 16.8], alignée sur les tuiles ESA WorldCover.
 - Surfaces cultivées : ESA WorldCover 2021, classe 40, part de cultures dans la cellule >= 0,5. Carte fixe de 2021,
   toutes cultures confondues : elle ne distingue pas le riz.
 - NDVI : MOD13Q1 (Terra) tuile h16v07 via l'API de données de Microsoft Planetary Computer. Pixels gardés :
   fiabilité 0 (bonne), NDVI entre -2000 et 10000 (échelle 0,0001).
 - Composites de la campagne : jour de l'année 177 à 321 (fin juin à mi-novembre).
Entrées non versionnées : data/incoming/worldcover-2021, data/incoming/geoboundaries-adm2-full. Cache dans le
dossier donné en argument (un JSON par composite) pour pouvoir reprendre.
Lancer : python -I scripts/modis-ndvi-departments.py <dossier_cache>
"""
import io
import json
import os
import sys
import time
import urllib.request

import numpy as np
from PIL import Image, ImageDraw

Image.MAX_IMAGE_PIXELS = None
CACHE = sys.argv[1]
os.makedirs(CACHE, exist_ok=True)
LON0, LON1, LAT0, LAT1, RES = -17.6, -11.3, 12.2, 16.8, 0.0025
NX, NY = round((LON1 - LON0) / RES), round((LAT1 - LAT0) / RES)  # 2520 x 1840
YEARS = range(2017, 2026)
DOY_MIN, DOY_MAX = 177, 321

# 1. départements -> étiquettes sur la grille
gj = json.load(open("data/incoming/geoboundaries-adm2-full/geoBoundaries-SEN-ADM2.geojson", encoding="utf8"))
names = [f["properties"]["shapeName"] for f in gj["features"]]
lab = Image.new("L", (NX, NY), 255)
d = ImageDraw.Draw(lab)
for i, f in enumerate(gj["features"]):
    g = f["geometry"]
    for p in ([g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]):
        d.polygon([((x - LON0) / RES, (LAT1 - y) / RES) for x, y, *_ in p[0]], fill=i)
lab = np.array(lab)

# 2. part de cultures (WorldCover classe 40) par cellule
crop = np.zeros((NY, NX), dtype="float32")
K = round(RES / (3 / 36000))  # 30 pixels de 10 m par cellule
for lat_top, nlat in ((18, "N15"), (15, "N12")):
    for lon_left, nlon in ((-18, "W018"), (-15, "W015"), (-12, "W012")):
        c0, c1 = max(LON0, lon_left), min(LON1, lon_left + 3)
        r0, r1 = max(LAT0, lat_top - 3), min(LAT1, lat_top)
        if c0 >= c1 or r0 >= r1:
            continue
        im = Image.open(f"data/incoming/worldcover-2021/ESA_WorldCover_10m_2021_v200_{nlat}{nlon}_Map.tif")
        gx0, gx1 = round((c0 - LON0) / RES), round((c1 - LON0) / RES)
        gy0, gy1 = round((LAT1 - r1) / RES), round((LAT1 - r0) / RES)
        for gy in range(gy0, gy1, 10):
            ge = min(gy + 10, gy1)
            px0, px1 = round((c0 - lon_left) / (3 / 36000)), round((c1 - lon_left) / (3 / 36000))
            py0 = round((lat_top - (LAT1 - gy * RES)) / (3 / 36000))
            py1 = py0 + (ge - gy) * K
            a = np.array(im.crop((px0, py0, px1, py1))) == 40
            crop[gy:ge, gx0:gx1] = a.reshape(ge - gy, K, gx1 - gx0, K).mean(axis=(1, 3))
mask = crop >= 0.5
print("cellules cultivées:", int(mask.sum()), "sur", NX * NY, flush=True)

# 3. composites MODIS
def post(url, body):
    req = urllib.request.Request(url, json.dumps(body).encode(), {"content-type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=120))

def npy(url):
    for k in range(4):
        try:
            return np.load(io.BytesIO(urllib.request.urlopen(url, timeout=180).read()))
        except Exception as e:
            time.sleep(5 * (k + 1))
    raise RuntimeError("échec " + url)

items = {}
for y in YEARS:
    j = post("https://planetarycomputer.microsoft.com/api/stac/v1/search", {"collections": ["modis-13Q1-061"], "bbox": [LON0, LAT0, LON1, LAT1],
             "datetime": f"{y}-06-20T00:00:00Z/{y}-11-30T23:59:59Z", "limit": 200})
    for f in j["features"]:
        if not f["id"].startswith("MOD13Q1") or ".h16v07." not in f["id"]:
            continue
        doy = int(f["id"].split(".")[1][5:])
        if DOY_MIN <= doy <= DOY_MAX:
            k = (y, doy)
            if k not in items or f["id"] > items[k]:  # garde le traitement le plus récent
                items[k] = f["id"]
print(len(items), "composites", flush=True)

HALF = NX // 2  # l'API plafonne la largeur à 2048 pixels : deux moitiés recollées
LONM = LON0 + HALF * RES

def fetch(iid, asset):
    parts = []
    for a, b, w in ((LON0, LONM, HALF), (LONM, LON1, NX - HALF)):
        parts.append(npy(f"https://planetarycomputer.microsoft.com/api/data/v1/item/bbox/{a:.4f},{LAT0},{b:.4f},{LAT1}/{w}x{NY}.npy?collection=modis-13Q1-061&item={iid}&assets={asset}"))
    return np.concatenate(parts, axis=2)

rows = ["departement;annee;jour;ndvi_moyen;cellules_valides;cellules_cultivees"]
for (y, doy), iid in sorted(items.items()):
    cf = os.path.join(CACHE, f"{iid}.json")
    if not os.path.exists(cf):
        nd = fetch(iid, "250m_16_days_NDVI")
        rl = fetch(iid, "250m_16_days_pixel_reliability")
        v, vm = nd[0].astype("float64"), nd[1] > 0
        ok = vm & (rl[1] > 0) & (rl[0] == 0) & (v >= -2000) & (v <= 10000) & mask
        res = []
        for i, name in enumerate(names):
            sel = lab == i
            n_crop = int((sel & mask).sum())
            sel &= ok
            res.append([name, int(sel.sum()), n_crop, float(v[sel].mean() / 10000) if sel.any() else None])
        json.dump(res, open(cf, "w"))
        print(y, doy, "ok", flush=True)
    for name, nv, nc, m in json.load(open(cf)):
        rows.append(";".join([name, str(y), str(doy), "" if m is None else f"{m:.4f}", str(nv), str(nc)]))
open("data/sources/modis-ndvi-departments.csv", "w", encoding="utf8").write("\n".join(rows) + "\n")
print(len(rows) - 1, "lignes")
