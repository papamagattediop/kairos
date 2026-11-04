# Suivi et état d'avancement - KAIROS

**Dernière mise à jour :** 3 novembre 2026  
**Statut global :** cible de prévision clarifiée; prototype local de scénario
construit et vérifié; historique harmonisé et modèle de prévision non
disponibles.

## Tableau de bord

| Lot | État | Preuve / prochain pas |
|---|---|---|
| Projet et produit | Défini | KAIROS (ex-CONTOUR), riz en MVP puis produits les plus consommés par niveau de maturité; écart de disponibilité recalculé à chaque nouvelle donnée. |
| Incertitude | Définie | Chaque prévision publiée doit avoir un intervalle de prévision évalué par backtest. |
| Stack | Définie | JavaScript sur Node.js, Next.js/React avec TypeScript. |
| Inventaire et rangement des supports | Terminé | Documents classés dans `docs/`, decks dans `assets/`; les originaux sont conservés. |
| Plan, mémoire et corrections | Terminés | Documents disponibles dans `docs/management/`. |
| Architecture préparatoire | Créée | [ARCHITECTURE.md](../ARCHITECTURE.md); structure cible et responsabilités. |
| Scaffold / prototype interface | En cours | Page locale et calculateur de scénario préparatoire créés. Ce calculateur ne fait pas de prévision et les chiffres d'exemple sont fictifs. |
| Données historiques et sources | Bloqué | L'audit exploratoire de [faisabilité](../research/FEASIBILITE-DONNEES-PREVISIONS.md) ne confirme aucun historique rizicole harmonisé prêt à entraîner/évaluer. FAOSTAT, USDA PSD et ANSD restent à extraire et vérifier. |
| Baseline et prévision statistique | Non commencé | À développer après l'audit et la décision sur la quantité d'historique exploitable. |
| Intervalle de prévision | Non commencé | À calibrer à partir des erreurs hors-échantillon et de sa couverture mesurée. |
| Dashboard final | À faire | Remplacer le scénario par l'écart prévu, l'intervalle, l'horizon, les sources, le backtest et le refus. |
| API de données | Non connectée | Aucune source/API statistique n'est branchée dans le projet. |
| API Meta | Non connectée | Muse Spark est facultatif et séparé des sources de données; l'accès doit être vérifié. |
| Crédits Meta | Signalés par le porteur | Solde affiché : 150 USD; pas de moyen de paiement ajouté. L'avis Meta indique qu'il en faut un pour appeler l'API et que les contenus sous crédits gratuits peuvent servir à l'amélioration produit. |
| Dépendances et tests du prototype | Vérifiés | Installation npm réussie; 4 tests unitaires passent; `tsc --noEmit` passe; build Next.js passe. Cela valide le prototype scénario uniquement, pas une prévision. |
| Dépôt GitHub public | Non créé | GitHub CLI n'est pas authentifié dans l'environnement vérifié. |
| Licence open source | À choisir | L'annonce indique qu'un dépôt open source est obligatoire. |
| Vidéo et soumission | À faire | Échéance annoncée : 4 nov. 2026, 21:00 ET; confirmer dans le portail officiel. |

## Prochaine tranche de travail

1. Obtenir et examiner un export officiel USDA PSD du bilan rizicole du
   Sénégal, en parallèle de l'export FAOSTAT.
2. Construire un tableau des années/campagnes disponibles, données manquantes,
   révisions, unités, définitions et conditions d'utilisation.
3. Décider si l'historique permet une prévision et une validation honnêtes.
4. Si oui : établir une baseline, un backtest temporel et l'intervalle. Sinon :
   afficher un refus et réduire la promesse, sans inventer des résultats.
5. Remplacer le prototype de scénario; installer les dépendances et lancer les
   vérifications.
6. Choisir une licence, créer le dépôt public, enregistrer la démonstration et
   soumettre après contrôle.

## Journal des mises à jour

| Date | Mise à jour |
|---|---|
| 2026-11-03 | Concept CONTOUR confirmé; quatre documents de pilotage créés et supports rangés. Le porteur précise : riz uniquement, vraie prévision, intervalle de prévision, JavaScript/Node.js. Dépendances installées; tests, vérification TypeScript et build passent pour le prototype de scénario, qui ne prédit toujours rien. |
| 2026-11-03 | Recherche exploratoire des sources : aucun historique harmonisé validé; rapport d'audit ajouté. Prochaine étape bloquante : obtenir les séries primaires et décider si un backtest/calibrage est faisable. |
| 2026-11-03 | Relecture du guide du hackathon : le pilotage rendait Meta facultatif, ce qui ne respecte pas le règlement (Stage One). Nom KAIROS retenu. Architecture réécrite ([ARCHITECTURE.md](../ARCHITECTURE.md)) : carte, agent Spark, estimation par segmentation SAM (sous réserve d'un test), registre de produits. Le plan détaillé et le code ne sont pas encore alignés. |

