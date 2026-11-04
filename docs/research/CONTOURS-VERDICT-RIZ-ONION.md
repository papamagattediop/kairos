# Contours & Verdict Final — Projet Riz + Oignon (Hackathon Meta 2026)

**Mandat :** deepsearch + deepthink, mindset fort, sans filtre.
**Verdict en une ligne : GO conditionnel** — mais pas avec la démo « SAM dessine les parcelles de riz » telle qu'elle était dans ma tête. La recherche a **démonté** ce hook sur imagerie satellite de très haute résolution vue du ciel. Contours corrigés ci-dessous.

---

## 0 | Ce qui a bougé depuis ta proposition (3 faits durs)

1. **L'API hébergée SAM 3.1 n'accepte QUE des prompts textuels en phrase-nom.** Les prompts boîte/point (bien meilleurs en imagerie satellite) demandent d'auto-héberger les poids ouverts. Donc en mode « crédits Meta, zéro infrastructure », tu es coincé sur la modalité **la plus faible**.
2. **Les prix oignon sont confirmés ouverts et à double source** : ANSD (PDF/CSV) **et** WFP/HDX (série mensuelle incluant `Onions (dry)` et `Onions (imported)`, marchés Tilène/Castors, ~2000→2026). Le flux oignon a une vraie colonne vertébrale de données.
3. **SAM 3 en imagerie vue du ciel = le maillon faible mesuré** : étude « Segment Anything but Farms » (WACVW 2026) = **95% IoU sur les bâtiments vs 51% sur les champs** ; prompts texte sur scènes remote-sensing (AID) = **11,67 mAP** (arXiv 2607.09583). Les champs sont la classe *faible*, l'eau/les bâtiments la classe *forte*.

---

## 1 | Nom & pitch (Meta au moteur)

**Nom : CONTOUR**
*(le jeu de mots paie : SAM 3.1 trace le contour, et le produit trace le contour du risque.)*

> **CONTOUR est une console d'alerte précoce où Meta SAM 3.1 découpe sans aucun jeu d'entraînement les étendues d'eau/inondation et les infrastructures de la vallée du fleuve sur Sentinel-2, tandis que Muse Spark interroge les séries de prix ANSD/WFP et renvoie un verdict structuré avec intervalle et état « données insuffisantes ».** Un seul analyste décide vendredi : acheter, tenir ou attendre.

**Phrase juge (à garder telle quelle) :** *« Le Sénégal n'a aucun jeu de données de cultures labellisé ouvert. Le mapping supervisé y plafonne à ~50% d'exactitude. Nous avons donc supprimé le besoin d'un classifieur. »*

---

## 2 | Périmètre 10 jours — IN / OUT

**Cadre non-négociable : UNE écran, UNE question.**
*« Où est l'anormalité ce week-ci sur une filière sénégalaise, et est-ce du signal ou du bruit ? »*
Les deux flux ne sont pas deux produits : ce sont deux **piliers de drivers** derrière un instrument, commutés par un bascule « filière ».

**Utilisateur nommé (un seul) :** l'analyste risque/marché d'une société de négoce & import agroalimentaire à Dakar, qui doit rédiger sa note d'achat hebdomadaire. (Un ministère ou une coopérative = argument d'impact, **pas** un deuxième utilisateur.)

### Flux 1 — RIZ (offre)
| Élément | Choix |
|---|---|
| **Décision** | Quelle zone rizicole regarder en premier cette semaine ? |
| **Écran** | Carte Sentinel-2 RGB + barre de phrase-nom → masques + slider temporel + couches anomalie NDVI/CHIRPS + fiche parcelle avec intervalle |
| **Modèle Meta au moteur** | **SAM 3.1** (prompt texte → masques), positionné honnêtement sur l'eau/le bâti/les étendues inondées. Spark : brief d'un paragraphe sur la parcelle sélectionnée. |
| **ÉVIDENCE (pas décoratif)** | **Sentinel-1 signature temporelle d'inondation** + NDVI + CHIRPS. C'est S1, pas SAM, qui prouve le riz. |
| **CUT** | Toute classification de cultures (mono ou multi), prédiction de rendement, revendication d'exactitude au-delà du découpage, tirages ANACIM en direct, tracking vidéo (stretch J8+), revendication de validation terrain, rasters GADM (utiliser frontières HDX/OCHA CC-BY 4.0). |

### Flux 2 — OIGNON (marché)
| Élément | Choix |
|---|---|
| **Décision** | Ce mouvement de prix est-il saisonnièrement normal ou une anomalie — acheter, tenir, attendre ? |
| **Écran** | Console : série de prix avec bande saisonnière 5 ans + z-score + contexte import + boîte NL retournant des cartes-verdict JSON structurées |
| **Modèle Meta au moteur** | **Muse Spark 1.3** (tool-calling agentic sur DuckDB/CSV + fonctions stats ; JSON structuré avec intervalle explicite et état de refus `insufficient_data`). |
| **ÉVIDENCE** | Séries ANSD + WFP/HDX (oignon sec + importé), dynamique d'import (60–164 k t, mécanisme de gel 2026), contexte CIRIZ/SAED pour le riz. |
| **CUT** | Prédiction ML de prix (tu **mesures** l'écart, tu ne prédis pas), chatbot général, toute revendication de voix Wolof/Pulaar (NON supporté par Muse Voice — confirmé négatif), logistique/traçabilité, prolifération région×culture (prendre les 1–2 séries qui ont réellement de la profondeur). |

### Coupes globales
- **Glimmer 30B : OUT** (optionnel uniquement si tu as une GPU 24 Go ; par défaut non).
- **Muse Image / Muse Code comme « features produit » : OUT.** Muse Code est un outil de build, ne te crédite pas avec.
- Auth, multi-utilisateur, mobile, PostGIS serveur, orchestration Docker : OUT. Déploy statique caché.

**Kill-gate Jour 1 :** si les séries de prix oignon n'ont pas ≥3 ans d'historique exploitable, **pivot immédiat du flux marché vers les céréales** (séries ANSD profondes) et garde l'oignon seulement si les données passent le bar. Vérifier, ne pas supposer.

---

## 3 | Architecture

```
COUCHE DONNÉES                     COUCHE META                        COUCHE APP
Sentinel-2 L2A RGB (10m) ──┐
  Planetary Computer /       │  SAM 3.1 → masques (couche de       Next.js + MapLibre GL
  accès Copernicus ouvert    ├─►          cache OBLIGATOIRE :        (ton stack ; pas de QGIS
NDVI calculé local            │            chaque appel pré-fetché   en démo live — un écran
  (rasterio/xarray)           │            + mode replay)            QGIS se lit comme un
CHIRPS → anomalie zonale      │                                       devoir, pas un produit)
  (z-scores pré-calculés)     │  Muse Spark → couche agentic :      + recharts pour bandes
ANSD CSV/SDMX ────────────────┤            tool-calls vers fonctions  + overlay GeoJSON masques
FAO FPMA + séries import ─────┘            stats + DuckDB, émet      + état de démo pré-cuit
        │                                   JSON structuré
        └──────── DuckDB (un fichier, pas de serveur) ──────────────┘
```

- **SAM 3.1 est sur le chemin d'ingestion** (tuiles → masques → cache GeoJSON). Jamais appelé en live d'une façon dont la démo dépend.
- **Spark est la seule surface conversationnelle** ; chaque réponse est du JSON validé par schéma (`series_id`, `z_score`, `interval`, `verdict`, `refusal_reason`). Les **refus sont un affichage**, pas une erreur.
- **Un seul endpoint, une seule clé :** `https://api.meta.ai/v1`, `Authorization: Bearer $MODEL_API_KEY`, SDK OpenAI pointé là-dessus. SAM et Spark partagent le même enveloppe Responses.

---

## 4 | Le point critique — SAM 3.1 (la correction de fond)

**Ce que je croyais (et qui est faux pour l'API hébergée) :** « tape *champ de riz*, SAM dessine les parcelles. »

**Ce que la recherche dit :**
- Hébergé = **phrase-nom seulement**. Boîte/point = auto-héberger les poids ouverts (GPU, ta zone faible).
- Sur imagerie vue du nadir : champs = classe faible (**51% IoU**), bâtiments/eau = classe forte (**95% IoU**). Prompts texte sur RS = **11,67 mAP**.

**Conségence (décision) — utiliser SAM 3.1 là où la littérature dit qu'il marche :**
1. **L'eau / l'inondation / le bâti** sur Sentinel-2 RGB — les classes fortes. C'est directement pertinent pour le riz irrigué (l'étendue inondée est un proxy riz) et pour le risque d'inondation.
2. **Le couple documenté par Meta lui-même** : *« laisse Muse Spark interpréter une scène et décider quoi segmenter, puis passe le concept à SAM 3.1 pour les masques »* (docs media-segmentation + sam/segmenting). Spark peut aussi **pré-localiser** des régions via sa *perception grounding* (coordonnées 0–1000), ce qui mitige la faiblesse du prompt texte au nadir.
3. **Le héros ambitionné** (texte → parcelles de riz) : **testé en Jour 1** avec seuil d'acceptation écrit. S'il passe → gardé. Sinon → repli jour 1 sur l'eau/inondation/bâti (modalité littérature-sûre). **J'améliore jamais un prompt en scène.**

**Le « impossible avant » honnête :** *zéro jeu d'entraînement* pour la couche de découpage, **plus** une intelligence structurée avec intervalle, **plus** une carte de refus visible. Spark est sans ambiguïté au moteur (25% du barème) ; SAM est au moteur mais positionné honnêtement.

---

## 5 | Script de démo — 90 secondes

| t | Beat | Ce que le juge voit |
|---|---|---|
| 0–8 | **Utilisateur nommé** | « Vendredi matin à Dakar. Une analyste doit décider : acheter, tenir ou attendre. Deux choses peuvent la faire bouger aujourd'hui : notre riz, et les oignons qu'on importe. » |
| 8–25 | **Héros riz** | Tape : *« étendues inondées, rive droite près de Kaédi. »* Masques se dessinent sur le RGB Sentinel-2. Slider temporel. NDVI chute, CHIRPS −40% vs 10 ans. Fiche parcelle : **« hors bande normale : −1,8σ, IC 90% [−2,4, −1,1] »** |
| 25–40 | **« Impossible avant »** | « À l'ancienne il faudrait un jeu de données de cultures labellisé pour le Sénégal — il n'en existe pas. Le mapping supervisé plafonne vers 50% et exige des campagnes de terrain. Elle a tapé une phrase. Zéro label. Zéro entraînement. » |
| 40–65 | **Console oignon** | Un clic, même instrument. Série de prix avec bande saisonnière. Tape : *« ce mouvement est-il normal ? »* Spark tool-call les données → **carte-verdict** : z-score, intervalle, contexte import, `verdict: TENIR — écart dans la bande saisonnière.` |
| 65–80 | **Punchline épistémique, VISIBLE** | Montre les éléments d'UI : *« On ne prédit pas le prix — on montre l'écart à la bande 5 ans, avec un intervalle. SAM a tracé l'étendue ; il n'a PAS identifié la culture, et on ne revendique pas une exactitude non mesurée. Posez-lui une question que les données ne peuvent pas répondre — »* (tape une question dure) → **carte de refus `insufficient_data` à l'écran.** |
| 80–90 | **Clôture** | *« Une analyste. Un écran. Deux questions qui prenaient une équipe SIG et un statisticien. »* |

**La carte de refus apparaissant en live est ta différenciation** contre toutes les entrées « chatbot sur dashboard ». Fais-en un beat voulu, pas un bug à expliquer.

---

## 6 | Plan 10 jours (26 oct → 4 nov) — risque d'abord

| Jour | Travail | Gate |
|---|---|---|
| **1 (risque max d'abord)** | **Spike SAM 3.1 au nadir :** 10 prompts texte sur 5 scènes Sentinel-2 de la vallée du fleuve. En parallèle : **kill-gates données** (profondeur série oignon, frontières admin, CHIRPS, FPMA). | **Acceptation : masques utilisables dans ≥3/5 scènes.** Si échec → repli immédiat, pas à J8. |
| 2 | Verrouiller périmètre ; construire le harnais de cache (tous les appels Meta pré-fetchés, mode replay) ; choisir les tuiles et prompts exacts de démo. | Replay offline OK. |
| 3–4 | Module riz : tuiles → SAM → masques → anomalie NDVI/CHIRPS → écran carte. | Une fiche parcelle s'affiche avec intervalle. |
| 5–6 | Module oignon/marché : couche DuckDB, bande saisonnière + z-score, tool-calling Spark avec schéma JSON + état de refus. | Carte-verdict **et** carte-refus s'affichent. |
| 7 | Unifier : un écran, bascule filière, grammaire visuelle partagée. Brief auto Spark. | **Test 3 secondes : un inconnu comprend l'écran sans aide.** |
| 8 | Durcissement démo : replay complet, script 90s, sauvegarde screen-rec. | Test « API coupée » passe. |
| 9 | Polish (niveau emil-design-eng), README/récit d'impact, preuves de build in-window. | Artefacts de soumission complets. |
| 10 | **Répéter la démo live ×3** (devant un auditeur hostile), buffer pour panne API/infra. | Démo ≤95s, trois fois, à froid. |

**Recommandation d'équipe : le solo est viable pour ce périmètre — et préférable.** Le meilleur cas réaliste est **+1** (aide couche données, **et** être l'audience hostile des répétitions). N'ajoute pas 3–4 personnes : le coût de coordination dépasse le gain, et la Démo (25%) se gagne en répétition, pas en effectif.

---

## 7 | Registre des risques

| # | Risque | P (impact) | Mitigation qui marche vraiment en 10 jours |
|---|---|---|---|
| **1** | **SAM 3.1 prompt texte = masques nuls sur Sentinel-2 10m au nadir** (ta plus faible modalité) — le moment héros meurt | **Élevé / fatal** | Spike Jour 1 avec seuil d'acceptation écrit ; jeu de prompts pré-réglé pour 3 lieux de démo nommés ; repli : l'eau/inondation/bâti (classes fortes), ou déclaration **riz seul avec découpage de région fixe**. Jamais d'improvisation de prompt en scène. |
| 2 | Deux flux lisent comme deux projets agrafés → Démo 3,5 encore | Moyen / fatal pour Démo | Un écran, une grammaire d'interaction, une bascule filière ; riz 60s / oignon 30s max ; **aucun deuxième paradigme de navigation.** |
| 3 | Série de prix oignon trop mince / historique volatil pour une bande saisonnière | Moyen / élevé | Kill-gate Jour 1 avec pivot nommé vers céréales ; la carte `insufficient_data` devient une feature, pas un trou. |
| 4 | Panne API Meta en live pendant la démo | Moyen / élevé | Cache + mode replay offline obligatoire (J2) ; sauvegarde screen-rec exacte de la démo ; jamais d'appel SAM en live pour la première fois en scène. |
| 5 | Sur-revendication tue la crédibilité (ID culture, rendement, voix Wolof, prédiction de prix) | Faible-Moyen / élevé | Lignes « on ne revendique pas » pré-écrites dans le script ; carte de refus comme élément d'UI conçu ; **aucune voix en langue locale** nulle part (Wolof/Pulaar non supportés — confirmé). |

*(Piège de licence plié dans le gate Jour 1 du #3 : frontières HDX/OCHA seulement ; pas de redistribution GADM.)*

---

## 8 | VERDICT FINAL

### Odds calibrées (taux de base d'abord)
- **Taux de base :** agri-géo + dashboards LLM sont un **genre affolamment concurrent**. Un solo junior sans marque d'équipe atterrit typiquement dans les 60–70% bas des soumissions sur le polish de démo seul. Finaliste naïf ≈ **3–8%**.
- **Ajustements haut :** centralité Meta réellement irremplaçable (SAM sans labels répond au contrainte la plus dure connue), artefact d'honnêteté **conçu**, utilisateur nommé, ton stack (Next.js + stats + DE) est une vraie force.
- **Ajustements bas :** solo, 10 jours, risque nadir, complexité de démo à deux flux.

| Issue | Estimation (bande 90%) | Raisonnement |
|---|---|---|
| **Finaliste** | **~22% (15–32%)** | Conditionnel au passage du gate Jour 1 : ~30%. |
| **N'importe quel prix de track** | **~10% (6–16%)** | ≈ taux finaliste × P(prize\|finaliste) ≈ 40–50%, démo 90s cohérente. |
| **1er prix (150 k$)** | **~3% (1,5–6%)** | Non conditionnel. Équivalent : 33 $ pour gagner 1 $ — je prends, à peine. **Si les 3 conditions ci-dessous tiennent en scène : 10–18%.** |

### Les 3 conditions qui doivent TOUJOURS être vraies pour que le 1er prix soit réaliste
1. **SAM 3.1 découpe visiblement de vraies étendues/inondations de la vallée à partir d'une phrase, en live, au nadir** — en passant le gate Jour 1 *et* en tenant en scène. Sans ça tu as un dashboard, et les dashboards scorent ~4,95 (mesuré).
2. **La démo se lit comme UN instrument en 90 secondes** — aucun changement de contexte qu'un juge doive apprendre. Démo ≥8/10.
3. **Un utilisateur nommé + la carte de refus visible atterrissent comme récit d'impact/honnêteté** — Impact ≥7, idéalement avec une institution dakaroise nommée (négoce, coopérative, ou desk) citée comme cible pilote dans les matériaux de soumission.

### L'UNE chose la plus susceptible de tout tuer
**La qualité des prompts texte de SAM 3.1 au nadir sur Sentinel-2 10m.** Ta propre recherche les désigne comme la modalité la plus faible. Si les masques sont de la boue, le beat « impossible avant » devient « regardez, un contour » — et tous les chiffres en aval s'effondrent vers les 4,95 mesurés. D'où : Jour 1, **avant** la première ligne de code d'app.

### Le jeu plus sûr (dit honnêtement)
Le concept **strictement plus sûr** est **plus étroit** : **riz seul** — *« Tape une phrase, obtiens les étendues inondées de la vallée du riz et leur statut d'anomalie, sans aucun label. »* Une capacité, un écran, conforme au pattern gagnant, et le risque de données de l'oignon disparaît. Ça troque un peu d'impact (30%) contre une Démo et un Tooling quasi garantis.

**Mais ce n'est pas le bon défaut :** le flux oignon/Spark est **peu coûteux si son gate de données passe au Jour 1**, c'est ce qui fait du produit une **console de décision** plutôt qu'un truc SIG, et il porte le **deuxième modèle Meta** (25% du barème). Garde les deux, avec riz-seul comme repli déclaré et répété.

### **GO / NO-GO : GO CONDITIONNEL**
Avec un kill-switch explicite : construire **uniquement si** le spike SAM nadir du Jour 1 franchit le seuil d'acceptation écrit ; sinon exécuter le repli riz-seul **le même jour**. Ne passe pas J3–J6 sur le module oignon si son gate de données a échoué. Livre **un instrument, une carte de refus, une phrase qui trace un contour.**

### Confiance & non-vérifié
- **Haute** : API shapes, prix, limites, absence Wolof/Pulaar, licence Glimmer, endpoint unique, crédits 150 $, couple Spark↔SAM documenté.
- **Non vérifié** (à tester toi-même dès Jour 1) : (a) limites de crédits/tarifs spécifiques au hackathon ; (b) **précision réelle de SAM 3.1 sur RGB satellite au nadir** ; (c) ingérat CSV (convertir, ne pas parier) ; (d) qualité pratique du « persistent state » offline de Glimmer.
