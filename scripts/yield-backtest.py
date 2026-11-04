"""Le rendement du riz par département peut-il être estimé hors échantillon à partir de la pluie ?
Règles fixées avant de regarder les résultats :
 - années : 2017-2025 sans 2021 (surfaces irriguées effondrées dans la source) ;
 - départements : >= 7 années valides sur 8 et surface moyenne >= 1000 ha ;
 - cible : log du rendement (erreur relative) ; validation : on retire une année entière, on la prédit.
Modèles : A moyenne du département ; B tendance linéaire du département ; C moyenne + pluie (pente commune) ;
 D moyenne + pluie (pente distincte pour le nord irrigué et le sud pluvial).
Lancer : python -I scripts/yield-backtest.py
"""
import json
import numpy as np
import pandas as pd

rng = np.random.default_rng(0)
y = pd.read_csv("data/sources/eaa-rice-departments.csv", sep=";")
r = pd.read_csv("data/sources/chirps-departments.csv", sep=";")
d = y.merge(r, on=["departement", "annee"])
d = d[d.annee != 2021]
YEARS = sorted(d.annee.unique())
keep = [k for k, g in d.groupby("departement") if len(g) >= 7 and g.superficie_ha.mean() >= 1000]
d = d[d.departement.isin(keep)].copy()
d["ly"] = np.log(d.rendement_kg_ha)
d["lr"] = np.log(d.pluie_jun_oct_mm)
NORTH = {"Dagana", "Podor", "Matam", "Saint Louis", "Kanel", "Bakel"}  # nord, riz majoritairement irrigué
d["nord"] = d.departement.isin(NORTH)

def predict(train, test, model):
    out = []
    for dep, te in test.groupby("departement"):
        tr = train[train.departement == dep]
        mu = tr.ly.mean()
        if model == "A":
            p = np.full(len(te), mu)
        elif model == "B":
            if len(tr) < 4: p = np.full(len(te), mu)
            else:
                b = np.polyfit(tr.annee, tr.ly, 1); p = np.polyval(b, te.annee)
        else:
            p = None
        if p is not None: out.append(pd.Series(p, index=te.index))
    if model in "CD":
        tr = train.copy()
        tr["ly_c"] = tr.ly - tr.groupby("departement").ly.transform("mean")
        tr["lr_c"] = tr.lr - tr.groupby("departement").lr.transform("mean")
        mean_lr = train.groupby("departement").lr.mean()
        mean_ly = train.groupby("departement").ly.mean()
        groups = [np.ones(len(tr), bool)] if model == "C" else [tr.nord.values, ~tr.nord.values]
        beta = {}
        for i, gmask in enumerate(groups):
            g = tr[gmask]; beta[i] = float((g.lr_c * g.ly_c).sum() / (g.lr_c ** 2).sum())
        pr = []
        for idx, row in test.iterrows():
            i = 0 if model == "C" else (0 if row.nord else 1)
            pr.append(mean_ly[row.departement] + beta[i] * (row.lr - mean_lr[row.departement]))
        out.append(pd.Series(pr, index=test.index))
    return pd.concat(out)

def loyo(model):
    res = []
    for t in YEARS:
        te = d[d.annee == t]; tr = d[d.annee != t]
        tr = tr[tr.departement.isin(te.departement)]
        p = predict(tr, te, model)
        res.append(pd.DataFrame({"annee": t, "departement": te.departement, "nord": te.nord, "err": (p - te.ly).abs()}))
    return pd.concat(res)

R = {m: loyo(m) for m in "ABCD"}
out = {"departements": keep, "annees": [int(a) for a in YEARS], "n_cellules": int(len(d)), "modeles": {}}
for m in "ABCD":
    e = R[m]
    out["modeles"][m] = {"mae_relative_pct": round(100 * (np.exp(e.err.mean()) - 1), 1),
                         "mae_nord": round(100 * (np.exp(e[e.nord].err.mean()) - 1), 1),
                         "mae_sud": round(100 * (np.exp(e[~e.nord].err.mean()) - 1), 1)}
def ratio(m, base, sub=None):
    a, b = R[m], R[base]
    if sub is not None: a, b = a[a.nord == sub], b[b.nord == sub]
    ys = sorted(a.annee.unique()); v = []
    for _ in range(2000):
        s = rng.choice(ys, len(ys))
        v.append(np.mean(np.concatenate([a[a.annee == t].err for t in s])) / np.mean(np.concatenate([b[b.annee == t].err for t in s])))
    return round(a.err.mean() / b.err.mean(), 3), [round(float(np.percentile(v, 5)), 3), round(float(np.percentile(v, 95)), 3)]
out["rapports_erreur"] = {f"{m}/{b}{'' if s is None else (' nord' if s else ' sud')}": ratio(m, b, s) for m, b in [("C", "A"), ("D", "A"), ("B", "A")] for s in (None, True, False)}
# corrélation brute pluie-rendement une fois l'effet département retiré
dd = d.copy(); dd["yc"] = dd.ly - dd.groupby("departement").ly.transform("mean"); dd["rc"] = dd.lr - dd.groupby("departement").lr.transform("mean")
out["correlation_residuelle"] = {"tous": round(float(dd.yc.corr(dd.rc)), 2), "nord": round(float(dd[dd.nord].yc.corr(dd[dd.nord].rc)), 2), "sud": round(float(dd[~dd.nord].yc.corr(dd[~dd.nord].rc)), 2)}
json.dump(out, open("data/results/yield-backtest.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(json.dumps(out, ensure_ascii=False, indent=1))
