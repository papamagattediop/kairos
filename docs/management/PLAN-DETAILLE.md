# Plan detaille et complet — KAIROS

> **Alignement du 3 novembre 2026 :** le règlement du hackathon exige que Meta
> soit réellement utilisé (Stage One éliminatoire; critère « Meta » à 25 %).
> Les passages ci-dessous qui rendent Meta facultatif, ou excluent SAM et la
> carte, sont **remplacés** par [../ARCHITECTURE.md](../ARCHITECTURE.md).
> Restent valables : calcul par le code, refus explicite, provenance de chaque
> nombre, pas de chiffre inventé.

**Version :** 1.0  
**Mise a jour :** 3 novembre 2026  
**Objectif :** livrer une demonstration de hackathon coherente, verifiable et
presentable avant la deadline annoncee du 4 novembre 2026 a 21:00 ET.

## 1. Mission du livrable

Construire une seule experience utilisable : un analyste consulte une
prevision de l'ecart national de disponibilite du riz pour la prochaine
campagne, son intervalle de prevision, l'historique du backtest, les sources et
les hypothèses, puis voit un refus explicite si les donnees ou la validation
sont insuffisantes.

Le MVP suit un seul produit : le riz. Il ne donne pas d'ordre d'importation a
un gouvernement ou a un operateur. L'objectif est une prevision statistique
prudente, pas un scenario presente comme une prediction.

## 2. Perimetre ferme du MVP

### Inclus

- Une page, une filiere (riz), un pays (Senegal), un ticket.
- Une cible de prevision : ecart national de disponibilite du riz, en kt, pour
  la prochaine campagne/annee commerciale.
- Des series historiques de source verifiee, harmonisees par unite, definition
  et periode de campagne.
- Une baseline simple, un modele candidat et un backtest a origine glissante.
- Un intervalle de prevision empirique, calibre et evalue par sa couverture.
- Un refus visible si l'historique, le backtest ou la calibration ne passent
  pas les seuils de qualite definis avant le test.
- Provenance : libelle de source, URL si disponible, date, unite et statut de
  verification.
- Interface soignee, responsive et lisible dans une capture video.
- README, instructions de lancement, licence open source, demo de secours.
- Muse Spark au coeur du flux (extraction de sources en JSON valide, agent a
  outils, refus); jamais pour calculer ou prevoir les chiffres.
- Une carte (regions du Senegal) comme surface principale; la couche SAM 3.1
  (eau, etendues irriguees) est conservee seulement si son test prealable passe.

### Exclus du MVP

- Oignon, multi-filiere, multi-pays, comptes, authentification ou base de
  donnees.
- Classification de cultures, rendement satellitaire, carte de parcelles,
  estimation automatique de production.
- Alertes officielles, ordre d'achat, recommandation d'import reelle.
- Affirmation de prediction, de precision ou de validation terrain non mesuree.
- Toute detection de culture par SAM presentee comme validee (SAM 3.1 sert aux
  etendues d'eau; l'estimation rizicole reste un proxy affiche comme tel).
- Pipelines live CHIRPS/Sentinel/ANSD non verifies et non testables avant
  soumission.

### Sortie du dashboard

Le tableau de bord tient sur un seul ticket, centré sur une seule prévision :

1. **Statut** : prévision publiée, ou prévision retenue avec les raisons du
   refus.
2. **Cible et horizon** : écart national de disponibilité du riz, en kt, pour
   la campagne identifiée; date de coupure des dernières observations.
3. **Prévision** : estimation centrale avec intervalle de prévision, uniquement
   si son niveau et sa couverture sont évalués.
4. **Historique** : série réelle connue et comparaison du modèle avec la
   baseline sur les origines de backtest.
5. **Qualité** : nombre de périodes validées, MAE, couverture mesurée de
   l'intervalle, limites et version de méthode. Aucune métrique n'est inventée
   si elle ne peut pas être calculée.
6. **Décomposition** : utilisation, production, importations nettes et stocks,
   avec leurs sources/définitions. Les composants ne sont pas chacun présentés
   comme une prévision si le modèle ne les prévoit pas.
7. **Seuil / date** : facultatif et nommé « scénario ». Une date précise ne
   paraît que si la série a une fréquence temporelle adaptée et si le seuil
   est documenté; les données annuelles seules ne donnent pas une date.

Le ticket ne montre ni rendement satellitaire ni prédiction de prix au MVP.
Les fixtures de démonstration sont identifiées comme fictives et ne constituent
pas une prévision validée.

## 3. Regles produit et calcul

1. Cible : ecart annuel/de campagne = utilisation interieure - production -
   importations nettes - contribution nette des stocks.
2. Verifier que la definition du bilan est identique sur toute la serie. Ne pas
   combler une donnee absente par une valeur inventee.
3. Les stocks ne sont pas disponibles dans les notes actuelles. Si le terme ne
   peut pas etre estime depuis une source coherente, il doit etre exclu par une
   definition justifiee ou le systeme doit refuser la prevision.
4. Les termes du bilan peuvent avoir des erreurs correlees; une somme
   d'intervalles independants ne doit pas etre presentee comme intervalle
   statistique valide sans methode.
5. Evaluer au minimum une baseline naive et un modele simple par validation a
   origine glissante, sans utiliser les annees de test pour ajuster le modele.
6. Mesurer l'erreur (MAE, et WAPE si le denominateur le permet) et la couverture
   reelle des intervalles sur les previsions historiques.
7. Pour une observation future, utiliser le terme « intervalle de prevision »,
   pas « intervalle de confiance ». N'afficher aucune couverture nominale
   (80 %/95 %) avant calibration et mesure.
8. Une date exacte de franchissement exige une serie infra-annuelle et un seuil
   documente. Les seules donnees annuelles ne justifient pas une date.
9. Les valeurs d'exemple des anciens supports restent des placeholders jusqu'a
   verification de leurs donnees et calculs.

## 4. Architecture d'implementation

Voir [../ARCHITECTURE.md](../ARCHITECTURE.md). Le flux impose est :

`sources/API/CSV -> validation temporelle -> baseline + modele -> backtest et
calibration -> prevision ou refus -> ticket typé -> interface -> explication IA
facultative`

Le code applicatif cible JavaScript sur Node.js : Next.js/React avec
TypeScript. Les API/exports de donnees (FAO, ANSD, USDA ou autres) doivent etre
audites et choisis separement de l'API Meta. Ne pas construire une integration
API avant d'avoir confirme endpoint, acces, licence, format, definition,
frequence et historique disponible. Meta n'est pas le fournisseur des donnees
statistiques.

## 5. Plan de livraison restant

Les dates ci-dessous sont un plan de compression, pas une affirmation de
travail deja realise. La priorite est de soumettre un produit simple qui
fonctionne plutot qu'un produit ambitieux non verifie.

### Phase A — Verrouiller la cible et auditer les donnees

- Definir le millesime/campagne et l'horizon de la prochaine prevision.
- Rechercher les series historiques de production, utilisation, commerce net
  et stocks; comparer definitions et couverture avant selection des API/fichiers.
- Pour chaque observation retenue, inscrire valeur, unite, periode, source,
  URL, date de collecte, revision et niveau de verification.
- Verifier le nombre de campagnes communes et les annees manquantes.
- **Sortie :** registre des donnees, series reproductibles et decision
  documentee « prevision faisable » ou « donnees insuffisantes ».

### Phase B — Creer l'application minimale

- Initialiser Next.js/React avec TypeScript sur Node.js.
- Creer la page unique avec prevision, intervalles, backtest, sources,
  hypothèses et refus.
- Conserver un mode fixture etiquete « fictif » pour tester l'interface, pas
  pour simuler la validation du modele.
- **Sortie :** l'application demarre localement et affiche une prevision
  validable ou l'etat « prediction withheld ».

### Phase C — Fiabiliser le moteur

- Coder le calcul pur sans acces reseau ni appel de modele.
- Implementer une baseline et un modele interpretable qui n'apprend que sur
  l'historique connu a chaque origine de backtest.
- Construire des intervalles a partir d'erreurs hors-echantillon; evaluer leur
  couverture sur les origines disponibles.
- Tester fuite temporelle, annees manquantes, revision de source, series
  negatives/incoherentes et couverture insuffisante.
- **Sortie :** tests passes, protocole de backtest visible et valeur courante
  comparee a la baseline.

### Phase D — Meta API (obligatoire, voir l'alignement en tete de document)

- Verifier le modele/endpoint exacts et la configuration du compte.
- Garder la cle dans une variable d'environnement serveur.
- Envoyer uniquement le ticket calcule et les extraits necessaires.
- Valider que la sortie ne peut pas remplacer les chiffres du moteur.
- Gerer panne, delai d'attente et absence de credit sans casser la demo.
- **Sortie :** integration facultative ou suppression propre de l'integration.

### Phase E — Finition et soumission

- Relecture visuelle desktop/mobile; etats pret, refus, erreur API.
- README d'installation, limites, sources, captures, licence et attribution.
- Verifier que le depot public ne contient ni secret ni donnee sans licence.
- Enregistrer une video de 3 minutes avec demonstration reelle et narration
  factuelle; conserver un enregistrement de secours.
- Remplir le formulaire, soumettre en avance et verifier la confirmation.
- **Sortie :** lien public, version demontree, video, formulaire confirme.

## 6. Script de demonstration (3 minutes)

1. **0:00–0:25 — Le besoin :** expliquer la decision d'analyse, sans dramatiser
   le deficit structurel.
2. **0:25–1:10 — La prevision :** montrer la cible, la campagne, l'estimation
   d'ecart et son intervalle de prevision.
3. **1:10–1:50 — La transparence :** montrer les sources, la baseline, les
   erreurs de backtest et la couverture mesuree.
4. **1:50–2:25 — Le refus :** retirer une entree requise; le systeme explique
   pourquoi aucun ticket certifie n'est produit.
5. **2:25–2:45 — Meta :** montrer l'explication Spark uniquement si l'appel
   fonctionne; rappeler que les nombres viennent du moteur.
6. **2:45–3:00 — Limites et prochaine etape :** une phrase sur les donnees
   manquantes, une phrase sur la validation necessaire.

## 7. Criteres d'acceptation

- [ ] L'application demarre depuis un clone propre avec les instructions du README.
- [ ] La prevision et le refus sont tous deux montrables.
- [ ] L'intervalle de prevision et sa methode de calibration sont decrits.
- [ ] Le backtest exclut les donnees futures et compare une baseline.
- [ ] Aucun nombre n'est invente par le modele de langage.
- [ ] Les unites, hypothèses, sources, dates et limites sont visibles.
- [ ] Une entree absente ne produit pas un ticket qui a l'air valide.
- [ ] Les tests du moteur et le controle de type passent.
- [ ] La demo fonctionne en rejeu (reponses Meta enregistrees) si l'API est
  indisponible, et montre un appel Meta reel dans le flux principal.
- [ ] Le repo public contient une licence open source choisie, sans secrets.
- [ ] La video et la soumission respectent les consignes officielles actuelles.

## 8. Risques et reponses

| Risque | Reponse |
|---|---|
| Temps restant trop court | Reduire au ticket + fixture + refus; couper carte, ML et ingestion live. |
| Sources historiques non confirmees | Marquer la fixture comme fictive ou refuser; ne pas recycler les chiffres de pitch. |
| Stocks manquants | Source/documentation necessaire; sinon refuser ou retirer ce terme avec justification, jamais de valeur silencieuse. |
| Historique trop court pour intervalles | Ne pas annoncer une couverture; afficher « prevision indisponible » et expliquer pourquoi. |
| Fuite temporelle dans le backtest | Rolling-origin strict; toutes les transformations sont refaites sans acces aux annees futures. |
| Seuil officiel absent | Le nommer scenario; ne pas l'attribuer a l'Etat. |
| API non operationnelle | Demo offline; l'IA n'est pas sur le chemin critique. |
| Carte requise pour activer le compte | Decision du titulaire du compte; ne pas mettre les donnees de paiement dans le projet. |
| Usage des donnees pour amelioration produit | Ne pas envoyer de contenu sensible; verifier les conditions et le controle de donnees. |
| Chiffres contradictoires dans les anciens fichiers | Appliquer le registre [CORRECTIONS-DECISIONS.md](CORRECTIONS-DECISIONS.md). |
