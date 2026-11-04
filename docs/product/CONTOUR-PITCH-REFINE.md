# CONTOUR — Affinage idée / contexte / pitch / intégration Meta

**But de ce document :** transformer CONTOUR d'une « console de sécurité alimentaire » (bonne idée, mauvaise démo) en un **produit à thèse unique, démontrable en 90 secondes, et impossible à confondre avec un dashboard.**

---

## 1 | La thèse (une phrase, à répéter partout)

> **CONTOUR ne cartographie pas les cultures. Il price le déficit.**
> *Chaque décade, il transforme la pluie et la végétation observées en une bande de production, la confronte au bilan alimentaire, et rend une décision datée : combien importer, avant quand.*

**Version anglaise (soumission) :** *CONTOUR doesn't map crops — it prices the gap.*

**Ce que ça élimine :** toute ambiguïté avec FEWS NET (conditions), GEOGLAM (conditions), FAO/GIEWS (bilan annuel), USDA (prévision annuelle nationale). CONTOUR est le seul à produire **un déclencheur d'import sub-national et daté**.

---

## 2 | Positionnement (la table qui tue la concurrence)

| Acteur | Ce qu'il publie | Cadence | Échelle | Ce que CONTOUR ajoute |
|---|---|---|---|---|
| **USDA FAS** | Prévision d'import riz (1,71 Mt MY25/26 ; 1,76 Mt MY26/27) | Annuelle | Nationale | **Sub-national (vallée), chaque décade, avec bande d'incertitude** |
| **FAO GIEWS** | Bilan céréalier, « pays nécessitant une aide » | 3×/an | Nationale | **Décision d'import datée, pas un statut** |
| **FEWS NET** | Conditions de campagne, scénarios | Mensuel en saison | National/régional | **Le passage condition → tonnage → seuil → date** |
| **GEOGLAM** | Condition catégorielle (5 classes) | Mensuel | ADM1 | **Le chiffre et la décision, pas la couleur** |
| **Cadre Harmonisé** | Phases d'insécurité (1–5) | 2×/an | Département | **Le déclencheur commercial en amont, pas la crise aval** |
| **UNOSAT/Charter** | Étendue d'inondation | Événementiel | Building | **L'effet de l'inondation sur le bilan, pas la carte d'eau** |

**Phrase de positionnement :**
> *« USDA répond une fois par an, au niveau national. CONTOUR répond chaque décade, au niveau de la vallée — et il dit quand appuyer sur le bouton. »*

---

## 3 | Le produit : un seul écran, un seul artefact

L'unité atomique n'est pas une carte, c'est un **Ticket de décision** :

```
┌─────────────────────────────────────────────┐
│  CONTOUR — Vallée du fleuve · Riz · Décade 28 │
├─────────────────────────────────────────────┤
│  Condition        −1,8 σ (déficit pluie)     │
│  Production       612 kt  [520–704]  ±15%    │
│  Bilan            déficit 47 kt [22–72]      │
│  Seuil            DÉCLENCHÉ                  │
│  Action           45 kt avant le 10 sept.    │
│  Confiance        62%                        │
│  Avance vs USDA   6 semaines                 │
│  Sources          FAOSTAT · USDA · ANSD ·    │
│                   CHIRPS · S2 · ARM          │
│  État             SUFFISANT / INSUFFISANT    │
└─────────────────────────────────────────────┘
```

**Pourquoi c'est ça qui gagne :** un juge comprend le produit en 3 secondes. Pas besoin d'expliquer une couche SIG. Le « wow » n'est pas une carte, c'est **une date et une quantité**.

---

## 4 | Les 3 affirmations qui font gagner (et les 3 refus qui crédibilisent)

### On affirme
1. **« Nowcast de production en bande, au niveau de la vallée, chaque décade. »** ±15% visé sur le riz irrigué (à valider par backtest) ; ±25–30% national ; ±40% oignon.
2. **« Le seuil d'import est une arithmétique transparente »** — formule FAO CFSAM : `import = utilisation − (production + stocks début)`. Reproduit le chiffre USDA courant (1,71/1,76 Mt) **et va plus loin** : backtest hors-échantillon sur ≥5 campagnes.
3. **« Nous donnons 4 à 8 semaines d'avance sur le bilan officiel, au niveau sub-national. »** C'est LA métrique qui justifie le produit. À prouver, sinon on la retire.

### On refuse (à l'écran, pas en note de bas de page)
1. **« Rendement en temps réel »** → « condition quasi-temps réel ; nowcast saisonnier ».
2. **« Prédit les pénuries »** → « calcule l'écart sous hypothèses et signale des scénarios ».
3. **Tout chiffre sans bande, et toute carte à la parcelle.** Le satellite ne bouge que l'*index* dans la bande.

**La carte de refus** (`insufficient_data`) est un élément de design, pas un aveu : quand la série ANSD manque ou que le nuage couvre la vallée, l'écran le dit et refuse de produire un chiffre. C'est ce qui te distingue d'un projet qui invente.

---

## 5 | Intégration Meta — l'architecture exacte (load-bearing, pas décorative)

### Le principe
> **Un seul modèle fait le travail qu'aucun pipeline classique ne fait proprement : avaler un corpus hétérogène (PDF scannés, séries, communiqués politiques), appeler des outils de calcul déterministes, et rendre un verdict structuré avec intervalle et refus.**

### La pipeline

```
[DONNÉES BRUTES]
  PDF scannés (FAO/GIEWS, Cadre Harmonisé, bulletins ARM)
  Séries (FAOSTAT, USDA PSD, ANSD BMSCE, prix ANSD/WFP)
  Satellite (CHIRPS, Sentinel-2 NDVI/EVI, Sentinel-1 eau)
        │
        ▼
[MUSE SPARK 1.3 — ORCHESTRATEUR]  ← 1M de contexte
  · Ingère tout le corpus en un appel (vision pour les PDF scannés)
  · Appelle les outils : bilan, z-score, bande, seuil, backtest
  · Rend un JSON strict : {production_band, gap, threshold, date,
    confidence, sources[], state}
  · État `insufficient_data` si une source manque
        │
        ├──► [SAM 3.1]  eau/inondation sur S2/S1 + photos citoyennes
        │              (classe FORTE ; jamais pour classer les cultures)
        │
        └──► [GLIMMER 30B]  option offline pour le poste ministériel
                            (24 Go GPU — jamais load-bearing)
```

### Pourquoi chaque outil est irréductible
| Outil | Ce qui casse sans lui | Preuve dans la démo |
|---|---|---|
| **Muse Spark 1.3** | Impossible de fusionner bulletins scannés + séries + politique + calcul en un verdict cité. Un pipeline classique = 6 parseurs fragiles. | On voit le JSON sortir avec les citations et l'état de refus. |
| **SAM 3.1** | L'ajustement « perte due à l'inondation » n'a plus de mesure d'eau. | Masques d'eau sur une image S2 + une photo citoyenne. |
| **Glimmer 30B** | Rien d'essentiel — c'est un bonus offline. | Ne pas le mettre au cœur. |
| **Voice Transcribe** | **Exclu** (pas de wolof/pulaar). On le dit : c'est un choix d'honnêteté. | Une ligne dans le pitch. |

### Le « Meta moment » (les 15 secondes qui marquent)
> On montre Spark en train d'ingérer **une liasse hétérogène** — un bulletin FAO scanné, un communiqué de quota, la série de prix ANSD — puis d'appeler l'outil de bilan et de rendre le JSON avec `state: "insufficient_data"` sur une source manquante. **Le refus est le moment de crédibilité.**

### La phrase Meta du pitch
> *« Nous n'avons pas empilé des modèles. Nous avons mis un modèle long-contexte au centre, et nous l'avons forcé à refuser quand il ne sait pas. C'est ça, un agent utile. »*

---

## 6 | Le pitch 90 secondes (script final)

| t | Beat | Texte |
|---|---|---|
| 0–10 | **Hook** | « Le Sénégal importe 60–65% de son riz. Chaque année, la question n'est pas *où sont les rizières*. C'est : *quand le déficit devient-il critique, et combien importer ?* » |
| 10–22 | **Contexte** | « USDA répond une fois par an, au niveau national. Pendant que Dakar accueille les premiers JO d'Afrique, la soudure, elle, ne prend pas de vacances. » |
| 22–38 | **Produit** | « CONTOUR fusionne pluie, végétation, imports, prix et politique. Il produit une bande de production, un bilan, et un seuil d'import daté. » |
| 38–52 | **Démo** | Écran : `−1,8 σ` → `612 kt [520–704]` → `déficit 47 kt` → `SEUIL DÉCLENCHÉ` → `45 kt avant le 10 sept.` |
| 52–66 | **Preuve** | « Backtest sur 5 campagnes : erreur ±X%. Et surtout : 6 semaines d'avance sur le bilan officiel. Chaque chiffre a sa bande et sa source. » |
| 66–78 | **Meta** | « Muse Spark avale le corpus FAO/USDA/politique en un appel, appelle nos outils, et rend un JSON structuré — avec un état de refus. SAM mesure l'eau. Pas de voix wolof : on le dit. » |
| 78–90 | **Ask** | « Le Sénégal peut anticiper la soudure au lieu de la subir. Nous cherchons le partenaire qui siège à la table de décision. » |

**La phrase à retenir :** *« CONTOUR ne cartographie pas les cultures. Il price le déficit. »*

---

## 7 | Le contexte : comment l'utiliser sans se faire piéger

| Élément | Usage correct | Piège à éviter |
|---|---|---|
| **JOJ Dakar 2026 (31 oct–13 nov)** | « Pendant que le monde regarde Dakar, la soudure approche. » = *why now* narratif. | En faire un projet JOJ. Le juge a mis JOJ Companion à 77/100 (payeur 1/5). |
| **Inondations oct 2026** | « L'inondation n'est pas qu'une carte d'eau : c'est une perte de production. » = *lien avec le bilan*. | Vendre un nowcast satellite : doublonné par UNOSAT/Charter 1053, et on est en phase de récupération. |
| **Gel des imports oignon (levé 31 août 2026)** | « La politique commerciale est un signal d'alerte : le gel est un indicateur avancé de tension. » | En faire le produit principal (l'oignon est un module, pas le cœur). |
| **Dépendance riz 60–65%** | « Le déficit est structurel ; on ne prédit pas une crise, on mesure un écart. » | Traiter le gap comme une crise. |
| **Chiffre USDA** | **Utiliser 1,71 Mt (MY25/26) et 1,76 Mt (MY26/27).** | Répéter 1,66 Mt (périmé). |

---

## 8 | Le package de preuve (ce qui transforme un pitch en candidature)

1. **Backtest 5 campagnes** : production nowcast vs statistiques officielles, erreur (%) et intervalle.
2. **Lead time** : date à laquelle CONTOUR déclenche le seuil vs date de publication du bilan officiel. Objectif : ≥4 semaines.
3. **Reproductibilité** : le chiffre USDA courant sort des données publiques ; chaque étape est cliquable.
4. **Matrice de refus** : % de décades où le système refuse (et pourquoi). Un système qui refuse 15% du temps est plus crédible qu'un système qui répond toujours.
5. **Sensibilité** : le seuil change-t-il si les stocks sont ±20% ? (Oui, et on le montre.)

---

## 9 | Ce qui fait gagner / ce qui fait perdre (mapping barème)

| Barème | Ce qui fait gagner | Ce qui fait perdre |
|---|---|---|
| **Impact 30** | Une décision datée, un acheteur nommé (DGPSA/CILSS/WFP-VAM), un chiffre vérifiable | « Pour les agriculteurs » ; une carte de plus |
| **Meta 25** | Spark 1.3 au centre (1M + tools + JSON + refus), SAM sur l'eau | SAM décoratif ; un wrapper de chatbot |
| **Demo 25** | La chaîne bilan→seuil→date en 90 s ; le Ticket de décision | Un dashboard ; une carte ; un login |
| **Depth 20** | Backtest, bandes, provenance, états de refus, sensibilité | Un chiffre sans intervalle ; une régression sur 15 points |

**Les 3 choses qui te feraient perdre, dans l'ordre :**
1. La démo ressemble à un dashboard.
2. Le backtest satellite→production échoue (> ±15%).
3. Aucun acheteur nommé ne peut dire quelle décision ça déclenche.

---

## 10 | Priorités de build (10 jours)

| Jour | Priorité | Critère de sortie |
|---|---|---|
| 1 | **Kill-gate backtest** : satellite→production vs officiel, 5 ans | Si > ±15% → pivot MamanRef |
| 1 | Vérifier chiffres GAIN SG2026-0003 (1,71/1,76 Mt) + licences | Chiffres figés |
| 2 | Moteur bilan FAO + reproduction du chiffre courant | Le chiffre sort des données publiques |
| 3 | Spark : ingestion corpus + tool-calls + JSON + état de refus | JSON cité, refus visible |
| 4 | Bande de production + seuil + date | Ticket de décision complet |
| 5 | SAM eau/inondation (S2/S1 + photo) | Masque + ajustement de perte |
| 6 | Écran unique + grammaire visuelle | Test 3 secondes |
| 7 | Backtest lead-time vs USDA | ≥4 semaines ou retirer la claim |
| 8 | Durcir : cache/replay, script 90 s, screen-rec | Test API coupée |
| 9 | Polish + récit + preuves in-window | Soumission complète |
| 10 | Répétition ×3 devant auditeur hostile | ≤95 s, à froid |

---

## 11 | Risques & défenses (les 5 qui comptent)

| Risque | Défense |
|---|---|
| **Chiffre USDA périmé** | Utiliser 1,71/1,76 Mt ; citer GAIN SG2026-0003 ; ne jamais dire 1,66. |
| **« Reproduire USDA » = paraphrasage** | Backtest hors-échantillon ≥5 ans + lead-time ; claim = *plus tôt et sub-national*, pas *même chiffre*. |
| **Satellite faible sur les cultures** | Le satellite ne bouge que l'index dans la bande ; l'aire vient des stats officielles ; SAM uniquement pour l'eau. |
| **Aucun acheteur** | Nommer la décision (seuil d'import) et l'acheteur (DGPSA/CILSS/WFP-VAM) ; à défaut, le dire comme hypothèse. |
| **Démo = dashboard** | Un seul écran, un seul Ticket de décision, une seule chaîne. Si ça ressemble à un dashboard, on coupe. |

---

## 12 | La phrase finale (à mettre sur la dernière slide)

> **« USDA vous dit ce qui s'est passé. FEWS NET vous dit à quoi ça ressemble. CONTOUR vous dit quand appuyer sur le bouton. »**
