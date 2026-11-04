# Données et sources

## faostat-fbs-senegal-rice.csv

Bilan du riz du Sénégal, 2010 à 2023 (14 années civiles), extrait de FAOSTAT.

- **Source :** FAOSTAT, domaine « Food Balances (2010-) », produit « Rice and products »
  (code 2807), zone Sénégal (code 195).
- **Fichier d'origine :** https://bulks-faostat.fao.org/production/FoodBalanceSheets_E_Africa.zip
  (4 003 904 octets, dernière modification du serveur : 28 octobre 2025, SHA-256
  `4b14eafa2572ecaa3d02ffb5cbf030c7de0bda271b770d7f4d3ae44d378cd64f`).
- **Récupéré le :** 3 novembre 2026.
- **Licence :** CC BY 4.0 (conditions : https://www.fao.org/contact-us/terms/db-terms-of-use/en/).
- **Citation requise :** « FAO. 2025. FAOSTAT: Food Balances (2010-). Accessed on 3 November 2026.
  https://www.fao.org/faostat/en/#data/FBS Licence: CC-BY-4.0. »
- **Modifications :** sélection du riz du Sénégal et de 12 éléments du bilan, mise en forme
  longue ; les valeurs ne sont pas modifiées. La FAO n'a ni cautionné ni approuvé cet usage.
- **Vérifier avant d'extraire :** `sha256sum FoodBalanceSheets_E_Africa.zip` doit donner l'empreinte ci-dessus.
  Extraire avec un outil standard, dans un dossier à part, hors du dépôt.
- **Reproduire :** télécharger le fichier, l'extraire, puis
  `node scripts/build-faostat-csv.mjs <FoodBalanceSheets_E_Africa_NOFLAG.csv> 2026-11-03`.

### Ce qui a été vérifié sur ces données

- Unités : toutes en milliers de tonnes (1000 t).
- Années : **années civiles**, pas campagnes commerciales.
- Identité du bilan, vérifiée sur les 14 années à 1 kt près (arrondis) :
  `offre intérieure = production + importations - exportations - variation de stocks`
  (variation de stocks positive = hausse des stocks), et `offre intérieure` = somme des
  utilisations (alimentation, alimentation animale, semences, pertes, transformation, autres
  usages, résiduel).
- Le sens du signe de la variation de stocks est déduit de cette identité vérifiée sur les
  données ; il n'a pas été confronté à la documentation méthodologique de la FAO.
- **Rupture possible, non vérifiée :** l'alimentation animale passe de 68 kt (2018) à 493 kt (2019)
  puis 960 kt (2023). Cela ressemble à une imputation ou à une révision de méthode de la FAO.
  Les importations nettes ne s'en déduisent pas directement, mais l'année 2019 peut être touchée.
- Conséquence : sur des données observées, l'« écart » du moteur de bilan vaut zéro par
  construction. Ce qui peut être prévu, ce sont les importations nettes.
- Le fichier historique (1961-2013) utilise une autre nomenclature et une autre unité : voir plus bas.

## faostat-fbs-senegal-rice-historic.csv

Production, importations et exportations du riz du Sénégal, 1961 à 2013 (53 années civiles), ancienne
nomenclature « Rice (Milled Equivalent) » (code 2805).

- **Fichier d'origine :** https://bulks-faostat.fao.org/production/FoodBalanceSheetsHistoric_E_Africa.zip
  (5 053 805 octets, dernière modification du serveur : 18 avril 2024, SHA-256
  `8da6b71ca3eed1fd5c85a65ef68d158922e09ca4f7f756049cbe7065694d517b`). Récupéré le 3 novembre 2026.
- **Licence et citation :** CC BY 4.0. « FAO. 2024. FAOSTAT: Food Balances (to 2013, old methodology).
  Accessed on 3 November 2026. https://www.fao.org/faostat/en/#data/FBS Licence: CC-BY-4.0. »
- **Reproduire :** `node scripts/build-faostat-historic-csv.mjs <FoodBalanceSheetsHistoric_E_Africa_NOFLAG.csv> 2026-11-03`.
- **Unité, constat mesuré :** sur les 4 années communes avec la série récente (2010-2013), la série
  récente vaut 1,499 fois l'ancienne chaque année (rapports 1,4992 / 1,4986 / 1,4984 / 1,4990), pour les
  importations, les exportations et la production. C'est le facteur usuel entre riz paddy et riz usiné :
  la série récente est très probablement en équivalent paddy. **Non confirmé** dans la documentation FAO
  consultée. L'épissage multiplie l'ancienne série par ce facteur mesuré et est refusé si le rapport
  n'est pas stable à 1 % près.
- **Limites :** l'ancienne méthode ne déclare pas de variation de stocks (zéro sur toute la période) ; les
  populations des deux fichiers diffèrent de 2 à 3 % sur 2010-2013 (révisions) et ne sont pas utilisées.

## Autres sources

USDA PSD et ANSD sont identifiées mais pas extraites. L'API FAOSTAT exige un jeton
d'authentification : seul le téléchargement public en masse a été utilisé.

## Règles

Avant d'ajouter un jeu de données, consigner son organisme producteur, URL, licence,
date de collecte, couverture, unité, limites et méthode d'harmonisation. Marquer chaque
fixture comme `demo` ou `synthetic` tant que son statut officiel n'a pas été vérifié. Ne pas
placer de données privées ici : elles restent dans `data/private/`, ignoré par Git.
