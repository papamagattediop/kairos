# Mémoire de projet — KAIROS

> Le projet s'appelle KAIROS (ex-CONTOUR; avant cela AgriFood Intelligence).
> Le règlement du hackathon impose que Meta soit réellement utilisé : les
> mentions « Meta facultatif » ci-dessous sont remplacées par
> [ARCHITECTURE.md](../ARCHITECTURE.md).

Document de continuité pour garder les choix, remarques et choses à éviter
visibles pendant le travail. À relire avant toute modification du produit ou
du pitch.

## Contexte confirmé

- Le porteur a choisi de continuer avec CONTOUR.
- Le MVP suit uniquement le riz et vise une vraie prévision, avec un intervalle
  de prévision pour chaque sortie annoncée.
- Le porteur a confirmé JavaScript/Node.js; l'architecture retenue est
  Next.js/React avec TypeScript.
- Il n'existe pas encore de dépôt GitHub ni d'application dans le dossier
  inspecté.
- Le dossier contient plusieurs concepts et versions antérieures; utiliser
  CONTOUR comme nom de travail et éviter de mélanger les pitches.
- L'annonce du hackathon indique une vidéo de démonstration de trois minutes,
  un dépôt GitHub open source obligatoire et une échéance le 4 novembre à
  21:00 ET.
- Le compte Meta affiche 150 USD de crédits gratuits et aucun moyen de
  paiement; l'avis fourni indique qu'un moyen de paiement est requis avant
  l'appel API.
- L'avis de crédits signale que le contenu utilisé avec ces crédits peut être
  traité pour l'amélioration du produit.

## À ne pas faire

- Ne pas présenter les valeurs d'exemple des anciens pitches comme des
  mesures réelles.
- Ne pas dire que CONTOUR « prédit la famine », « décide pour l'État »,
  « ordonne l'importation » ou remplace USDA, FAO, FEWS NET ou les services
  nationaux.
- Ne pas présenter un seuil de scénario comme un seuil officiel.
- Ne pas masquer les données de stocks manquantes.
- Ne pas afficher un point de rendement sans méthode, provenance et intervalle
  justifiés.
- Ne pas prétendre que le satellite ou SAM 3.1 identifie une culture de riz sans
  validation.
- Ne pas placer le calcul d'un chiffre dans Muse Spark.
- Ne pas appeler un intervalle de prévision un intervalle de confiance sans
  préciser le concept statistique.
- Ne pas afficher une date précise de franchissement si seules des données
  annuelles sont disponibles.
- Ne pas rendre l'appel Meta indispensable à la démonstration.
- Ne pas ajouter l'oignon, ShoreWatch, les comptes utilisateurs, un chatbot
  général ou un pipeline satellitaire live au premier périmètre.
- Ne pas envoyer de clé, fichier `.env`, information privée ou donnée sensible
  vers GitHub, une capture ou la vidéo.
- Ne pas ajouter de moyen de paiement ni effectuer une dépense au nom du
  porteur.
- Ne pas publier un dépôt sans licence open source choisie et sans vérifier les
  licences des données embarquées.

## Principes de travail

- Une affirmation = une source ou une preuve mesurable.
- Une donnée numérique = une unité, une période, une provenance et un statut.
- Une hypothèse = un libellé visible, pas une valeur par défaut cachée.
- Une entrée obligatoire absente = refus explicite, pas de fallback silencieux.
- Le premier écran doit expliquer le résultat en quelques secondes.
- Le code de calcul reste petit, pur et testable.
- En cas de panne réseau/API, garder une démonstration locale déterministe.
- Le README doit expliquer le fonctionnement, les limites, les sources et le
  démarrage depuis un clone propre.

## Libellés à privilégier

- « scénario », « estimation sous hypothèse », « données insuffisantes »,
  « source à vérifier », « date de référence », « intervalle ».
- Éviter « prévision fiable », « temps réel », « validé », « officiel »,
  « précision de X % » sans preuve.

## Points à valider avec le porteur

- Sources et couverture historique qui permettront de tester si la prévision
  de l'écart rizicole est faisable.
- Décision du porteur concernant l'ajout d'un moyen de paiement au compte Meta;
  ce choix n'est pas requis pour le MVP hors ligne.
- Licence open source à appliquer au dépôt public.
- Chiffres et sources exacts retenus pour le jeu de démonstration.
- Nom : KAIROS retenu (disponibilité de marque et de domaine non vérifiée).

## Liens de référence interne

- [Plan détaillé](PLAN-DETAILLE.md)
- [Suivi d'avancement](SUIVI-AVANCEMENT.md)
- [Corrections et décisions](CORRECTIONS-DECISIONS.md)
- [Architecture](../ARCHITECTURE.md)
