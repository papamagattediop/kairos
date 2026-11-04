# Note d'avancement — Données rizicole et prévision

## Ce qui a été fait
- Audit exploratoire des sources (USDA PSD, FAOSTAT, ANSD) documenté dans
  `docs/research/FEASIBILITE-DONNEES-PREVISIONS.md`.
- Graphify du projet reconstruit (`graphify-out/` : 337 nœuds, 339 arêtes, 26 communautés).
- Recherche officielle des accès :
  - FAOSTAT FBS : item 2807 « Rice and products », area 195 Sénégal, éléments dont
    Stock Variation (5072, 1000 t), 2010–2023 (14 campagnes), API sans auth.
  - USDA PSD : données depuis ~1960, API `api.data.gov` (clé gratuite), unités
    1000 t, consommation domestique.
  - ANSD : rapports PDF (NACE, bulletins), pas d'API machine-readable.

## Ce qui est prévu
- Créer un CSV versionné (`data/sources/`) avec colonnes source, source_url,
  retrieved_at, product, element, marketing_year, value, unit, definition,
  revision, license.
- Extraire et harmoniser les séries des trois sources, aligner années civiles et
  campagnes commerciales.
- Mesurer le nombre réel de campagnes communes et le backtest (baseline vs
  modèle simple, couverture d'intervalle).
- Publier la prévision calibrée seulement si l'historique le justifie, sinon
  afficher le refus et corriger le pitch/dashboard.
- Mettre à jour `docs/research/FEASIBILITE-DONNEES-PREVISIONS.md` et les
  documents de pilotage au fur et à mesure.
