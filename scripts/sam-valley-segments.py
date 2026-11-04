"""Muse Spark (vision) choisit des concepts, SAM 3.1 les segmente, le code mesure et recoupe.
Image : Sentinel-2 L2A de la vallée du fleuve (public/sam/valley-sentinel2.jpg, scène de public/sam/valley.json).
 1. Muse Spark regarde l'image et propose au plus 8 groupes nominaux concrets (anglais, 1 à 3 mots).
 2. SAM 3.1 segmente chaque concept (une requête par concept, masques one_bit).
 3. Le code décode les masques (décodeur officiel meta-sam-parser), mesure la surface (union des instances) et
    recoupe chaque masque avec deux couches indépendantes : eau par NDWI Sentinel-2 (nuages exclus) et classes
    d'occupation du sol d'ESA WorldCover 2021. Aucun de ces nombres ne vient d'un modèle.
Prérequis : pip install meta-sam-parser numpy pillow ; MODEL_API_KEY dans l'environnement ou .env.local.
Sortie : public/sam/valley-segments.json et public/sam/seg-<n>.png (masques en surimpression).
Lancer : python scripts/sam-valley-segments.py
"""
import base64
import io
import json
import math
import os
import re
import urllib.request

import numpy as np
from PIL import Image

import meta_sam_parser as sp

API = "https://api.meta.ai/v1"
IMAGE = "public/sam/valley-sentinel2.jpg"
META = json.load(open("public/sam/valley.json", encoding="utf8"))
BBOX = META["bboxLonLat"]
SCENE = META["scene"]
W = H = 1024
PC = "https://planetarycomputer.microsoft.com/api/data/v1/item/bbox"


def key():
    k = os.environ.get("MODEL_API_KEY")
    if not k and os.path.exists(".env.local"):
        for line in open(".env.local", encoding="utf8"):
            if line.startswith("MODEL_API_KEY="):
                k = line.split("=", 1)[1].strip().strip('"')
    if not k:
        raise SystemExit("MODEL_API_KEY absente")
    return k


def post(path, body):
    req = urllib.request.Request(API + path, json.dumps(body).encode(), {"content-type": "application/json", "authorization": f"Bearer {key()}"})
    return urllib.request.urlopen(req, timeout=300).read().decode("utf8")


img_bytes = open(IMAGE, "rb").read()
data_url = "data:image/jpeg;base64," + base64.b64encode(img_bytes).decode()

# 1. Muse Spark choisit les concepts (et en repropose quand SAM ne répond pas)
def ask_spark(failed):
    prompt = (
        "Image satellite Sentinel-2 (couleurs naturelles) d'une zone agricole irriguée du Sénégal. Propose au plus 8 groupes "
        "nominaux ANGLAIS concrets, de 1 à 3 mots, désignant des types de surface bien distincts et visibles, adaptés à un "
        "modèle de segmentation (par exemple « green field », « river »). Parmi eux, au moins trois doivent viser les cultures irriguées (parcelles rectangulaires, champs inondés ou verts, canaux d'irrigation), car c'est ce qui nous intéresse. Réponds uniquement par un tableau JSON de chaînes."
    )
    if failed:
        prompt += (" Le modèle de segmentation n'a RIEN renvoyé pour : " + ", ".join(failed) +
                   ". Propose des formulations différentes, plus simples ou plus visuelles (couleur + nom), sans reprendre celles-ci.")
    raw = json.loads(post("/chat/completions", {
        "model": os.environ.get("META_MODEL", "muse-spark-1.3"), "max_tokens": 8000,
        "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}, {"type": "image_url", "image_url": {"url": data_url}}]}],
    }))
    text = raw["choices"][0]["message"]["content"] or ""
    arr = json.loads(re.search(r"\[.*\]", text, re.S)[0])
    return [c.strip().lower() for c in arr if isinstance(c, str) and 1 <= len(c.split()) <= 3 and re.fullmatch(r"[a-z ]+", c.strip().lower())][:8]


# 2. SAM 3.1 par concept
def segment(concept):
    body = {"model": "sam-3.1", "stream": True, "metadata": {"mask_encoding": "one_bit", "include_confidence": "true"},
            "input": [{"type": "message", "role": "user", "content": [{"type": "input_text", "text": concept}, {"type": "input_image", "image_url": data_url}]}]}
    out = ""
    for line in post("/responses", body).split("\n"):
        if line.startswith("data:"):
            try:
                j = json.loads(line[5:])
            except ValueError:
                continue
            if j.get("type") == "response.output_text.delta":
                out += j["delta"]
    return out

REC = re.compile(r"(\d+)<\|box;x1=(\d+);y1=(\d+);x2=(\d+);y2=(\d+);w=(\d+);h=(\d+)(?:;c=([\d.]+))?\|><\|mask;x=0;y=0(?:;c=[\d.]+)?;data=(\d+),(\d+),(.)(.*?)\|>", re.S)

def records(out):
    for m in REC.finditer(out):
        oid, x1, y1, x2, y2, w, h, c, mh, mw, enc, pay = m.groups()
        assert (int(w), int(h)) == (W, H), "taille de trame inattendue"
        mask = sp.SegmentationMask(encoding={"!": "one_bit", "~": "lossless"}[enc], payload=enc + pay, width=int(mw), height=int(mh))
        r = np.frombuffer(sp.decode_mask_to_raster(mask), dtype=np.uint8).reshape(int(mh), int(mw))
        yield int(x1), int(y1), int(x2), int(y2), (float(c) if c else None), r

# 3. couches de référence calculées par le code
def npy(url):
    return np.load(io.BytesIO(urllib.request.urlopen(url, timeout=180).read()))

box = ",".join(map(str, BBOX))
s2 = f"{PC}/{box}/{W}x{H}.npy?collection=sentinel-2-l2a&item={SCENE}"
ndwi = npy(s2 + "&expression=(B03-B08)/(B03%2BB08-2000)&asset_as_band=True")
scl = npy(s2 + "&assets=SCL")[0]
clear = (ndwi[1] > 0) & ~np.isin(scl, [3, 8, 9, 10])
water = clear & (ndwi[0] > 0)
wc = npy(f"{PC}/{box}/{W}x{H}.npy?collection=esa-worldcover&item=ESA_WorldCover_10m_2021_v200_N15W018&assets=map")[0]
WC = {10: "tree cover", 20: "shrubland", 30: "grassland", 40: "cropland", 50: "built-up", 60: "bare / sparse vegetation", 80: "permanent water", 90: "herbaceous wetland", 95: "mangroves"}
mid = (BBOX[1] + BBOX[3]) / 2
px_ha = ((BBOX[2] - BBOX[0]) * 111.32 * math.cos(math.radians(mid)) / W) * ((BBOX[3] - BBOX[1]) * 110.57 / H) * 100

def measure(concept, n):
    union = np.zeros((H, W), bool)
    inst = []
    for x1, y1, x2, y2, conf, r in records(segment(concept)):
        full = np.zeros((H, W), bool)
        full[y1:y2 + 1, x1:x2 + 1] = r[: y2 - y1 + 1, : x2 - x1 + 1].astype(bool)
        union |= full
        inst.append({"box": [x1, y1, x2, y2], "confidence": conf})
    area = int(union.sum())
    row = {"concept": concept, "instances": inst, "areaHa": round(area * px_ha, 1), "shareOfScene": round(area / (W * H), 4)}
    if area:
        row["shareWater"] = round(float((union & water).sum() / area), 3)
        row["iouWater"] = round(float((union & water).sum() / (union | water).sum()), 3)
        shares = {name: round(float((union & (wc == code)).sum() / area), 3) for code, name in WC.items()}
        row["landCoverShares"] = {k: v for k, v in sorted(shares.items(), key=lambda kv: -kv[1]) if v >= 0.05}
        # part de chaque classe de référence que le masque couvre (rappel), pour les classes qu'il recoupe nettement
        row["landCoverCoverage"] = {name: round(float((union & (wc == code)).sum() / max((wc == code).sum(), 1)), 3) for code, name in WC.items() if name in row["landCoverShares"]}
        rgba = np.zeros((H, W, 4), np.uint8)
        rgba[union] = [232, 163, 61, 150]
        Image.fromarray(rgba, "RGBA").resize((512, 512)).save(f"public/sam/seg-{n}.png")
        row["overlay"] = f"/sam/seg-{n}.png"
    print(concept, "->", row.get("areaHa"), "ha,", len(inst), "instance(s)", {k: row.get(k) for k in ("shareWater", "landCoverShares")}, flush=True)
    return row


MAX_ROUNDS, TARGET_MATCHES = 3, 3
rounds, results, tried, failed = [], [], set(), []
concepts = []
n = -1
for rnd in range(MAX_ROUNDS):
    proposed = [c for c in ask_spark(failed) if c not in tried]
    print("tour", rnd + 1, "concepts proposés par Muse Spark :", proposed, flush=True)
    rounds.append({"proposed": proposed, "failedBefore": list(failed)})
    for concept in proposed:
        tried.add(concept)
        concepts.append(concept)
        n += 1
        row = measure(concept, n)
        results.append(row)
        if not row["areaHa"]:
            failed.append(concept)
    if sum(1 for r in results if r["areaHa"]) >= TARGET_MATCHES:
        break


json.dump({
    "scene": SCENE, "acquired": META["acquired"], "bboxLonLat": BBOX, "pixelAreaHa": round(px_ha, 4), "frame": [W, H],
    "concepts": concepts, "rounds": rounds, "results": results,
    "references": {"waterHaNDWI": round(float(water.sum()) * px_ha, 1), "landCoverHaWorldCover": {name: round(float((wc == code).sum()) * px_ha, 1) for code, name in WC.items()}, "clearShare": round(float(clear.mean()), 3)},
    "models": {"concepts": "muse-spark-1.3 (vision)", "segmentation": "sam-3.1"},
    "attribution": META["attribution"],
    "note": "Les concepts viennent de Muse Spark, les masques de SAM 3.1 ; surfaces et recoupements sont calculés par le code. Aucune validation sur le terrain : un recoupement avec le NDWI ou WorldCover n'est pas une mesure d'exactitude.",
}, open("public/sam/valley-segments.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
print("écrit public/sam/valley-segments.json")
