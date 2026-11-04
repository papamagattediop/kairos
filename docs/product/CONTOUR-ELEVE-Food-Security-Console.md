# CONTOUR — Console de sécurité alimentaire & pilotage des imports (version élevée)

**Déclencheur :** ta critique — « trop simpliste, moins impactant ». Elle est juste pour PrixVu/ParcelZero/CarRapide. Mais la réponse n'est pas d'empiler des features non démontrables (c'était l'échec d'AgriFood). La réponse est de **changer la nature du produit** : passer d'un « moniteur de parcelles » à un **système de bilan alimentaire et de décision d'import**.

**Règle d'or maintenue :** ambition oui ; mais la démo reste **UNE chaîne causale sur UN produit (riz) + l'oignon comme module marché**. Pas 10 filières.

---

## 1 | Mission & pitch

**CONTOUR** transforme des signaux multi-sources (satellite, pluie, production, imports, prix, population) en une **décision datée** : *quand le déficit alimentaire devient-il critique, combien importer, et avant quelle date ?*

> **Pitch (Meta au moteur) :** CONTOUR est la console qui, chaque décade, transforme la pluie et la végétation observées par satellite en une **bande de production**, la confronte au bilan alimentaire (production + stocks + imports − consommation), puis laisse **Muse Spark orchestrer** les bulletins FAO, les rapports du Cadre Harmonisé et les séries de prix pour produire un **verdict structuré avec intervalle, seuil d'import et carte de refus** — pour que le Sénégal anticipe au lieu de subir.

**Ce qui change vs ma version précédente :** on ne « regarde » plus des parcelles. On **calcule un déficit, un seuil, une date**. C'est ça, l'impact.

---

## 2 | La chaîne causale (le cœur — et la démo)

```
1. PLUIE (CHIRPS) ──► anomalie décadale vs médiane 5 ans
2. VÉGÉTATION (Sentinel-2 NDVI/EVI) ──► anomalie vs médiane 5 ans
3. SURFACE (officielle/FAOSTAT) × INDEX DE RENDEMENT (satellite) ──► PRODUCTION en BANDE
4. BILAN : production + stocks + imports − consommation ──► DÉFICIT PROJETÉ
5. DÉFICIT vs baseline ──► RISQUE DE MANQUEMENT (probabilité, lead time)
6. RÈGLE D'IMPORT ──► COMBIEN, AVANT QUELLE DATE
7. INDICATEURS AVANCÉS ──► FENÊTRE DE HAUSSE DES PRIX
8. PLAN D'ACTION daté
```

**Chaque maillon a une source, une date, un intervalle, et un état « donnée insuffisante ».**

---

## 3 | Les 5 sorties que tu as demandées (et leur forme honnête)

| Ta demande | Ce que CONTOUR affiche | Forme honnête |
|---|---|---|
| **Estimation récolte/production/rendement** | Riz SRV : `645 kt ± 25%` (fin de saison) ; national en saison `± 25–30%` ; oignon `± 40%` | **Bande, jamais un point.** Area officielle × index de rendement satellite. |
| **Risque de manquement** | `Déficit projeté 45 kt [20–70]` + `probabilité 62%` + `horizon novembre` | **Déviation vs baseline**, pas « crise » absolue. |
| **Seuil d'importation** | `Seuil déclenché : 45 kt à commander avant le 10 septembre` | **Règle-modèle** (FAO CFSAM + ECOWAS 66% + ARM 20 kt/mois), pas un chiffre officiel — il n'existe pas comme donnée. |
| **Périodes de manque / hausse de prix** | `Fenêtre critique : octobre` ; `hausse probable +18% [10–28%]` | Indicateurs avancés (pluie, NDVI, surface, calendrier de quotas). Pas une prédiction certaine. |
| **Prévenir / planifier** | Plan daté : « libérer X stocks ; importer Y avant Z ; surveiller W » | Scénarios + sensibilité, pas une injonction. |

---

## 4 | Le stack multi-sources (ce qui existe vraiment)

| Bloc | Source | Ouvert ? | Granularité | Rôle |
|---|---|---|---|---|
| Pluie | **CHIRPS** | Oui (domaine public) | 0,05° (~5,5 km), décadal/jour | Anomalie climatique |
| Végétation | **Sentinel-2** NDVI/EVI | Oui (Copernicus/DE Africa) | 10 m, 5 j (nuages en saison des pluies) | Condition de campagne |
| Inondation / surface | **Sentinel-1** + **SAM 3.1** | Oui | 10 m | Étendue d'eau/rizière |
| Surface/production annuelle | **FAOSTAT** + **ANSD EAA 2024–25** (microdonnées parcelle riz/oignon!) + **Direction de l'Horticulture** | Oui (CC BY 4.0) | National/annuel ; microdonnées | Base du calcul |
| Imports | **ANSD BMSCE** (mensuel, riz) + **Comtrade** (cross-check) | Oui (mensuel gratuit ANSD) | Mois | Terme du bilan |
| Consommation | **FAOSTAT Food Balance** (riz, kg/cap/an) ; oignon ~350 kt/an | Oui (riz) ; oignon = estimation | Annuel | Terme du bilan |
| Population | **WorldPop / HDX** | Oui | Admin | Demande |
| Prix | **ANSD** + **WFP/HDX** (riz local/importé, oignon sec/importé) | Oui | Marché/mois | Alerte prix |
| Insécurité alimentaire | **Cadre Harmonisé** (Sénégal) | À vérifier (cycle courant pas garanti sur HDX) | Département, 2×/an | Contexte |
| Stocks | — | **NON** | — | **HYPOTHÈSE explicite** |
| Seuil d'import officiel | — | **NON** (règle politique : quota ARM, gel 16 jan–31 août) | — | **RÈGLE-MODÈLE, scrapée de la presse** |

**Le bilan, littéralement :**
`Besoin d'import = utilisation (conso + semences + pertes + stocks fin) − (production + stocks début)`
C'est la formule **FAO CFSAM/GIEWS**. Et elle est **vérifiable** : appliquée au riz MY2025/26, elle **reproduit la prévision USDA de 1,66 Mt d'imports** à partir d'entrées publiques. **C'est ton moment « wow » : une arithmétique que le juge peut refaire.**

---

## 5 | Le rôle exact de Meta (25% du barème)

| Outil | Rôle | Pourquoi pas un stack normal |
|---|---|---|
| **Muse Spark 1.3** | **Orchestrateur agentique** : avale en un appel le corpus (bulletins FAO, Cadre Harmonisé, communiqués de quotas, séries de prix), appelle les fonctions de calcul (bilan, z-score, régression), émet un **JSON structuré** avec bandes + états de refus. Sa **vision** lit les bulletins scannés/tableaux PDF. | Contexte 1M + tool-calling + sortie structurée + vision : un seul modèle fait l'orchestration multi-sources que 4 scripts ne feraient pas proprement. |
| **SAM 3.1** | Découpe l'eau/l'inondation/l'étendue sur Sentinel (classe **forte**), pas les cultures (classe faible). | Zéro label, zéro entraînement. |
| **Muse Glimmer 30B** | Optionnel : poste ministériel **hors ligne** (laptop 24 Go, Apache 2.0). | Fonctionne sans réseau, sans coût par token. |
| Muse Image / Code | Hors produit (Code = outil de build). | Ne pas se créditer avec. |

**Le hook « impossible sans Meta » = Spark agentique sur 1M de contexte produisant un bilan alimentaire structuré et refusant d'inventer.** C'est plus fort que « SAM dessine un contour ».

---

## 6 | Ce qu'on AFFIRME / ce qu'on REFUSE (l'honnêteté comme avantage)

**On affirme :**
1. « Monitoring de condition de campagne en quasi-temps réel (décadal), même classe que GEOGLAM/FEWS NET. »
2. « Nowcast de rendement **en bande** : ±25% riz irrigué SRV, ±30–40% riz pluvial, ±40% oignon — bandes issues de la littérature (RIICE : NRMSE 18–60% ; études Sentinel-2 : nRMSE 20–63%). »
3. « Le besoin d'import est une **arithmétique de bilan transparente** (formule FAO), qui reproduit la prévision USDA 1,66 Mt. »
4. « Les seuils sont des **règles-scénarios** calquées sur des déclencheurs réels (ECOWAS stocks<66% ; ARM 20 kt/mois). »

**On refuse (jamais à l'écran) :**
- « rendement en temps réel » → « condition quasi-temps réel ; nowcast saisonnier ».
- toute carte de rendement **à la parcelle** pour le Sénégal.
- « 90%+ d'exactitude » (c'est RIICE avec campagne terrain, pas nous).
- un chiffre de rendement **sans sa bande**.
- « prédit les pénuries » / « dit au gouvernement combien importer » → « calcule l'écart sous hypothèses et signale des scénarios ».
- traiter le gap riz comme une crise : ~60–65% de dépendance aux imports est **structurel**, pas une anomalie.
- toute affirmation « validée » sur le rendement oignon (« proxy végétatif, research-grade » au mieux).

**Risque d'intégrité n°1 :** faire une régression NDVI→t/ha sur 15 points FAOSTAT et afficher une carte de rendement confiante. Un juge qui connaît le sujet demande « quel échantillon de validation, quel RMSE hors-année ? » et tu tombes. **Défense : la bande avant le chiffre ; la précédence affichée ; ce que le satellite ne voit pas (nuages, parcelles 0,3–0,7 ha, sites RIICE à 34–60% d'erreur) ; le satellite ne bouge que l'index DANS la bande.**

---

## 7 | Tranche verticale 10 jours (ce qui est réellement construit)

**Périmètre : riz (vallée du fleuve + bilan national) + oignon (module marché/saisonnalité d'import).**

| Jour | Livrable | Gate |
|---|---|---|
| 1 | **Kill-gates données** : vérifier FAOSTAT, ANSD BMSCE, WFP/HDX (oignon présent ?), microdonnées EAA, Cadre Harmonisé courant. **Spike SAM** eau/inondation. | Si l'oignon manque dans WFP/HDX → module oignon = prix ANSD seulement. |
| 2 | Pipeline pluie + NDVI (CHIRPS/S2) → anomalies décadales. | Une carte d'anomalie s'affiche. |
| 3 | Bilan alimentaire : moteur de calcul + formule FAO + reproduction USDA 1,66 Mt. | **Le chiffre USDA sort des données publiques.** |
| 4 | Nowcast production en bande (area × index). | `645 kt ±25%` avec source. |
| 5 | Spark agentique : corpus + tool-calls + JSON structuré + états de refus. | Verdict structuré + carte de refus. |
| 6 | Seuil d'import + fenêtre de prix + plan daté. | Scénario + sensibilité. |
| 7 | Unifier l'écran (riz/oignon), grammaire visuelle. | Test 3 secondes. |
| 8 | Durcir : cache/replay, script 90s, screen-rec. | Test API coupée. |
| 9 | Polish + récit d'impact + preuves in-window. | Soumission complète. |
| 10 | Répétition ×3 devant auditeur hostile. | ≤95 s, à froid. |

---

## 8 | Démo 90 secondes

| t | Beat |
|---|---|
| 0–10 | « Le Sénégal importe ~65% de son riz et gère l'oignon par quotas. La vraie question n'est pas *quelle parcelle*, c'est *quand le déficit devient critique et quand importer*. » |
| 10–22 | Pluie CHIRPS −40%, NDVI −1,8σ dans la vallée → **condition de campagne dégradée**. |
| 22–38 | **Production en bande** : `645 kt ±25%` (area officielle × index satellite). |
| 38–52 | **Bilan** : production + stocks + imports − conso → `déficit 45 kt [20–70]`. |
| 52–64 | **Seuil d'import** : `45 kt à commander avant le 10 septembre` (règle FAO/ECOWAS/ARM). |
| 64–76 | **Alerte prix** : `hausse probable +18% [10–28%] en octobre`. |
| 76–84 | **Preuve** : « Cette même arithmétique reproduit la prévision USDA de 1,66 Mt — refaite depuis des données publiques. » |
| 84–90 | **Honnêteté visible** : « On ne dit pas *temps réel* ; on dit *nowcast*. On ne donne pas un chiffre sans bande. Et quand les données manquent — » → **carte `insufficient_data`**. |

---

## 9 | Risques

| # | Risque | Mitigation |
|---|---|---|
| 1 | Sur-claiming du rendement → juge appelle ça du théâtre | Bandes + précédence + refus explicite (section 6). |
| 2 | Données stocks/CH manquantes | Stocks = hypothèse affichée ; CH = couche optionnelle. |
| 3 | Spark/1M : ingestion CSV refusée (MIME) | Convertir en JSON/TXT avant. |
| 4 | Démo trop chargée (chaîne longue) | Une seule chaîne riz ; oignon = 20 s. |
| 5 | Panne API en live | Cache/replay + screen-rec. |
| 6 | Périmètre qui re-déborde | Règle d'or : riz + oignon seulement. |

---

## 10 | VERDICT : CONTOUR élevé vs ShoreWatch

| Axe | CONTOUR élevé | ShoreWatch |
|---|---|---|
| **Impact (30%)** | **Très fort** — sécurité alimentaire nationale, import, prix | Fort mais local |
| **Meta (25%)** | **Très fort** — Spark agentique 1M + SAM + vision + refus | Fort — SAM sur classe forte |
| **Démo (25%)** | **Très fort mais risqué** — chaîne causale vérifiable | **Très fort et sûr** — un chiffre |
| **Profondeur (20%)** | **Très fort** — bilan, incertitude, multi-sources | Moyen-fort |
| **Faisabilité 10 j** | Moyenne (chaîne longue) | **Élevée** |
| **Plafond 1er prix** | **Le plus haut de tous les projets présentés** | Élevé |
| **Plancher (risque d'échec)** | Plus bas | **Plus haut** |

**Verdict :** CONTOUR élevé est **le projet le plus ambitieux et le plus impactant** de tous ceux discutés — il répond exactement à ta critique. Il a le **plus haut plafond pour le 1er prix** *à condition* de tenir trois choses : (1) la démo est **la chaîne bilan→seuil→date**, pas un dashboard ; (2) **chaque chiffre a sa bande** ; (3) la **carte de refus** est visible. Sans ces trois, il retombe dans l'échec AgriFood.

**Odds honnêtes :** finaliste ~20–25% ; **1er prix ~3–5%** (contre ~2–4% pour ShoreWatch). **Plafond plus haut, plancher plus bas.**

**Recommandation : GO sur CONTOUR élevé**, avec ShoreWatch comme repli si le Jour 1 montre que le pipeline de bilan ne tient pas. **Ne fusionne pas les deux.**
