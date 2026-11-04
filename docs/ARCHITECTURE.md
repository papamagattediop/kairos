# Architecture du projet KAIROS

> Nom : KAIROS remplace CONTOUR (nom de travail précédent). Le renommage du
> code et des autres documents reste à faire. Ce document décrit la **cible** :
> voir la section 7 pour l'état réel de l'implémentation.

## 1. Principes

1. Une seule question produit : où et quand l'offre alimentaire devient-elle
   insuffisante, et que montre le bilan sous des hypothèses visibles ?
2. Les modèles Meta **lisent, orchestrent, segmentent et refusent**. Le code
   **calcule**. Aucun chiffre affiché n'est produit par un modèle de langage.
3. Chaque nombre porte une origine : `observé` (source officielle),
   `estimé par carte` (surface segmentée x rendement officiel) ou `prévu`.
   Un nombre sans source, unité et période n'est pas affiché.
4. Une entrée absente produit un refus explicite, jamais un zéro silencieux.
5. Les données de démonstration sont identifiées comme telles.
6. L'API Meta reste côté serveur. Aucune clé dans le navigateur, le dépôt, les
   journaux ou la vidéo.
7. La démonstration doit fonctionner en rejeu (réponses Meta enregistrées) si
   l'API ou le réseau est indisponible.
8. Le produit suit l'offre et la demande alimentaires. Il ne recommande pas
   de politique publique et ne se présente pas comme un outil de décision d'État.

## 2. Architecture logique

```text
Sources (extraits FAOSTAT, USDA PSD, ANSD)       Image Sentinel-2 (pré-téléchargée,
          |                                       une zone, une date)
          v                                                  |
 Muse Spark : extraction vers JSON validé                    v
 (valeur, unité, campagne, source, confiance;     Muse Spark : choisit quoi segmenter
  terme absent = null)                                       |
          |                                                  v
          |                                      SAM 3.1 : masques (GeoJSON en cache)
          |                                                  |
          |                                                  v
          |                                  Code : hectares, bande de production
          |                                  (surface x rendement officiel) et écart
          |                                  à la surface officielle
          v                                                  v
   Registre de produits (niveau 0 à 4) ---> Moteur de bilan par produit et région
                                             - observé / estimé par carte / refus
                                                             |
                                                             v
                                         Ticket JSON typé (état ready ou refus)
                                                             |
                          +----------------------------------+---------+
                          v                                            v
              Agent Muse Spark à outils                    Interface : carte + ticket
              (appelle le moteur, cite ses sorties,        + différence avant/après
               répond ou refuse)                           l'arrivée d'une donnée
```

### Ce que « temps réel » veut dire ici

Les sources publiques sont annuelles ou mensuelles. Le bilan se **recalcule à
l'arrivée de chaque nouvelle donnée** (extrait collé, document, image). L'écran
montre ce qui a changé. Il ne prétend pas recevoir de flux instantané.

### Estimation par carte

1. Spark choisit le concept à segmenter (eau, étendue irriguée) sur l'image.
2. SAM 3.1 produit les masques, enregistrés en GeoJSON.
3. Le code calcule les hectares (projection adaptée) et la bande de
   production avec un rendement tiré d'une statistique officielle.
4. La surface estimée est comparée à la surface officielle de la zone. Si
   l'écart dépasse le seuil fixé avant le test, l'estimation est marquée
   « non validée » et n'alimente pas le bilan.

SAM segmente bien l'eau et mal les champs (chiffres de la documentation, non
re-testés dans ce projet). L'estimation rizicole est donc un **proxy fondé sur
les étendues inondées**, présenté comme tel, jamais comme une détection du riz.
Un test de trois prompts sur des images réelles décide avant toute
construction si cette couche est conservée.

## 3. Stack et structure

JavaScript sur Node.js : Next.js, React et TypeScript. Carte avec MapLibre
(frontières HDX/OCHA, CC-BY, pas GADM). Le traitement d'imagerie est hors
ligne (script ponctuel, par exemple Python avec rasterio et shapely) ; ses
résultats sont versionnés en GeoJSON.

```text
KAIROS/
|-- README.md
|-- LICENSE                         # à choisir avant publication publique
|-- .env.example                    # noms de variables uniquement
|-- src/
|   |-- app/
|   |   |-- page.tsx                # carte + ticket
|   |   `-- api/
|   |       |-- ingest/route.ts     # Spark : source -> JSON validé
|   |       `-- agent/route.ts      # Spark agent à outils
|   |-- components/
|   |   |-- map/                    # MapLibre, couches région et masques
|   |   |-- decision-ticket/
|   |   |-- refusal-state/
|   |   `-- source-lineage/
|   |-- lib/
|   |   |-- decision-engine/        # bilan déterministe (existe)
|   |   |-- products/               # registre de produits et niveaux
|   |   |-- estimation/             # surface, bande de production, contrôle
|   |   |-- meta/                   # client, schémas, cache et rejeu
|   |   `-- validation/
|   `-- types/
|-- data/
|   |-- demo/                       # fixtures étiquetées fictives
|   |-- sources/                    # extraits officiels et registre
|   `-- geo/                        # frontières, masques GeoJSON en cache
|-- scripts/
|   `-- segment-zone.*              # imagerie -> masques (hors ligne)
|-- tests/
|-- assets/
`-- docs/
```

## 4. Responsabilités

### Navigateur

- Affiche la carte, le ticket, l'origine de chaque nombre (observé, estimé
  par carte, prévu), les sources et l'état de refus.
- Ne contient aucun identifiant Meta et ne décide pas de la fiabilité.

### Serveur Node.js

- `calculateBalance` reste la seule source du calcul de l'écart.
- Valide la sortie de Spark contre un schéma strict avant tout calcul.
- Enregistre et rejoue les réponses Meta (mode démonstration hors ligne).
- Applique les règles de refus : donnée absente, estimation non validée,
  produit de niveau 0.

### Muse Spark (côté serveur)

- Extrait des termes de bilan depuis des sources, au format JSON strict.
- Choisit quoi segmenter sur une image et dirige l'appel à SAM.
- Agent à outils : appelle le moteur et les séries, répond en citant les
  sorties des outils, refuse sans donnée.
- N'a pas l'autorité de produire ou modifier un nombre affiché.
- Vérifier modèle, endpoint, format et quotas dans la documentation officielle
  avant implémentation ; gérer délais et erreurs.

### SAM 3.1

- Segmente à partir d'un prompt texte (phrase-nom) sur l'API hébergée.
- Utilisé là où il est le plus fiable (eau, étendues). Sa couche est retirée
  si le test préalable échoue.

## 5. Registre de produits

Chaque produit a un niveau de maturité visible. Seul le riz est visé au-delà
du niveau 0 pour le MVP.

| Niveau | Sens | Affichage |
|---|---|---|
| 0 | Envisagé, données insuffisantes | Refus |
| 1 | Données secondaires identifiées | Bilan observé seulement |
| 2 | Méthode testée sur un échantillon | Estimation étiquetée |
| 3 | Validée sur une zone et une saison | Estimation avec intervalle |
| 4 | Opérationnel | Hors périmètre du hackathon |

## 6. Contrat du ticket (indicatif)

```ts
type Origin = "observed" | "map_estimate" | "forecast";

type DecisionTicket =
  | {
      state: "ready";
      product: string;
      region: string;
      campaign: string;
      asOf: string;
      gapKt: number;
      origin: Origin;
      interval?: { level: number; lowerKt: number; upperKt: number };
      validation?: { officialAreaHa: number; mappedAreaHa: number; errorPct: number };
      assumptions: Array<{ label: string; value: string; sourceId?: string }>;
      sources: Array<{ id: string; title: string; date: string; url?: string }>;
    }
  | {
      state: "insufficient_data";
      product: string;
      reasons: string[];
      missingInputs: string[];
      sources: Array<{ id: string; title: string; date?: string; url?: string }>;
    };
```

Un intervalle n'est affiché que s'il est calibré par comparaison avec des
valeurs observées. Une date précise n'est affichée qu'avec une série
infra-annuelle et une règle documentée.

## 7. État réel de l'implémentation (3 novembre 2026)

| Élément | État |
|---|---|
| Moteur de bilan `calculateBalance` et ses tests | Existe |
| Page de scénario à quatre champs | Existe (prototype) |
| Carte, ingestion Spark, agent, estimation, registre de produits | Non commencé |
| Accès API Meta | Clé et nom de modèle à fournir, non testés |
| Test SAM sur images de la vallée du fleuve | Non fait |
| Données officielles harmonisées | Non extraites |

## 8. Sécurité et dépôt public

- Commit `.env.example`, jamais `.env.local` ni de vraies clés.
- Ne pas coller d'identifiants dans le chat, les captures, les journaux ou
  le code.
- Vérifier les conditions de traitement des données avant d'envoyer du
  contenu aux crédits Meta (l'avis participant indique qu'il peut servir à
  l'amélioration du produit).
- Choisir une licence open source reconnue avant publication.
- Vérifier la licence et l'attribution de chaque source ou fichier géographique
  intégré.
- La démonstration ne montre que ce qui a été construit pendant l'événement.
