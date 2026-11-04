# KAIROS — script de démo (3 min) et texte de soumission

Brouillon à relire et à adapter. Chaque phrase correspond à ce qui tourne réellement dans
le dépôt. Le règlement impose que la démo ne montre que ce qui a été construit pendant
l'événement (27 octobre au 4 novembre) : le dire explicitement, une fois, au début.

## 1. Avant d'enregistrer

- **Serveur :** `npm run dev`, puis http://localhost:3000. Pour un enregistrement sûr hors réseau : dans PowerShell,
  `$env:META_REPLAY="1"; npm run dev`. Le rejeu relit des réponses Meta réellement enregistrées (4 scénarios : extraction
  fictive, agent sur l'extrait fictif, agent FAOSTAT, agent départements). **Dites-le dans la vidéo si vous montrez un
  rejeu.** Mode direct (sans `META_REPLAY`) = vrai appel Meta, plus convaincant mais dépend du réseau.
- **N'utilisez que les boutons d'exemple** de la page : ils sont étiquetés fictifs ou officiels.
- **À l'écran :** fenêtre en 1360 px de large, zoom 100 %, thème sombre, onglets personnels fermés, aucune clé visible
  (ne jamais ouvrir `.env.local`), notifications coupées.
- **À ne jamais dire :** « précision », « calendrier d'importation », « utilisé par une institution », « prévision
  validée ». Dire « estimation de référence », « bande d'erreurs observées », « non concluant ».
- **Règle du concours :** la démo ne doit montrer que ce qui a été construit pendant l'événement (27 octobre au
  4 novembre). Le dire une fois, au début. Les notes de cadrage de `docs/` sont des documents de planification.
- Lancer `npm test` avant : 189 tests doivent passer. Faire une répétition complète avec chronomètre.

## 2. Script, 3 minutes (narration en anglais pour le jury)

| Temps | À l'écran | Narration |
|---|---|---|
| 0:00 – 0:12 | Page d'accueil, titre | "KAIROS is a food-supply monitor for Senegal. Everything you will see was built during this hackathon. Meta models read and reason; the code calculates every number; and the system refuses when the data cannot support a conclusion." |
| 0:12 – 0:50 | Carte des 45 départements : survoler, cliquer **Dagana** puis **Kolda** | "This is rice yield, department by department, from the official annual agricultural survey. Twenty-one of forty-five departments have enough years for an estimate; the other twenty-four say insufficient data. Click Dagana: irrigated north, about 5,700 kilograms per hectare. Click Kolda: rain-fed south, about 2,900, with a wider band. The band is measured: it holds eighty percent of the errors we got when we predicted each year we had hidden. And notice the hatched bar: we excluded 2021, because the source itself collapses that year." |
| 0:50 – 1:25 | Panneau agent, bouton « Rendement du riz par département », clic | "Now the agent. I ask Muse Spark to compare Kolda and Dagana and say how far to trust it. Spark chooses its tools; the code returns the numbers. Every number in the answer must come from a tool or from my question, or the answer is flagged. And it tells us what we found: this is a department average, not a model forecast, and rainfall gives only a weak, fragile gain." |
| 1:25 – 1:50 | Panneau d'extraction, extrait fictif, clic | "Muse Spark can also read a source. It proposes each balance term with a quote; the code re-reads the number and unit in that quote. Stock change was not published, so the balance is refused. We never replace a missing term with zero." |
| 1:50 – 2:20 | Panneau « Données officielles » : courbe, fourchette, tableau du test | "For national imports, we tested five forecasting models, fifty-three times, with a rule fixed in advance. None beats simply repeating last year. So KAIROS publishes no forecast; it publishes a reference range around the last value and says how often such ranges held. We even withdrew our first forecast when a longer series contradicted it." |
| 2:20 – 2:45 | Panneau « Muse Spark propose · SAM 3.1 segmente · le code mesure » : cocher « green irrigated field » | "On the satellite image, Muse Spark proposes what to segment, SAM 3.1 returns masks, and when SAM finds nothing Spark reformulates. Out of twenty-three concepts, SAM matched three. The code shows its green-field mask is a single belt of eleven thousand hectares, mostly classed wetland, not parcels. No rice-parcel mask, so no figure depends on it, and we say so." |
| 2:45 – 3:00 | Page entière | "A satellite vegetation test was inconclusive, and we report it as such. KAIROS: Meta models read, code calculates, and the system refuses when it should. Thank you." |

Durée : si le tout dépasse 3 minutes, couper d'abord l'extraction (1:25 – 1:50), puis raccourcir la partie FAOSTAT.
Ne pas dépasser 3:00 : la vidéo est un artefact principal du jugement (démo = 25 % de la note).

## 3. Texte du formulaire (anglais)

**Project name:** KAIROS

**Track / theme:** Indie Developer · Build for Your World

**One-line description:** A food-supply monitor for Senegal where Meta models read sources
and orchestrate tools, the code calculates every number, and the system refuses when the
data cannot support a conclusion.

**Description (short):**
KAIROS combines real FAO food-balance data for Senegal rice (63 years, two FAOSTAT series spliced with a
measured unit factor) with a transparent forecasting gate. It tests five simple models one year ahead on
53 forecasts, choosing the model on the first half and judging it on the second, and publishes a model
forecast only if it clearly and steadily beats persistence. It does not: so KAIROS publishes a
reference range around the last observed value (25 of the last 33 years covered at a stated 80%:
compatible, no more), and refuses to claim a model. One model, exponential growth, does better but no rule
based on the past selects it, so it is not claimed. Muse Spark 1.3 extracts balance terms from pasted sources and acts as a
tool-calling agent (extraction, balance calculation, net imports, department rice yield and ranking, product registry); a
deterministic engine does all the arithmetic. Each extracted number must appear in a verbatim quote of the
source, and each number in the agent's answer must come from a tool or from the user's question, or the
answer is flagged. A department map shows official rice yields (EAA 2017-2025) for 21 of 45 departments with an out-of-sample error band, and insufficient data for the rest. Rice is the
first product; other products appear with an explicit maturity level and refuse until their data is
examined.

**How Meta tooling is used:**
- Muse Spark 1.3: structured extraction of balance terms with citations, and a tool-calling
  agent over six tools (product registry, balance calculation, analysis of net imports, department rice yield, ranking, verified
  extraction).
- Muse Spark vision + SAM 3.1: Spark proposes concepts from a Sentinel-2 image and reformulates when SAM
  returns nothing (3 rounds, 23 concepts, 3 matches: two river names and one coarse green belt); masks decoded with the official
  parser, areas and WorldCover cross-checks computed by code. Shown as experimental.
- Design choice: the model never produces a displayed figure; it reads, routes and explains.

**What was built during the hackathon:** everything in the repository (Next.js app, balance
engine, extraction validator, agent and its verification, FAOSTAT pipeline and backtest, replay
mode, regional map, tests). The earlier concept notes in `docs/` are planning documents, not
product code.

**Honest limitations:** there is no published forecast. On 53 one-year-ahead tests, the model chosen by a
rule fixed in advance does not beat persistence, and a rolling selection gives the same answer; an
exponential-growth model does better (0.82 times the error on the second half) but no rule based on the past
chooses it, so it is not claimed. A first analysis on 14 years published a forecast and was withdrawn once the
long series was tested. The reference range published instead covered 25 of 33 years at a stated 80% (95%
interval 59 to 87%): compatible, no more. The target is net imports, not an availability gap (the observed
balance closes by construction). The two FAO series differ by a factor of 1.499 on the common years, very
probably paddy against milled equivalent, not confirmed in FAO documentation. Calendar years, not marketing
years. Only FAOSTAT and Sentinel-2 data are connected (USDA PSD and ANSD are not); rainfall and a MODIS NDVI test were run on department yields (no demonstrated gain; NDVI inconclusive); satellite
indices are descriptive and validated against nothing; no regional balances; the Spark+SAM loop matched only river names (no rice-parcel mask), results vary between runs;
extraction from pasted text is labelled as user-provided.

**Tech stack:** Next.js, React, TypeScript, Meta Model API (Muse Spark 1.3 text and vision, SAM 3.1), meta-sam-parser, Vitest.
Data: FAOSTAT Food Balances (CC BY 4.0), geoBoundaries (CC BY 3.0 IGO), Sentinel-2 (Copernicus,
via Planetary Computer).

**Repository:** (public GitHub link, to add)  **License:** (to choose and add)  **Video:** (link, to add)

## 4. Liste de contrôle avant envoi (heure limite : 4 novembre, 21:00 ET)

- [ ] Licence open source choisie et ajoutée au dépôt
- [ ] Dépôt public créé ; `.env.local` absent de l'historique (`git status` avant le premier commit)
- [ ] Clé régénérée si elle a pu être exposée
- [ ] Tous les membres de l'équipe listés sur la page de soumission
- [ ] Vidéo de 3 minutes accessible sans connexion ; lien testé dans une fenêtre privée
- [ ] README relu depuis un clone propre (`npm install`, `npm test`, `npm run dev`)
- [ ] Crédits Meta réclamés avant la limite (chaque participant les réclame lui-même)
- [ ] Soumission envoyée en avance et confirmation reçue
