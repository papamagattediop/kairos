# Brief de nom — projet « CONTOUR » (nom de travail)

*Document autonome. À transmettre tel quel à la personne ou à l'équipe qui produira les noms.*

---

## 0. En une phrase

**FR** — Un service qui transforme des données ouvertes en une **bande de production agricole**, la confronte au **bilan alimentaire officiel**, puis imprime une **date** : le moment où le déficit d'un pays devient un risque — et qui **refuse de se prononcer** quand la donnée ne le permet pas.

**EN** — A service that turns open data into a **production band**, confronts it with the **official food balance**, and prints a **date** — when a country's shortfall becomes a risk — or refuses to certify when the data won't allow it.

## 1. Le problème

Les bilans officiels (USDA, FAO) arrivent tard et en gros chiffres. L'alerte vient quand le prix a déjà bougé. Les systèmes classiques (FEWS NET, GIEWS) décrivent l'insécurité ; peu **datent** le franchissement d'un seuil d'import. Le déficit n'est pas un désastre soudain : c'est une **échéance qu'on n'a pas vue venir**.

## 2. La thèse (ce que le nom doit pouvoir incarner)

> « Il ne cartographie pas les cultures : il **price le déficit**. »
> « USDA vous dit ce qui s'est passé. FEWS NET vous dit à quoi ça ressemble. **[Nom] vous dit quand appuyer sur le bouton.** »

Deux actes, également importants : **dater** un écart, et **refuser de certifier** quand la donnée manque (le refus est un signe de sérieux, pas un aveu de faiblesse).

## 3. Ce que fait le produit (la chaîne)

`satellite (Sentinel-1/2, CHIRPS) → bande de production (médiane + intervalle) → bilan FAO → seuil d'import → Ticket de décision daté`

Le cœur est **déterministe** : le modèle de langage (Meta Muse Spark) lit, route, raconte — il ne produit **aucun** chiffre.

## 4. L'artefact

Le **Ticket de décision** : une page, six champs — production (bande), déficit, seuil, **date**, confiance, sources. Ou l'état **« données insuffisantes »**.

## 5. Utilisateur et acheteur

- **Le levier** : le comité de suivi des prix du ministère du **Commerce** (Sénégal).
- **Le signal** : **DAPSA / DGPSA** (agriculture), synchronisé avec le **Cadre Harmonisé**.
- Cadrage : coordination de l'offre. On publie des **bandes**, jamais des points (un chiffre public peut créer de la thésaurisation).
- Claim maximum : « **co-conçu avec un analyste DAPSA** » — jamais « utilisé par le Ministère ».

## 6. Le contexte du concours

- **Meta Global AI Developer Hackathon 2026**, track **Indie**, 1er prix **150 000 $**.
- Build du **26 octobre au 4 novembre 2026** (10 jours). Barème : Impact 30 · Meta 25 · Démo 25 · Profondeur 20.
- Outils : Muse Spark 1.3, SAM 3.1 (eau), Glimmer 30B, Voice Transcribe (pas de wolof/pulaar).
- **Le jury verra le nom une seule fois.** Il doit être lisible, mémorable, autoporteur, sans explication.

## 7. L'ancrage local (si le nom veut s'en nourrir)

- **Sénégal**, filière **riz** (importateur structurel). Bilan USDA : **1,71 Mt (MY25/26)**, **1,76 Mt (MY26/27)**.
- **JOJ Dakar 2026** (31 oct–13 nov) : le pays est sous les projecteurs pendant tout le build.
- **Inondations 2–6 oct 2026** (Rufisque, 142 mm/24 h) : le produit a **refusé** de transformer ces images en alerte alimentaire — c'est l'instance de démo, pas le produit.

## 8. Le job du nom — ce qu'il doit évoquer (choisir un seul champ)

- le **seuil**, le **franchissement**, la **date**, l'**échéance**, le **délai** ;
- l'**écart**, le **déficit**, le **manque** ;
- la **vigilance**, le **guet**, la **vigie**, la sentinelle, la **balise** ;
- le **signal faible** qui précède le bruit ;
- l'agricole (grain, récolte, battage) — optionnel.

## 9. À éviter (anti-brief)

- La **cartographie**, les **cartes**, l'« atlas » — la thèse les rejette explicitement.
- « Prédire », « temps réel », « IA magique ».
- Le catastrophisme (famine, urgence) : le registre est **calme, précis, administratif**.
- Les mots saturés : Sentinelle, Vigil, Keeper, Oracle, Copilot, Radar.
- Tout ce qui suggère que l'État « décide » un volume d'import (ce n'est pas le cas).

## 10. Contraintes pratiques

- **2 syllabes** idéalement, **≤ 3**. Se prononce **en français ET en anglais**.
- Domaine (`.com` / `.sn`) et handles sociaux disponibles ; pas de marque déposée connue.
- S'écrit de préférence en minuscules, comme un **outil** (registre Linear, Stripe, Vercel) — pas un cri de guerre.
- Fonctionne **seul** ; un **surtitre descriptif** peut l'accompagner (« [Nom] — la date du déficit »).

## 11. Pistes déjà explorées (et leurs faiblesses)

| Piste | Force | Faiblesse |
|---|---|---|
| **CONTOUR** | La ligne de seuil ; continuité | Dit « carte », or la thèse rejette la carte |
| **VIGIE** | Le guetteur ; l'alerte précoce | Opaque à l'international ; homonymes FR |
| **SEUIL** | Direct, clair | Générique ; collision éditeur |
| **THRESH** | Seuil + battage (agricole) + trancher | Lecture possible « thrash / trash » |
| **KAIROS** | Le moment décisif | Conceptuel, hors agriculture |
| **BALISE** | Marque posée en avant | Mot commun, très usité |
| **AMONT** | Le signal d'amont | Vague, générique |

## 12. Taglines candidates (FR / EN)

- « La date du déficit. » / *"The date of the deficit."*
- « Price le déficit, pas la carte. » / *"Price the gap, not the map."*
- « L'écart, daté. » / *"The gap, dated."*
- « Quand appuyer sur le bouton. » / *"When to press the button."*
- « Chaque crise alimentaire a d'abord été une échéance. » / *"Every food crisis was a deadline before it was a disaster."*

## 13. Ton et identité visuelle

- Précis, sobre, presque administratif : un **instrument**, pas un média.
- Palette : encre `#111418`, ocre Sahel `#E8A33D`, rouge seuil `#E5484D`, crème `#F5F0E6`.
- Typographie : grotesque condensée (titres) + monospace (chiffres, dates).
- Un seul motif graphique : la **règle de seuil** qui croise une **bande en escalier**.

## 14. Livrables demandés au nommeur

1. **5 à 8 noms candidats**, chacun avec : évocation, prononciation FR/EN, nombre de syllabes, risques de collision.
2. **2 finalistes** classés, avec un argumentaire d'une phrase.
3. Pour chaque finaliste : **3 taglines** (FR + EN).
4. **Vérification de disponibilité** (domaine `.com`/`.sn`, handles) et **recherche d'antériorité**.
5. Une **phrase de prononciation** pensée pour un jury anglophone.

## 15. Faits à ne pas contredire (utiles pour les taglines)

- Le produit **ne prédit pas** : il **date** un franchissement, et **refuse** quand il ne sait pas.
- Il **ne remplace pas** USDA / FAO / FEWS NET : il **date plus tôt**.
- Crédit : « co-conçu avec un analyste DAPSA » — jamais « utilisé par le Ministère ».
- Chiffres USDA de référence : **1,71 Mt** et **1,76 Mt** — jamais 1,66.
