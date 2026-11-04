"""Le NDVI MODIS des surfaces cultivées améliore-t-il l'estimation hors échantillon du rendement du riz par département ?
Mêmes règles que scripts/yield-backtest.py (années 2017-2025 sans 2021, mêmes 21 départements, une année retirée
à la fois, erreur relative sur le log du rendement). Prédicteur principal fixé d'avance : pic de NDVI de la campagne
(maximum des composites valides). Variante de contrôle, non choisie sur les résultats : NDVI moyen août-octobre.
Un composite est valide si au moins 20 cellules et 20 % des cellules cultivées du département sont bonnes ;
une année est utilisable si au moins 6 composites sont valides.
Modèles : A moyenne ; C + pluie ; E + NDVI ; F + pluie + NDVI. Pente distincte nord irrigué / sud pluvial.
Lancer : python -I scripts/yield-backtest-ndvi.py
"""
import json
import numpy as np
import pandas as pd

rng = np.random.default_rng(0)
y = pd.read_csv("data/sources/eaa-rice-departments.csv", sep=";")
r = pd.read_csv("data/sources/chirps-departments.csv", sep=";")
m = pd.read_csv("data/sources/modis-ndvi-departments.csv", sep=";")
m = m[(m.cellules_valides >= 20) & (m.cellules_valides >= 0.2 * m.cellules_cultivees) & m.ndvi_moyen.notna()]
g = m.groupby(["departement", "annee"])
feat = pd.DataFrame({"n_comp": g.size(), "pic": g.ndvi_moyen.max(),
                     "aot": m[(m.jour >= 209) & (m.jour <= 289)].groupby(["departement", "annee"]).ndvi_moyen.mean()}).reset_index()
feat = feat[feat.n_comp >= 6]
d = y.merge(r, on=["departement", "annee"]).merge(feat, on=["departement", "annee"], how="left")
d = d[d.annee != 2021]
keep = [k for k, x in y[y.annee != 2021].groupby("departement") if len(x) >= 7 and x.superficie_ha.mean() >= 1000]
d = d[d.departement.isin(keep)].copy()
n_before = len(d)
d = d[d.pic.notna()].copy()
d["ly"] = np.log(d.rendement_kg_ha)
d["lr"] = np.log(d.pluie_jun_oct_mm)
NORTH = {"Dagana", "Podor", "Matam", "Saint Louis", "Kanel", "Bakel"}
d["nord"] = d.departement.isin(NORTH)
YEARS = sorted(d.annee.unique())
FE = {"A": [], "C": ["lr"], "E": ["pic"], "F": ["lr", "pic"], "G": ["aot"]}

def loyo(model, sub):
    cols = FE[model]
    out = []
    for t in YEARS:
        te, tr = d[(d.annee == t) & (d.nord == sub)], d[(d.annee != t) & (d.nord == sub)]
        tr = tr[tr.departement.isin(te.departement)]
        te = te[te.departement.isin(tr.departement)]  # un département sans autre année ne peut pas être prédit
        if te.empty:
            continue
        mu = tr.groupby("departement")[["ly"] + ["lr", "pic", "aot"]].mean()
        p = mu.loc[te.departement, "ly"].values.copy()
        if cols:
            X = (tr[cols] - tr.groupby("departement")[cols].transform("mean")).values
            yy = (tr.ly - tr.groupby("departement").ly.transform("mean")).values
            b = np.linalg.lstsq(X, yy, rcond=None)[0]
            p += (te[cols].values - mu.loc[te.departement, cols].values) @ b
        out.append(pd.DataFrame({"annee": t, "err": np.abs(p - te.ly.values)}))
    return pd.concat(out)

res = {"cellules_avant_ndvi": n_before, "cellules": len(d), "annees": [int(a) for a in YEARS]}
for sub, label in ((False, "sud"), (True, "nord")):
    if d[d.nord == sub].empty:
        continue
    R = {mod: loyo(mod, sub) for mod in FE}
    a = R["A"]
    block = {"n_cellules": int((d.nord == sub).sum()), "departements": int(d[d.nord == sub].departement.nunique()),
             "mae_pct": {k: round(100 * (np.exp(v.err.mean()) - 1), 1) for k, v in R.items()}}
    ratios = {}
    for k in ("C", "E", "F", "G"):
        v = []
        ys = sorted(a.annee.unique())
        for _ in range(3000):
            s = rng.choice(ys, len(ys))
            ea = np.concatenate([a[a.annee == t].err.values for t in s]); ek = np.concatenate([R[k][R[k].annee == t].err.values for t in s])
            v.append(ek.mean() / ea.mean())
        ratios[k + "/A"] = [round(R[k].err.mean() / a.err.mean(), 3), [round(float(np.percentile(v, 5)), 3), round(float(np.percentile(v, 95)), 3)]]
    block["rapports_erreur"] = ratios
    dd = d[d.nord == sub]
    yc = dd.ly - dd.groupby("departement").ly.transform("mean")
    block["correlation_residuelle"] = {c: round(float(yc.corr(dd[c] - dd.groupby("departement")[c].transform("mean"))), 2) for c in ("lr", "pic", "aot")}
    res[label] = block
json.dump(res, open("data/results/yield-backtest-ndvi.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(json.dumps(res, ensure_ascii=False, indent=1))
