# Estimation du rendement du riz par département : premier test (pluie seule)

Produit par `scripts/build-eaa-rice-departments.mjs`, `scripts/chirps-departments.py` puis
`scripts/yield-backtest.py`. Chiffres complets dans `yield-backtest.json`.

## Protocole (fixé avant les tests de modèle ; l'exclusion de 2021 et la liste des départements du nord ont été décidées après avoir vu la source, pas après avoir vu les résultats des modèles)

- Vérité terrain : tableau EAA (DAPSA), riz, département, 2017-2025. Rendement recalculé = production / surface
  (la colonne source est cassée en 2025). **2021 écartée** : les surfaces irriguées y sont effondrées dans la source
  (Dagana : 775 ha au lieu d'environ 50 000).
- Départements retenus : au moins 7 années valides sur 8 et surface moyenne d'au moins 1 000 ha : 21 départements,
  163 cellules département-année.
- Prédicteur : pluie CHIRPS v3.0 cumulée de juin à octobre, moyenne sur le département.
- Validation : on retire une année entière et on la prédit (8 tours). Erreur = écart absolu sur le log du
  rendement (erreur relative). Intervalles : bootstrap sur les années, 90 %.

## Résultats

| Modèle | Erreur relative moyenne |
|---|---|
| A. moyenne du département | 17,4 % |
| B. tendance linéaire du département | 17,4 % |
| C. moyenne + pluie (pente commune) | 17,4 % |
| D. moyenne + pluie (pente distincte nord irrigué / sud pluvial) | 16,9 % |

Rapport d'erreur à la moyenne du département (inférieur à 1 = mieux) :

- Ensemble, modèle D : 0,975 (intervalle 0,93 à 1,03) : **pas de gain démontré**.
- Sud pluvial (18 départements), pluie : 0,968 (0,945 à 0,991) : **gain d'environ 3 %, faible mais dont l'intervalle
  exclut 1**. Corrélation résiduelle pluie/rendement : 0,29.
- Nord irrigué (Dagana, Podor, Matam seulement : les autres départements du nord n'ont pas assez d'années), pente
  commune : 1,49 (1,22 à 1,74) : **la pluie dégrade l'estimation**. Normal : ce riz est irrigué (SAED), le rendement
  ne dépend pas de la pluie locale ; la corrélation résiduelle y est même négative (-0,55, trois départements, 7 ans).

## Ce que cela autorise à dire

- Le rendement d'un département se prédit avec sa seule moyenne, avec une erreur moyenne d'environ 17 % (la bande à 80 % va de -28 % à +33 % au sud) ; la conclusion du nord repose sur 3 départements ; la pluie ne fait pas mieux de
  façon démontrée. Une part de cette erreur est du bruit de la source (beaucoup de valeurs rondes : 1 000, 1 500,
  2 000 kg/ha, qui ressemblent à des valeurs par défaut).
- Aucun résultat sur la production en tonnes : la surface n'est pas encore modélisée.
- L'indice de végétation satellite par département a été testé ensuite : résultat non concluant (voir plus bas).
- 8 années de vérité terrain, dont des cellules douteuses : toute conclusion plus fine serait du bruit.

# Deuxième test : NDVI MODIS des surfaces cultivées (non concluant)

Scripts : `scripts/modis-ndvi-departments.py`, `scripts/yield-backtest-ndvi.py`. Résultats : `yield-backtest-ndvi.json`.
NDVI MOD13Q1 (250 m, tuile h16v07, Planetary Computer), moyenné sur les cellules dont la part de cultures
(ESA WorldCover 2021, toutes cultures confondues, **pas seulement le riz**) atteint 50 %. Prédicteur principal fixé
d'avance : pic de NDVI de la campagne. Variante de contrôle : NDVI moyen d'août à octobre.

## Pourquoi ce test ne conclut pas

- **Trop peu de pixels valides en saison des pluies.** Avec la fiabilité « bonne » exigée, il reste par exemple
  11 à 119 pixels sur 6 335 à Kolda pour les composites de juillet à septembre. Le « pic » est donc mesuré surtout
  en début ou en fin de saison.
- **2025 est absente** (2 composites seulement dans le catalogue) et 2024 incomplète.
- Résultat : l'échantillon passe de 163 à 88 cas (7 campagnes), ce qui n'est plus comparable au test sur la pluie
  (l'erreur de la moyenne y monte à 28 % au sud).

## Ce qui a été mesuré (sud pluvial, 68 cas, 18 départements)

| Prédicteur | Rapport d'erreur à la moyenne (intervalle 90 %) | Lecture |
|---|---|---|
| Pic de NDVI (principal) | 0,93 (0,86 à 1,07) | pas de gain démontré |
| NDVI moyen août-octobre (contrôle) | 0,85 (0,77 à 0,99) | l'intervalle exclut 1, mais c'est une variante, testée parmi quatre : **non revendiqué** |
| Pluie | 0,97 (0,95 à 0,995) | gain faible |

Corrélations résiduelles au sud : 0,53 (pic) et 0,54 (août-octobre), contre 0,23 pour la pluie. Le signal existe
peut-être, mais sur 88 cas et avec des pixels majoritairement masqués, on ne peut pas l'affirmer. Au nord irrigué
(3 départements), le NDVI ne fait pas mieux que la moyenne : le riz y est irrigué en contre-saison, hors de la
fenêtre mesurée et sur des surfaces que le masque « cultures » ne sépare pas.

## Suite possible (non faite, pour ne pas ajuster le protocole sur les résultats)

Réextraire avec la fiabilité « marginale » acceptée et une fenêtre d'août à octobre, ou utiliser le radar
Sentinel-1 (insensible aux nuages), puis refaire le test avec une règle annoncée avant de regarder.
