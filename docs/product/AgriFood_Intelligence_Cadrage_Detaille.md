# AgriFood Intelligence

## Document de cadrage produit et vision à long terme

**Version :** 1.0\
**Date :** octobre 2026\
**Marché initial :** Sénégal\
**Objet :** vision produit, périmètre fonctionnel, données,
architecture, validation et feuille de route.

------------------------------------------------------------------------

## 1. Résumé exécutif

**AgriFood Intelligence** est une plateforme d'intelligence agricole et
agroalimentaire qui transforme des données géospatiales, satellitaires,
climatiques, agronomiques, économiques et opérationnelles en
informations utiles à la décision.

À terme, elle ambitionne de couvrir toute la chaîne de valeur : cultures
vivrières, horticulture, arboriculture, cultures commerciales, élevage,
pêche et aquaculture, produits forestiers pertinents et produits
transformés. Cette couverture est une vision de long terme, pas une
promesse de suivi immédiat de tous les produits. Chaque filière devra
être intégrée progressivement, selon la disponibilité des données, la
possibilité de valider les résultats sur le terrain et l'existence d'un
besoin utilisateur réel.

La plateforme doit permettre de mieux comprendre où se situent les zones
de production, comment les cultures évoluent, quels risques sont
observés, quels volumes peuvent être envisagés, comment les prix varient
et comment mieux planifier la collecte, la transformation et la
distribution.

Les images satellitaires, notamment Sentinel-1 et Sentinel-2 lorsque
leur pertinence est confirmée, peuvent contribuer à observer la
végétation, les changements de surface et certains phénomènes
agroclimatiques. Elles ne permettent pas, à elles seules, de connaître
avec certitude toutes les cultures, les rendements, les stocks ou les
volumes effectivement commercialisés. Les estimations devront être
accompagnées de leur date, de leurs limites et d'un niveau de confiance,
puis validées avec des données de référence.

**Positionnement :** AgriFood Intelligence n'est pas seulement une carte
agricole. C'est un système d'aide à la décision reliant territoire,
production, risques, marchés et logistique.

------------------------------------------------------------------------

## 2. Vision, mission et valeur proposée

### Vision

Devenir une infrastructure de référence pour l'intelligence agricole et
agroalimentaire au Sénégal, puis dans d'autres marchés d'Afrique de
l'Ouest.

### Mission

Rendre les données agricoles plus accessibles, comparables et
exploitables par les personnes qui doivent décider quoi produire, où
investir, quand acheter, comment approvisionner, financer, transformer
et gérer les risques.

### Utilisateurs et décisions soutenues

-   **Producteurs :** comprendre l'évolution de leurs parcelles et les
    risques à surveiller.
-   **Coopératives :** suivre les zones de production, accompagner leurs
    membres et préparer la collecte.
-   **Acheteurs et agrégateurs :** repérer les bassins de production et
    planifier les achats.
-   **Transformateurs :** anticiper l'approvisionnement et les risques
    de rupture.
-   **Transporteurs et distributeurs :** organiser les flux et anticiper
    les contraintes logistiques.
-   **Institutions financières et assureurs :** compléter l'analyse des
    risques agricoles par des informations observables, sans automatiser
    les décisions de crédit ou d'indemnisation.
-   **Administrations et collectivités :** suivre les dynamiques
    agricoles et les risques à l'échelle territoriale.
-   **Investisseurs :** analyser les filières, les infrastructures et
    les zones à étudier.

### Principes directeurs

1.  Partir d'un problème concret et d'une décision réelle.
2.  Distinguer observation, estimation et prévision.
3.  Afficher les dates, sources, limites et incertitudes.
4.  Valider chaque méthode par zone, saison et filière.
5.  Concevoir une interface mobile, simple et compréhensible.
6.  Respecter les licences, la confidentialité et les droits sur les
    données.
7.  Ne pas présenter une estimation comme une garantie de rendement, de
    prix ou de disponibilité.
8.  Ne pas utiliser un modèle complexe si une méthode simple et robuste
    donne de meilleurs résultats.

------------------------------------------------------------------------

## 3. Problème et hypothèse centrale

Les données agricoles sont souvent dispersées, hétérogènes, irrégulières
ou difficiles à transformer en décisions opérationnelles. Les acteurs
peuvent manquer d'informations fiables sur les surfaces cultivées,
l'évolution des cultures, les aléas climatiques, les rendements
potentiels, les calendriers de récolte, les prix, les stocks, les pertes
après récolte et les besoins d'approvisionnement.

Le défi n'est donc pas seulement de collecter davantage de données. Il
est de les harmoniser, d'en documenter la qualité et de les relier à des
décisions utiles.

**Hypothèse à tester :** en combinant des observations géospatiales, des
données de terrain et des informations économiques, la plateforme peut
améliorer la planification agricole et commerciale. Cette valeur devra
être démontrée avec des utilisateurs pilotes, et non supposée à
l'avance.

------------------------------------------------------------------------

## 4. Catalogue des produits à couvrir à terme

Le catalogue ci-dessous définit le périmètre possible. Il ne signifie
pas que tous les produits peuvent être détectés ou quantifiés
automatiquement à partir de satellites.

### 4.1 Céréales et cultures vivrières

-   Mil
-   Sorgho
-   Maïs
-   Riz
-   Fonio et autres céréales pertinentes

**Indicateurs possibles :** zones cultivées estimées, évolution
saisonnière de la végétation, calendrier de campagne, estimation des
surfaces et, après validation, estimation de production.

### 4.2 Légumineuses et cultures oléagineuses

-   Arachide
-   Niébé
-   Haricot et autres légumineuses pertinentes
-   Sésame et autres cultures de diversification selon les données
    disponibles

**Indicateurs possibles :** surfaces estimées, évolution de la campagne,
exposition aux aléas et perspectives de collecte. L'identification de
cultures proches spectralement peut nécessiter des observations de
terrain.

### 4.3 Racines et tubercules

-   Manioc
-   Patate douce
-   Pomme de terre
-   Autres tubercules pertinents

**Indicateurs possibles :** localisation des bassins de production,
suivi saisonnier et estimation de disponibilité, à condition de disposer
de données de référence adaptées.

### 4.4 Horticulture et maraîchage

-   Oignon
-   Tomate
-   Carotte
-   Chou
-   Piment et poivron
-   Gombo
-   Aubergine et légumes locaux
-   Pastèque et melon
-   Autres produits maraîchers identifiés avec les producteurs

Les cycles courts, les petites parcelles, l'irrigation et les
successions de cultures rendent souvent le suivi plus complexe. La
plateforme devra afficher « données insuffisantes » plutôt que
d'affirmer une classification non validée.

### 4.5 Arboriculture et fruits

-   Mangue
-   Agrumes
-   Banane
-   Anacarde
-   Papaye
-   Autres fruits et cultures pérennes selon les zones

**Indicateurs possibles :** localisation des vergers, évolution du
couvert végétal, risques climatiques, périodes indicatives de récolte et
besoins de collecte. La distinction entre espèces peut demander des
données de terrain.

### 4.6 Cultures commerciales et industrielles

-   Canne à sucre
-   Coton, si les données et le cas d'usage le justifient
-   Autres cultures contractuelles ou industrielles
-   Cultures destinées à la transformation locale ou à l'exportation

**Indicateurs possibles :** bassins de production, évolution des
surfaces, planification de l'approvisionnement industriel et suivi de
campagne.

### 4.7 Élevage et ressources fourragères

-   Ressources fourragères et évolution de la végétation
-   Indicateurs de stress lié à la sécheresse
-   Zones de pâturage et points d'eau lorsque les données existent
-   Données de cheptel uniquement à partir de sources fiables et
    autorisées
-   Besoins d'alimentation et risques de rupture fourragère

Le satellite peut contribuer à observer la végétation, mais ne permet
pas de compter précisément les animaux dans toutes les conditions.

### 4.8 Pêche et aquaculture

Ce module nécessitera des sources et méthodes spécifiques, distinctes de
celles des cultures terrestres. Il pourra étudier les sites
d'aquaculture, les données de production déclarée, les débarquements,
les flux et les risques météorologiques à partir de sources
spécialisées. Les stocks de poissons et les captures réelles ne doivent
pas être déduits d'images satellitaires seules.

### 4.9 Produits forestiers et ressources naturelles

Des produits forestiers non ligneux ou ressources utiles à l'économie
rurale pourront être ajoutés si un besoin métier précis, des données de
référence et une méthode de validation existent.

### 4.10 Produits transformés et chaînes agroalimentaires

-   Riz transformé
-   Farines et semoules
-   Huile et produits dérivés de l'arachide
-   Produits horticoles transformés
-   Aliments pour bétail
-   Produits laitiers
-   Produits halieutiques transformés
-   Autres produits issus de la transformation locale

Le suivi de ces produits reposera surtout sur les données d'achat, de
transformation, de stock, de prix, de flux et de traçabilité, plutôt que
sur l'imagerie satellitaire.

### 4.11 Niveaux de maturité par produit

Chaque filière doit avoir un statut visible :

-   **Niveau 0 :** produit envisagé, données insuffisantes.
-   **Niveau 1 :** données secondaires identifiées, qualité à vérifier.
-   **Niveau 2 :** méthode testée sur un échantillon.
-   **Niveau 3 :** méthode validée sur le terrain dans une zone et une
    saison définies.
-   **Niveau 4 :** service opérationnel, actualisé et utilisé par des
    clients.

Une culture validée dans une région ne doit pas être présentée comme
validée dans tout le pays.

------------------------------------------------------------------------

## 5. Modules fonctionnels

### Module A. Cartographie agricole

Carte par région, département, commune et zone pilote ; couches de
cultures et de parcelles selon leur niveau de validation ; filtres par
produit, campagne, date et source ; métadonnées consultables ; exports
selon les droits d'accès.

### Module B. Suivi des campagnes

Séries temporelles d'indices de végétation tels que NDVI ou EVI lorsque
cela est adapté ; comparaison entre campagnes ; détection d'anomalies ;
suivi des changements ; alertes accompagnées d'une explication et d'un
niveau de confiance. Un indice de végétation ne prouve pas, à lui seul,
la présence d'une culture précise ou son rendement.

### Module C. Superficies et production

Estimation de surfaces par culture et zone ; estimation de volumes
uniquement lorsque les données de rendement et les méthodes sont
suffisantes ; comparaison avec les statistiques officielles et les
observations de terrain ; intervalles d'incertitude ; historique des
méthodes.

Il faut distinguer la surface cartographiée, la surface estimée, le
rendement mesuré, le rendement prédit et la production estimée. Une
production estimée n'est pas un stock disponible à la vente.

### Module D. Risques agroclimatiques

Suivi du déficit ou de l'excès de pluie, de la chaleur, du stress
hydrique, des inondations et des anomalies de végétation, selon les
données disponibles. Chaque alerte doit afficher sa source, sa date, sa
couverture et ses limites, et ne pas remplacer les conseils d'un
agronome.

### Module E. Marchés et prix

Prix par produit, marché, qualité, unité et date ; comparaison entre
marchés ; évolution temporelle ; périodes indicatives de disponibilité ;
volumes échangés lorsque connus ; alertes de variation inhabituelle. Les
unités et qualités doivent être harmonisées. La rentabilité exige aussi
de considérer le transport, les pertes, le stockage et les conditions de
paiement.

### Module F. Offre et demande

Profils vérifiés de coopératives, fournisseurs, acheteurs et
transformateurs ; annonces d'offre et de demande ; quantités, qualité,
période, zone, livraison et paiement ; statut de vérification ;
historique des transactions lorsque les parties l'acceptent. Une zone
estimée cultivée ne doit jamais être présentée comme une offre
commerciale confirmée.

### Module G. Approvisionnement et logistique

Bassins d'approvisionnement, calendrier prévisionnel, points de
collecte, infrastructures de stockage connues, itinéraires indicatifs,
planification des besoins de transport et suivi des quantités
collectées. Distinguer volumes estimés, déclarés, engagés, récoltés,
stockés et livrés.

### Module H. Traçabilité

Origine déclarée ou vérifiée, campagne, lot, quantité, qualité,
fournisseur, stockage, transformation et transport. Une déclaration non
vérifiée ne constitue pas une certification. Les données sensibles
doivent être partagées uniquement avec autorisation.

### Module I. Tableau de bord institutionnel

Indicateurs agrégés par territoire et filière, comparaison temporelle,
suivi des campagnes et risques, exports et documentation des sources.
Les données provisoires doivent être distinguées des statistiques
officielles.

### Module J. Assistant d'information agricole

Questions en langage naturel sur les données disponibles, leurs
tendances, leurs sources et leurs limites. L'assistant doit citer les
dates et sources, signaler les données absentes, différencier faits et
estimations et ne jamais inventer prix, volumes ou rendements. Les
langues prises en charge doivent être validées avec les utilisateurs.

------------------------------------------------------------------------

## 6. Données et sources à étudier

### 6.1 Satellite et géospatial

-   **Sentinel-2 :** observation optique de la végétation et des
    surfaces, avec des limites liées aux nuages et aux conditions
    d'observation.
-   **Sentinel-1 :** observation radar utile dans certaines conditions,
    notamment lorsque les nuages limitent l'optique, et pour des
    applications spécifiques selon la méthode.
-   Limites administratives, occupation du sol, réseau hydrographique et
    autres couches de référence dont la réutilisation est autorisée.
-   Autres sources ouvertes ou commerciales uniquement si leur
    résolution, licence et coût sont justifiés.

### 6.2 Météo et agroclimat

Précipitations, températures, variables de bilan hydrique si adaptées,
prévisions d'organismes identifiés et calendriers de campagne. Les
prévisions doivent être distinguées des observations historiques.

### 6.3 Terrain et données agricoles

Contours de parcelles avec autorisation, cultures déclarées, dates de
semis et récolte, variétés si pertinentes, observations agronomiques,
rendements d'échantillons, volumes collectés et données de coopératives.
Un protocole doit définir les unités, les champs obligatoires, les
contrôles et la responsabilité de la saisie.

### 6.4 Marchés et commerce

Bulletins de prix, statistiques officielles, données de marchés,
volumes, informations de transformation et données d'entreprises
partenaires lorsque leur partage est autorisé.

### 6.5 Registre de données

Pour chaque jeu de données, consigner : - nom et organisme producteur
; - URL ou procédure d'accès ; - licence et conditions de réutilisation
; - couverture géographique et temporelle ; - résolution, unités et
fréquence de mise à jour ; - limites connues ; - responsable qualité.

La disponibilité, les licences et la granularité doivent être vérifiées
avant de retenir une source. Ce document ne confirme pas l'accès à un
jeu de données particulier.

------------------------------------------------------------------------

## 7. Intelligence artificielle et méthodes analytiques

### Télédétection et apprentissage automatique

Applications possibles après constitution d'un jeu de référence :
classification des cultures, détection de changements, cartographie de
parcelles, anomalies de végétation et estimation de rendement. Chaque
modèle doit être testé sur des données indépendantes, avec des métriques
adaptées et des résultats documentés par zone et saison.

### Prévisions temporelles

Des modèles statistiques ou d'apprentissage automatique peuvent être
étudiés pour les prix, les volumes ou les indicateurs de campagne si
l'historique est assez long et cohérent. Ils doivent être comparés à des
méthodes de référence simples.

### Assistant conversationnel

Un assistant peut rechercher dans les données et la documentation de la
plateforme, mais il doit rester relié aux sources. Il doit signaler
l'absence de données et éviter de produire des recommandations
techniques non validées.

### Règles de confiance

-   Pas de précision supérieure à celle permise par les données.
-   Pas de promesse de rendement ou de revenu.
-   Pas de conseil agronomique présenté comme certain sans validation.
-   Pas de décision automatique de crédit, d'assurance ou d'accès au
    marché.
-   Suivi des erreurs, y compris par filière et région.

------------------------------------------------------------------------

## 8. Architecture technique indicative

La technologie finale dépendra des compétences, du coût, du volume de
données et des contraintes d'exploitation.

### Données et stockage

-   Stockage organisé des fichiers et produits satellitaires.
-   Base relationnelle pour les données structurées.
-   **PostgreSQL/PostGIS** pour les géométries et les requêtes
    spatiales.
-   Catalogue de métadonnées, provenance et versionnement.
-   Sauvegardes et règles de conservation.

### Traitement

-   Python pour le traitement, les statistiques et les modèles.
-   GeoPandas, Rasterio ou outils équivalents selon les besoins.
-   QGIS pour l'exploration, le contrôle qualité et la préparation des
    couches.
-   Pipelines reproductibles, documentés et journalisés.

### Application

-   API documentée.
-   Interface web mobile-first.
-   Carte interactive et tableaux de bord.
-   Comptes, rôles, permissions et exports.
-   Journalisation des actions sensibles.

### Exploitation et sécurité

-   Tests automatiques sur les traitements essentiels.
-   Surveillance des erreurs et de la fraîcheur des données.
-   Sauvegardes et procédure de restauration.
-   Contrôle d'accès aux données personnelles et commerciales.
-   Calcul régulier du coût d'hébergement et de traitement.

------------------------------------------------------------------------

## 9. Parcours utilisateurs

### Producteur

Il localise sa parcelle, consulte les observations et les risques,
comprend les limites des indicateurs et peut corriger ou compléter les
informations disponibles.

### Coopérative

Elle suit les parcelles de ses membres avec les autorisations
nécessaires, compare les estimations aux observations de terrain et
prépare un calendrier de collecte.

### Acheteur ou transformateur

Il sélectionne un produit et une période, consulte les bassins de
production, distingue les estimations des volumes confirmés et contacte
les fournisseurs. Les commandes, collectes et livraisons sont
enregistrées séparément.

### Administration

Elle consulte des indicateurs agrégés, compare les campagnes, repère les
anomalies à investiguer et produit des rapports documentés. Les
résultats complètent les statistiques et consultations officielles, sans
s'y substituer.

------------------------------------------------------------------------

## 10. Modèle économique

### Abonnements professionnels

Accès avancé pour coopératives, acheteurs, transformateurs,
distributeurs et institutions, avec tableaux de bord, alertes et exports
adaptés aux besoins.

### Études et services analytiques

Cartographie de bassins de production, analyses de campagne, études
d'approvisionnement, analyses de risques et rapports sur mesure.

### API et services de données

Accès à des données agrégées ou indicateurs validés, selon les licences,
les autorisations et les conditions de partage.

### Mise en relation commerciale

Frais ou commission à étudier si la plateforme facilite des transactions
vérifiables. Il faudra des règles de transparence, de gestion des
litiges et de confirmation des volumes.

### Partenariats

Pilotes cofinancés par des organismes publics, programmes agricoles,
structures de recherche ou partenaires de développement.

### Règles de viabilité

Tester la volonté de payer avant de construire des fonctionnalités
coûteuses ; calculer les coûts par zone et par client ; distinguer
données ouvertes et services à valeur ajoutée ; ne pas facturer une
précision non démontrée.

------------------------------------------------------------------------

## 11. Feuille de route

Les durées dépendront des ressources, des partenaires et de l'accès aux
données.

### Phase 0 : découverte et faisabilité

-   Interroger producteurs, coopératives, acheteurs et transformateurs.
-   Choisir une zone, une filière et une décision métier.
-   Vérifier les données, licences, résolutions et conditions de
    validation.
-   Définir les indicateurs de succès.
-   **Livrables :** note de cadrage, registre des sources, hypothèses,
    risques et décision de poursuivre ou non.

### Phase 1 : prototype analytique

-   Préparer les données géospatiales et de référence.
-   Produire une première analyse reproductible.
-   Créer une carte et un tableau de bord simples.
-   Comparer les résultats aux observations indépendantes.
-   **Livrables :** pipeline, carte, fiche méthodologique et rapport de
    limites.

### Phase 2 : pilote terrain

-   Tester avec un groupe restreint d'utilisateurs.
-   Collecter des observations indépendantes.
-   Corriger les problèmes d'interprétation.
-   Mesurer l'utilisation et les coûts.
-   **Livrables :** version pilote, rapport de validation et bilan des
    coûts.

### Phase 3 : première version opérationnelle

-   Ajouter les comptes, permissions, mises à jour, alertes et exports.
-   Documenter l'utilisation et assurer un support.
-   Tester une offre commerciale ou institutionnelle.
-   **Livrables :** service limité mais stable, documentation et
    tarification testée.

### Phase 4 : extension par filière et région

-   Sélectionner de nouvelles filières selon les données et les besoins.
-   Collecter des références spécifiques.
-   Adapter puis valider les modèles par zone et campagne.
-   **Livrables :** fiches de maturité, méthodes documentées et
    catalogue élargi.

### Phase 5 : plateforme intégrée

-   Relier production, risques, marchés, approvisionnement et
    traçabilité.
-   Ajouter les stocks et flux déclarés par les partenaires.
-   Développer une API et l'assistant d'information agricole.
-   Étendre le service avec des partenariats et une gouvernance adaptée.
-   **Livrables :** plateforme multi-filières, API et services
    professionnels.

------------------------------------------------------------------------

## 12. Mesure de la performance

### Qualité des données

-   Part des jeux de données documentés.
-   Fraîcheur et couverture réelle.
-   Taux de valeurs manquantes et erreurs détectées.
-   Couverture géographique validée.

### Qualité analytique

-   Précision, rappel et F1 pour la classification.
-   Métriques de segmentation pour les parcelles.
-   Erreur absolue moyenne ou quadratique pour les estimations
    quantitatives.
-   Comparaison à une méthode de référence simple.
-   Stabilité entre saisons et zones.
-   Qualité des intervalles d'incertitude.

### Utilité métier

-   Utilisateurs actifs et fréquence d'utilisation.
-   Capacité des utilisateurs à interpréter les indicateurs.
-   Temps nécessaire pour obtenir une information.
-   Décisions et opérations réellement soutenues.
-   Satisfaction et volonté de payer.
-   Économies ou réductions de délais uniquement si elles sont mesurées
    par une comparaison crédible.

### Impact

L'amélioration des rendements, des revenus, de la sécurité alimentaire
ou la réduction des pertes ne doit être revendiquée qu'après évaluation
appropriée. Une simple hausse du nombre d'utilisateurs ne prouve pas un
impact agricole.

------------------------------------------------------------------------

## 13. Gouvernance et risques

  -----------------------------------------------------------------------
  Risque                              Mesure de maîtrise
  ----------------------------------- -----------------------------------
  Données anciennes ou incomplètes    Métadonnées, contrôles qualité,
                                      date de mise à jour et
                                      avertissements

  Modèle peu fiable hors de sa zone   Validation par région et saison,
  de test                             suivi des erreurs

  Confusion entre estimation et       Libellés clairs, sources et niveaux
  certitude                           de confiance

  Fuite de données commerciales ou    Permissions, minimisation,
  personnelles                        agrégation et règles de partage

  Exclusion des utilisateurs peu      Interface mobile simple,
  connectés                           accompagnement et langues validées

  Coûts de calcul ou dépendance à un  Mesure des coûts, choix réversibles
  fournisseur                         et licences vérifiées

  Mauvaise décision basée sur une     Explication des limites et
  alerte                              orientation vers des professionnels
                                      lorsque nécessaire
  -----------------------------------------------------------------------

Les données de parcelles, de volumes, de prix négociés et de
transactions peuvent être sensibles. Elles ne doivent pas être publiques
par défaut.

------------------------------------------------------------------------

## 14. Équipe et compétences

-   **Produit et partenariats :** besoins utilisateurs, priorisation,
    coordination et modèle économique.
-   **Géomatique et télédétection :** préparation, traitement,
    cartographie et contrôle des données.
-   **Data science :** statistiques, modélisation, validation et
    incertitude.
-   **Développement logiciel :** API, interface, sécurité, déploiement
    et maintenance.
-   **Expertise agronomique :** cycles culturaux, choix des variables et
    validation terrain.
-   **Chaîne d'approvisionnement :** marchés, qualité, stockage,
    transformation et logistique.
-   **Opérations terrain :** collecte de référence, formation et
    contrôle de qualité.

Une petite équipe peut cumuler des rôles, mais le développement logiciel
ne remplace pas l'expertise agronomique ni la validation terrain.

------------------------------------------------------------------------

## 15. Choisir le premier pilote

La première version doit rester ciblée, même si la vision finale couvre
de nombreux produits. La filière pilote sera choisie selon :

1.  Importance économique pour les utilisateurs visés.
2.  Disponibilité et qualité des données.
3.  Faisabilité technique avec les ressources de l'équipe.
4.  Possibilité d'obtenir des observations indépendantes.
5.  Existence d'un utilisateur avec une décision concrète.
6.  Fréquence du besoin et valeur d'une mise à jour.
7.  Coût de production et potentiel de viabilité.

Ne pas choisir une filière uniquement parce qu'elle semble facile à
représenter sur une carte. Il faut un problème métier, des données
validables et un utilisateur accessible.

### Questions à résoudre avant de développer

-   Qui utilise et qui paie la première version ?
-   Quelle décision concrète doit être améliorée ?
-   Quelle zone et quelle filière permettent une validation réaliste ?
-   Quelles données sont accessibles légalement et à une résolution
    suffisante ?
-   Quel niveau d'erreur est acceptable ?
-   À quelle fréquence peut-on réellement mettre à jour les informations
    ?
-   Quel partenaire peut tester le service ?
-   Quel coût peut être couvert par le modèle économique ?

------------------------------------------------------------------------

## 16. Positionnement final

AgriFood Intelligence ambitionne de devenir une plateforme
multi-filières d'intelligence agricole et agroalimentaire, reliant
production, climat, risques, marchés, logistique et traçabilité. Son
catalogue pourra progressivement couvrir les cultures vivrières,
l'horticulture, l'arboriculture, les cultures commerciales, certains
indicateurs d'élevage, l'aquaculture et les produits transformés.

La crédibilité du projet dépendra de sa capacité à démontrer une valeur
concrète sur un périmètre réduit, puis à étendre ses services sans
compromettre la fiabilité. La priorité n'est pas de prétendre suivre
tous les produits dès le lancement, mais de bâtir une infrastructure de
données, de validation et de services permettant de les ajouter
progressivement.

**Principe de lancement : un cas d'usage utile, des données vérifiables,
une validation indépendante et une décision métier clairement
identifiée.**

------------------------------------------------------------------------

## 17. Sources de travail à examiner

Les catégories suivantes sont des pistes de recherche, pas une
confirmation de disponibilité ou de licence :

-   Documentation officielle des missions Sentinel et des services
    Copernicus.
-   Sources météorologiques et agroclimatiques pertinentes pour le
    Sénégal.
-   Organismes publics sénégalais compétents en agriculture, élevage,
    pêche, commerce et statistiques.
-   Bulletins de marché et données de prix publiés par les organismes
    compétents.
-   Documentation de QGIS, PostGIS et des bibliothèques géospatiales
    retenues.
-   Publications scientifiques sur la cartographie des cultures, les
    superficies et la prévision des rendements en Afrique de l'Ouest.
-   Organisations de producteurs, coopératives, transformateurs et
    acheteurs susceptibles de fournir des données de référence dans un
    cadre convenu.

Pour chaque source retenue, enregistrer le titre exact, l'organisme, la
date, l'URL, la licence, la période couverte et les limites
d'utilisation.
