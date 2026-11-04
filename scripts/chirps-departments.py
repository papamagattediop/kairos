"""Pluie CHIRPS v3.0 par département et par campagne -> data/sources/chirps-departments.csv
Entrées (non versionnées, voir data/incoming/MANIFEST.md) : chirps-v3/*.tif (mensuel, 0,05 degré, nodata -9999)
et geoBoundaries ADM2 complet. Sortie : pluie cumulée juin-octobre et juillet-septembre (mm) par département et année.
Moyenne des cellules dont le centre est dans le polygone ; si aucune (petit département), cellule du centroïde.
Lancer : python -I scripts/chirps-departments.py
"""
import json
import numpy as np
from PIL import Image, ImageDraw

Image.MAX_IMAGE_PIXELS = None
ORIGIN_LON, ORIGIN_LAT, RES, W, H = -20.0, 40.0, 0.05, 1500, 1600
gj = json.load(open("data/incoming/geoboundaries-adm2-full/geoBoundaries-SEN-ADM2.geojson", encoding="utf8"))

def polys(geom):
    return [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]

def px(lon, lat):
    return ((lon - ORIGIN_LON) / RES, (ORIGIN_LAT - lat) / RES)

masks = {}
for f in gj["features"]:
    name = f["properties"]["shapeName"]
    im = Image.new("1", (W, H), 0)
    d = ImageDraw.Draw(im)
    for p in polys(f["geometry"]):
        d.polygon([px(*pt[:2]) for pt in p[0]], fill=1)
        for hole in p[1:]:
            d.polygon([px(*pt[:2]) for pt in hole], fill=0)
    m = np.array(im, dtype=bool)
    if not m.any():
        pts = np.array([pt[:2] for p in polys(f["geometry"]) for pt in p[0]])
        cx, cy = px(pts[:, 0].mean(), pts[:, 1].mean())
        m[int(cy), int(cx)] = True
    masks[name] = m

def month(y, mo):
    a = np.array(Image.open(f"data/incoming/chirps-v3/chirps-v3.0.{y}.{mo:02d}.tif"), dtype="float64")
    return np.where(a < 0, np.nan, a)

rows = ["departement;annee;pluie_jun_oct_mm;pluie_jul_sep_mm;cellules"]
for y in range(2016, 2026):
    ms = {mo: month(y, mo) for mo in range(6, 11)}
    for name, m in masks.items():
        v = {mo: float(np.nanmean(ms[mo][m])) for mo in ms}
        rows.append(";".join([name, str(y), f"{sum(v.values()):.1f}", f"{v[7] + v[8] + v[9]:.1f}", str(int(m.sum()))]))
open("data/sources/chirps-departments.csv", "w", encoding="utf8").write("\n".join(rows) + "\n")
print(len(rows) - 1, "lignes")
