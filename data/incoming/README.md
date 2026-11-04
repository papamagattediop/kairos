# Données brutes téléchargées (voir MANIFEST.md)

**État au 3 novembre 2026.** Téléchargés automatiquement, avec taille vérifiée et SHA-256 dans `MANIFEST.md` :
`eaa/` (tableau EAA complet du portail Open Data : 16 828 valeurs, 10 cultures, 2010-2025, régions et
départements), `chirps-v3/` (120 mois), `worldcover-2021/` (6 tuiles), `deafrica-cropmask-2019/` (50 tuiles ;
6 emplacements existent en deux produits, `sahel_` et `western_`), `faostat-*`, `usda-psd/`, `wfp-*`,
`geoboundaries-adm2*`.

**Non obtenus :** microdonnées ANSD (`anads/`, accès sous licence, demande à faire par le porteur) ; rapports PDF
DAPSA (les adresses répondent 404, y compris dans un vrai navigateur).

**Pièges du tableau EAA (à traiter avant tout calcul) :**
- Le rendement 2025 est dans une autre unité (national : 100 254 au lieu de ~3 700) : recalculer
  rendement = production / surface, ne pas utiliser la colonne.
- 2021 est aberrant pour plusieurs régions (Saint-Louis : 2 375 ha et 8 869 t, alors que le national est normal).
- Dagana et Podor n'existent qu'au niveau département ; 43 départements au total, pas 45.
- Le national EAA du riz (1,53 Mt en 2023) est de l'ordre du paddy, ce qui va dans le sens de l'hypothèse sur
  l'unité FAOSTAT, sans la prouver.

# Guide initial : données à déposer à la main

Ce dossier reçoit les fichiers bruts téléchargés par le porteur. Ils ne sont **pas versionnés** (voir
`.gitignore`) : certains sont sous licence d'accès (microdonnées ANSD) et d'autres sont volumineux.
Les tableaux dérivés, avec leur provenance, sont écrits dans `data/sources/`.

## Priorité 1 : la vérité terrain (rendements, surfaces, productions)

| Sous-dossier | Quoi | Où le prendre | Format |
|---|---|---|---|
| `eaa/` | Tableaux de l'Enquête Agricole Annuelle (DAPSA) : superficie (ha), production (t), rendement (kg/ha), **par culture, par département et par région**, 2017 à 2023, plus 2024-25 | https://senegal.opendataforafrica.org/data/#topic=Agriculture et https://senegal.opendataforafrica.org/gallery?tag=DAPSA (métadonnées : https://senegal.opendataforafrica.org/nvsjitb) | Excel ou CSV (séparateur point-virgule), bouton de téléchargement du tableau |
| `eaa/rapports/` | Rapports PDF de l'EAA (méthodologie, qualité, cartes) | https://www.dapsa.gouv.sn/content/rapporteaa-20222023 · https://www.dapsa.gouv.sn/content/rapport-eaa-2021-2022 · https://www.dapsa.gouv.sn/sites/default/files/publications/Rapport%20EAA%202020-2021_finale.pdf · https://www.dapsa.gouv.sn/content/rapport-final-eaa-2019-2020 · https://www.dapsa.gouv.sn/content/rapport-final-eaa-2018-2019 · https://anads.ansd.sn/index.php/catalog/185/related-materials | PDF |
| `anads/` | **Microdonnées parcelle** (rendements mesurés par carré de rendement, superficies, géolocalisation), un fichier par campagne. **Accès sous licence : une demande est nécessaire** | https://anads.ansd.sn/index.php/catalog/351 (2024-25) · /290 (2022-23) · /272 (2021-22) · /241 (2020-21) · /234 (2019-20) · /218 (2018-19) · /185 (2017-18). Copie Banque mondiale 2022-23 : https://microdata.worldbank.org/index.php/catalog/6387 | Zip (Stata, SPSS ou CSV) |

Important sur ces données : la campagne agricole va de **juin de l'année n à mai de l'année n+1** (la
campagne « 2018 » couvre juin 2018 à mai 2019). Les rendements et superficies du **riz irrigué** viennent de
la SAED et de la SODAGRI (données administratives), pas de l'enquête auprès des ménages. Pour les autres
cultures, le rendement vient de carrés de rendement posés sur un échantillon de parcelles, et la production
est le produit de la superficie par le rendement moyen du département.

## Priorité 2 : le climat

| Sous-dossier | Quoi | Où le prendre | Taille |
|---|---|---|---|
| `chirps/` | Pluie mensuelle CHIRPS v3.0, Afrique | https://data.chc.ucsb.edu/products/CHIRPS/v3.0/monthly/africa/tifs/ (fichiers `chirps-v3.0.AAAA.MM.tif`) ; script : `scripts/download-chirps.ps1` | environ 4,8 Mo par mois, 120 mois = environ 580 Mo |

## Priorité 3 : recoupements et prix

| Sous-dossier | Quoi | Où le prendre | Taille |
|---|---|---|---|
| `faostat/` | Production, surfaces récoltées et rendements nationaux par culture, 1961 à 2023 | https://bulks-faostat.fao.org/production/Production_Crops_Livestock_E_Africa.zip | 4,3 Mo |
| `usda/` | USDA PSD céréales : surface, rendement, production, stocks, consommation par campagne commerciale | https://apps.fas.usda.gov/psdonline/downloads/psd_grains_pulses_csv.zip | 2,9 Mo |
| `wfp/` | Prix mensuels des marchés (WFP) | https://data.humdata.org/dataset/wfp-food-prices-for-senegal (bouton Télécharger du CSV) | petit |

Les adresses FAOSTAT, USDA et CHIRPS ont été vérifiées par une requête d'en-tête (réponse 200, taille
indiquée). Les adresses ANSD, DAPSA et du portail Open Data n'ont pas pu être testées par téléchargement :
ce sont des pages à ouvrir dans un navigateur.

## Ce qui est calculé sans que vous ayez rien à télécharger

Les images Sentinel-2 (indice de végétation, eau) sont calculées côté serveur par l'API de Microsoft
Planetary Computer, comme pour les panneaux déjà dans l'application. L'occupation du sol ESA WorldCover
aussi. Seuls les fichiers ci-dessus doivent être déposés à la main.

## Cartes (limites et occupation du sol)

Pour relier les rendements officiels (par département) aux images satellite, il faut les contours des
**45 départements**, puis un masque de cultures pour ne mesurer l'indice de végétation que sur les champs.

| Sous-dossier | Quoi | Où le prendre | Taille |
|---|---|---|---|
| `limites/` | **Départements du Sénégal (45 unités, ADM2)**, version simplifiée, licence CC BY 3.0 IGO (déjà utilisée pour les régions) | https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/SEN/ADM2/geoBoundaries-SEN-ADM2_simplified.geojson (version complète : même dossier, `geoBoundaries-SEN-ADM2.geojson`) | petit |
| `limites/` | Alternative officielle OCHA (page à ouvrir dans un navigateur, la requête automatique n'a pas abouti) | https://data.humdata.org/dataset/cod-ab-sen | petit |
| `occupation_sol/` | **ESA WorldCover 2021, 10 m**, classe 40 = cultures. Pour la vallée du fleuve, **une seule tuile suffit : N15W018** | https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_N15W018_Map.tif | 41,5 Mo |
| `occupation_sol/` | Pour tout le pays, les 5 autres tuiles (même modèle d'adresse) : `N12W018` 80,1 Mo, `N12W015` 147,2 Mo, `N12W012` 164,6 Mo, `N15W015` 99,0 Mo, `N15W012` 75,9 Mo | `https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_<TUILE>_Map.tif` | environ 608 Mo au total |
| `occupation_sol/` | **Masque de cultures 2019 de Digital Earth Africa, 10 m** (CC BY 4.0), modèle d'apprentissage entraîné sur des relevés de terrain africains. Exclut les cultures pérennes et les pâturages | Explorateur : https://explorer.digitalearth.africa/products/crop_mask · Catalogue : https://explorer.digitalearth.africa/stac/collections/crop_mask · Accès direct sans compte : `aws s3 ls --region af-south-1 --no-sign-request s3://deafrica-services/crop_mask/` | non vérifiée |

Ce que ces cartes ne font pas : aucune ne distingue le riz des autres cultures. Les deux masques (WorldCover 2021,
Digital Earth Africa 2019) donnent des surfaces cultivées à des dates différentes, qui peuvent différer de la
campagne étudiée. Aucune couche publique de contours des **périmètres irrigués rizicoles** n'a été trouvée : la SAED
(https://saed.sn/) les gère, et il faudrait lui en faire la demande. À défaut, on peut les repérer par satellite
(surface en eau et verdissement en contre-saison), avec les réserves que cela suppose.

## Images satellite : rien à télécharger

Les séries Sentinel-2 (indice de végétation, eau) restent calculées côté serveur par l'API de Planetary
Computer. Si vous préférez les images brutes, le navigateur officiel est
https://browser.dataspace.copernicus.eu/ (Copernicus Data Space), mais c'est volumineux et inutile pour ce
qui est prévu.
