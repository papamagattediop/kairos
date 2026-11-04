# Guide d'enregistrement, plan de tournage et de montage

Objectif : vous enregistrez l'écran et la voix, **un clip par séquence**. Je monte ensuite : coupures, sous-titres,
transitions, cartes animées et captures des fonctionnalités par-dessus. Le texte à dire est dans
[KAIROS-DEMO-ET-SOUMISSION.md](KAIROS-DEMO-ET-SOUMISSION.md), section 2.

## Avant de commencer (5 minutes)

1. Fermez les onglets personnels, coupez les notifications (Windows : `Win+A`, mode « Ne pas déranger »).
2. Navigateur en plein écran de 1360 px de large, zoom 100 %, thème sombre. Ne jamais ouvrir `.env.local`.
3. Lancez le serveur en rejeu (sans réseau, réponses identiques à chaque prise) :
   ```powershell
   $env:META_REPLAY="1"; npm run dev
   ```
   Ouvrez http://localhost:3000. Dites dans le clip 3 que ce sont des réponses Meta enregistrées.
4. Enregistreur : OBS (écran + micro) ou `Win+G`. Micro près de la bouche, pièce silencieuse, 1080p, 30 images/s.
5. Enregistrez **chaque clip séparément** (7 fichiers). Si vous vous trompez, recommencez le clip, pas toute la vidéo.
6. Gestes : souris lente, pas de mouvements brusques, **marquez une pause d'une seconde avant chaque clic** (je
   pourrai zoomer dessus). Laissez 1 seconde de silence au début et à la fin de chaque clip.

## Les 7 clips

| Clip | Durée | Ce que vous faites avec la souris | Ce que vous dites |
|---|---|---|---|
| **1. Intro** | 12 s | Page d'accueil immobile. Ne touchez à rien. | Texte 0:00 – 0:12. Dites bien « built during this hackathon ». |
| **2. Carte** | 38 s | Descendez jusqu'à la carte. Passez lentement sur 3 ou 4 départements (survol). Cliquez **Dagana**, attendez 3 s que le panneau se remplisse. Cliquez **Kolda**, attendez 3 s. Pointez la barre hachurée (2021) avec le curseur. | Texte 0:12 – 0:50. Dites « Dagana » au clic, « Kolda » au clic suivant. |
| **3. Agent** | 35 s | Descendez au panneau agent. Cliquez le bouton d'exemple **« Rendement du riz par département »**. Attendez la réponse (en rejeu elle est immédiate). Déroulez doucement la trace des outils, puis revenez sur le badge « vérifié ». | Texte 0:50 – 1:25. Ajoutez : « these are recorded Meta replies, so the demo is reproducible offline ». |
| **4. Extraction** | 25 s | Panneau d'extraction : cliquez l'**extrait fictif**, puis le bouton d'extraction. Montrez le message de refus du bilan avec le curseur. | Texte 1:25 – 1:50. |
| **5. Données officielles** | 30 s | Panneau FAOSTAT : suivez la courbe du doigt avec le curseur, pointez la fourchette de référence, puis le tableau des cinq modèles. | Texte 1:50 – 2:20. |
| **6. SAM** | 25 s | Panneau Spark + SAM : cochez **« green irrigated field »** (le masque apparaît), décochez, cochez « yellow water ». Pointez « Sans résultat ». | Texte 2:20 – 2:45. |
| **7. Conclusion** | 15 s | Remontez en haut, page entière. Rien d'autre. | Texte 2:45 – 3:00. |

Total brut : environ 3 min 00. Je couperai les silences ; si c'est trop long, je saute d'abord le clip 4.

## Ce que j'ajouterai au montage

- **Titres animés** : carte d'ouverture KAIROS et carte de fin avec le dépôt GitHub.
- **Sous-titres** mot à mot (utiles si votre accent est difficile à suivre, et pour les jurés qui regardent sans son).
- **Zooms** sur chaque clic (Dagana, Kolda, badge « vérifié », refus du bilan).
- **Cartes de chiffres** qui apparaissent à côté de l'écran : « 21 / 45 départements estimés », « 17,4 % d'erreur hors
  échantillon », « 189 tests », « 3 / 23 concepts SAM ».
- **Schéma** d'une seconde : « Meta lit, le code calcule, le système refuse ».
- **Transitions** douces entre clips, musique légère très basse (si vous voulez).
- Rien de faux : tout chiffre affiché vient de l'application ou du README.

## Ce que vous me donnez

Les 7 fichiers vidéo (avec le son) dans un dossier, par exemple `Documents\Challenge\demo-clips\`, nommés
`01-intro.mp4`, `02-carte.mp4`, etc. Ouvrez une **nouvelle session Claude Code** dans ce dossier de projet (les skills
vidéo installés ne sont visibles qu'à la prochaine session) et dites : « monte la vidéo avec les clips de demo-clips ».

## Rappels

- Ne dites jamais : « précision », « prévision validée », « utilisé par une institution ».
- Dites : « estimation de référence », « bande d'erreurs observées », « non concluant ».
- Durée finale : 3:00 maximum.
