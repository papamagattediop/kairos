# Corrections, décisions et arbitrages

Ce fichier est le registre de cohérence. En cas de conflit, suivre la décision
ci-dessous et corriger le pitch, l'interface et la vidéo ensemble.

## Décisions actives

| Sujet | Décision actuelle | Justification / vérification requise |
|---|---|---|
| Nom du projet | KAIROS (ex-CONTOUR) | Cohérent avec la candidature déjà soumise. Ne pas mélanger les marques dans l'interface ou la vidéo. Marque et domaine à vérifier. |
| Périmètre | Riz seulement; un ticket pour l'écart national de disponibilité de la prochaine campagne | Choix confirmé par le porteur; oignon et autres produits hors MVP. |
| Utilisateur | Analyste qui examine une prévision de bilan | Ne pas prétendre qu'un ministère, DAPSA ou un importateur utilise le produit sans preuve. |
| Nature du produit | Prévision prudente de l'écart; aucun ordre d'import | Un seuil officiel n'est pas établi par les notes. |
| Stack | JavaScript sur Node.js, Next.js/React avec TypeScript | Choix confirmé par le porteur. |
| Autorité des nombres | Modèle statistique versionné et backtesté; code seul pour les calculs | Un LLM ne calcule ni ne remplace un nombre affiché. |
| Incertitude | Intervalle de prévision calibré, pas simplement intervalle de confiance | La couverture nominale doit être confrontée aux résultats hors-échantillon. |
| État sans données | Refus `insufficient_data` avec raisons | Ne pas retourner un ticket incomplet ayant l'apparence d'un succès. |
| SAM 3.1 | Couche carte (eau, étendues irriguées), conservée seulement si un test préalable passe | Les notes signalent la faiblesse de segmentation des champs; ne pas faire croire que SAM prouve la présence de riz. |
| Muse Spark | Au cœur du flux : extraction de sources en JSON validé, agent à outils, refus | Le règlement exige un usage réel de Meta. Accès API et nom de modèle à vérifier par un appel de test. Spark ne calcule aucun nombre affiché. |
| Jeux de démonstration | Fixture marquée `synthetic`/`demo` si les sources ne sont pas validées | Ne pas réutiliser silencieusement les chiffres des anciens pitchs. |

## Corrections factuelles obligatoires

### 1. Valeurs et intervalles de prévision

Des brouillons affichent des valeurs comme `612 kt`, `645 kt ±25%`, `45–47 kt`
de déficit, `62%`, des seuils ou des dates d'action. Aucune preuve de données
ni reproduction du calcul n'a été vérifiée dans le dossier. **Statut : exemples
non certifiés / placeholders.** Ne pas les afficher comme observations ou
prévisions réelles.

Une prévision de la campagne future doit porter un **intervalle de prévision**
de l'observation future. Un intervalle de confiance décrit généralement
l'incertitude d'un paramètre ou d'une moyenne et ne doit pas être utilisé comme
synonyme. Le niveau annoncé (par exemple 80 % ou 95 %) doit être évalué par la
couverture du backtest.

### 2. Imports USDA

Les documents se contredisent : certains citent `1,66 Mt`, d'autres `1,71 Mt`
et `1,76 Mt`. Une note plus récente du dossier demande de ne plus réutiliser
`1,66 Mt`, mais aucune source primaire n'a été contrôlée lors de la préparation
de ce registre. **Action :** enlever ces valeurs de l'interface jusqu'à
vérification de la publication USDA exacte, de la campagne, de la date et de la
définition statistique.

### 3. Stocks et seuil d'import

Les notes indiquent que les stocks nationaux et un seuil officiel ne sont pas
disponibles. Toute hypothèse de stock doit être marquée; toute règle de seuil
doit être appelée « scénario ». Ne pas écrire « le gouvernement doit importer
X tonnes avant telle date ».

### 4. Performance et validation

Retirer les affirmations non mesurées : avance de 4–8 semaines, backtest sur
cinq campagnes, précision de rendement, validation terrain, reproduction
USDA, classement ou probabilité de prix. Elles ne deviennent publiables
qu'après un calcul reproductible et des éléments de preuve.

### 5. Utilisateur et co-conception

N'utiliser aucune formule telle que « utilisé par le Ministère »,
« approuvé par DAPSA », « co-conçu avec un analyste DAPSA », « partenaire » ou
« acheteur confirmé » sans preuve explicite et autorisation d'usage du nom.

### 6. Intégration Meta

Les noms de modèle, URL d'API, formats d'entrée, outils, quotas et capacités
mentionnés dans les anciens brouillons doivent être confrontés à la
documentation officielle courante et à un appel de test non sensible avant
d'être annoncés comme réalisés.

## Source de vérité et priorité

1. Règlement / portail officiel actuel du hackathon pour les échéances et
   exigences de soumission.
2. Données officielles primaires avec URL, date et définition pour les faits
   statistiques.
3. Code et tests reproductibles pour les calculs du produit.
4. Ce registre pour les décisions d'implémentation.
5. Anciens briefs et pitches comme historique seulement; ils ne remplacent ni
   une source primaire ni une mesure.

## Processus de correction

Pour chaque nouvel écart :

1. noter l'affirmation, le fichier et la raison du doute;
2. vérifier une source primaire ou un résultat reproductible;
3. choisir une formulation prudente ou retirer l'affirmation;
4. mettre à jour simultanément l'interface, le README, le pitch et la vidéo;
5. ajouter une date et une preuve à ce journal.
