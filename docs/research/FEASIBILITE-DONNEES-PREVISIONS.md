# Faisabilité des données pour prévoir l'écart rizicole

**Vérification exploratoire :** 3 novembre 2026  
**Décision à cette date :** faisabilité non démontrée; ne pas publier de
prévision numérique avant d'avoir obtenu et harmonisé les séries sources.

## Résumé

Le dossier projet ne contient aucune série statistique exploitable. Un examen
exploratoire des portails publics n'a pas confirmé un historique sénégalais
harmonisé et prêt à l'emploi pour calculer l'écart de disponibilité du riz.
Les données FAOSTAT et USDA PSD sont des pistes à extraire et examiner, mais
leur disponibilité exacte, leurs définitions, leurs unités et leurs années
communes ne sont pas encore validées.

**Conclusion pour le MVP :** impossible, à ce stade, de promettre une
prévision défendable de l'écart de la prochaine campagne avec un intervalle
calibré. La prochaine étape est un test d'accès et d'extraction des sources
primaires, avant tout développement du modèle. Si le test échoue, le produit
doit afficher le refus et ne pas fabriquer une prévision.

## Sources examinées

| Source | Pistes | Ce qui reste à confirmer |
|---|---|---|
| FAOSTAT Food Balances | [Portail FBS](https://www.fao.org/faostat/en/#data/FBS). Le jeu « Food Balances (2010-) » est identifié comme une série annuelle potentielle; éléments de bilan susceptibles d'inclure production, importations, exportations, variation de stocks et disponibilités. | La réponse API candidate vers `fenixservices.fao.org` n'a pas pu être obtenue pendant la vérification. Il faut récupérer les lignes du Sénégal et vérifier l'année la plus récente, le produit exact (« Rice and products »), les éléments, les unités et le signe de variation des stocks. La disponibilité d'une série historique antérieure comparable n'est pas confirmée. |
| USDA FAS Production, Supply and Distribution (PSD) | [PSD Online](https://apps.fas.usda.gov/psdonline/app/index.html#/app/home). Le cadre annuel de bilan est candidat pour production, importations, exportations, consommation, stocks d'ouverture et de clôture. Les années PSD sont des années commerciales. | Le nombre d'années disponibles pour le riz du Sénégal, les unités, la définition exacte de consommation et les conditions de réutilisation n'ont pas été confirmés. Un point d'accès client testé n'a pas renvoyé d'extraction exploitable; le CSV de masse essayé a renvoyé 404. |
| USDA GAIN | [Recherche GAIN](https://gain.fas.usda.gov/#/search). Les rapports pays peuvent documenter contexte et définitions. | Des rapports sont narratifs et ne constituent pas une série machine-readable continue. La couverture des campagnes et la licence d'extraction n'ont pas été établies. |
| ANSD | [Portail ANSD](https://www.ansd.sn/), publications et indicateurs. | Aucune API ou série de bilan rizicole nationale continue combinant usage, production, commerce et stocks n'a été vérifiée. Le lien ODI(N) testé n'a pas permis de confirmer les lignes, années ou conditions de réutilisation. |

Les indications de cette table reflètent une recherche préliminaire, pas une
validation complète des portails. Une erreur HTTP ou l'indisponibilité d'une
page ne prouve pas l'absence de données; l'export officiel peut nécessiter un
téléchargement via l'interface.

## Pourquoi l'intervalle de prévision est le verrou

Le nombre d'années réellement utilisables dépendra de l'intersection des
séries après harmonisation. Même si FAOSTAT fournit des observations annuelles
depuis 2010 et si PSD en contient davantage, chaque prévision historique
hors-échantillon nécessite d'entraîner le modèle uniquement sur les années
antérieures. Quelques campagnes communes ne suffisent pas automatiquement à
estimer une couverture fiable d'intervalle 80 % ou 95 %.

Avant d'afficher un intervalle, il faut :

1. fixer la définition de chaque terme du bilan et les conversions d'unité;
2. aligner années civiles et années commerciales, sans décalage d'une campagne;
3. documenter les révisions et valeurs manquantes;
4. comparer une baseline (par exemple dernière campagne disponible) et un
   modèle simple en validation à origine glissante;
5. mesurer l'erreur hors-échantillon et la couverture de l'intervalle;
6. retenir la prévision si sa méthode est justifiée, sinon afficher le refus.

Une série annuelle, même exploitable, ne justifie pas une date précise dans
l'année pour le franchissement d'un seuil.

## Test de faisabilité à réaliser

Créer un CSV de travail versionné ou archivé avec les colonnes :

`source, source_url, retrieved_at, product, element, marketing_year, value,
unit, definition, revision, license`

Le test est réussi uniquement si les données permettent de produire plusieurs
campagnes consécutives avec une définition cohérente des termes nécessaires,
et si la provenance et le droit de réutilisation sont vérifiables. Publier le
nombre réel d'observations communes et la plage de dates; ne pas le deviner.

## Décision de repli

Si l'historique annuel du bilan est trop court pour un backtest et la
calibration :

- ne pas présenter un calculateur déterministe comme une prédiction;
- ne pas utiliser l'IA générative pour compléter les années manquantes;
- soit garder le ticket « prévision indisponible » et expliquer la donnée
  manquante, soit demander explicitement au porteur d'approuver une autre cible
  disposant d'un historique mensuel réellement vérifié;
- corriger le pitch et le dashboard si la cible change.

## Mise à jour — intégration des trois sources
Les trois sources (USDA PSD, FAOSTAT, ANSD) sont désormais retenues dès le
départ pour croiser et fiabiliser l'historique. Voir `note.md` à la racine.

## Fichiers projet contrôlés

Le répertoire `data/` du projet ne contient pas de série d'entrée : `data/demo/`
ne possède qu'un fichier `.gitkeep`, et `data/sources/` contient seulement des
instructions. Les PDF/PPTX/HTML sont des supports de présentation, pas des
données d'entraînement ou de validation.

