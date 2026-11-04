# Décision comparative — ShoreWatch vs CONTOUR (et le reste)

**Question :** parmi les projets proposés avant AgriFood, y en a-t-il un qui puisse battre CONTOUR (riz+oignon) ?
**Réponse courte : OUI — ShoreWatch (érosion côtière Saint-Louis).** Et sur un rapport risque/récompense, pour un solo en 10 jours, il est probablement **meilleur**.

> Rappel honnête : la liste des 10 idées « shot 1er prix » a été **interrompue** (jamais livrée). Cette comparaison porte sur le Top 5 précédent.

---

## 1 | Arbitrage (mes deux agents se contredisaient)

- **Agent vérif ShoreWatch** : ShoreWatch gagne sur 3 axes du barème (Meta, Démo, Utilisateur) et égalise sur le 4e.
- **Agent juge** : CONTOUR gagne globalement, rien ne le bat.
- **Mon arbitrage** : l'agent juge a **sur-calibré** (35–42% de P(1er prix) = absurde pour 20 000 candidats) et a **surestimé la « centralité Meta » de CONTOUR** — parce que dans la conception honnête de CONTOUR, SAM est dévolu à l'eau/inondation (classe forte), or l'évidence riz est en Sentinel-1, **pas** en SAM. Donc la centralité SAM de CONTOUR est **partiellement illusoire**.

**Verdict recalibré (odds réalistes, pas optimistes) :**

| Projet | Finaliste | P(1er prix) | Note pondérée | Pourquoi |
|---|---|---|---|---|
| **ShoreWatch** | ~20–25% | **~2–4%** | ~8,0/10 | SAM sur l'eau = **classe forte (95% IoU)** ; démo = **un chiffre** ; utilisateur **nommé et financé** (ONL) ; validation gratuite (DE Africa) ; **évite le piège nadir** |
| **CONTOUR** | ~22% | ~3–5% | ~8,2/10 | 2 modèles Meta (SAM+Spark agentic) + carte de refus ; mais **SAM au nadir = plus faible modalité** + démo 2 flux ; utilisateur générique |
| **PrixVu** | ~35–45% | ~1–2% | ~6,1 | démo sure & geste unique, **mais substituable par GPT-4V** → tue l'axe 25% |
| **ParcelZero** | ~30–38% | ~0,5–1% | ~6,3 | subsumé par le flux riz de CONTOUR |
| **CarRapide** | ~18–25% | ~0,3–0,6% | ~5,0 | payeur faible ; vidéo = zone faible du fondateur |

---

## 2 | Pourquoi ShoreWatch peut battre CONTOUR — mécanisme précis

1. **SAM là où il est empiriquement fort.** Eau/côte = **95% IoU** (études SAM+CLIP Landsat 2024 ; SAM Sentinel-1/2 F1 0,874–0,994, scènes plages >0,99). CONTOUR parie son héros sur **SAM au nadir sur champs = 51% IoU**, la classe *faible*. ShoreWatch supprime le **tueur n°1 de CONTOUR**.
2. **Démo plus propre.** *« Tape "water" → la Langue de Barbarie a perdu X m depuis 2016 »* — un chiffre, une ville UNESCO qui disparaît. Chiffre **vérifiable et sourcé** : **−2,53 m/an** (1989–2019), −5,48 m/an sur 2009–2019, migration de la flèche ~600 m/an depuis 2012, projection −26,8 m/an à 2032 (Sarr et al. 2024 ; Cheick et al. 2025 ; Taveneau et al. 2021).
3. **Utilisateur nommé, financé, et qui se crée MAINTENANT.** **ONL (Observatoire National du Littoral)** — en cours de montage 2024–2026 sous le programme Banque mondiale/Nordic **WACA ResIP**, mandat verbatim : « indicateurs du suivi de l'évolution du littoral ». + **ANACIM** étend son système d'alerte à l'érosion côtière ; **AFD 16 M€** (PPCS Saint-Louis) ; **IRD/UGB/UCAD** ; **UNESCO**. C'est un payeur *littéralement en train d'être fondé pour ça* — plus spécifique que « un négoce à Dakar ».
4. **Validation gratuite et locale.** **Digital Earth Africa Coastlines** : littoraux annuels corrigés des marées, 2000→, 30 m, CC-BY, **validés au Sénégal (MAE 4,51 m / RMSE 5,42 m, noté « Very good »)**. Ça dé-risk entièrement la vérification.

### Les 2 vraies faiblesses de ShoreWatch (honnêteté)
- **« NDWI pourrait faire la science ».** Sur contraste océan/sable propre, l'index d'eau classique (NDWI) marche à peu près aussi bien. La défense de SAM : **généralité sans annotation** (une phrase, n'importe où), **frontières turbides/estuaires** (embouchure du fleuve Sénégal = exactement où le NDWI casse), et l'UX. → C'est le **risque stratégique n°1**.
- **Marée** : amplitude 1,6 m de vives-eaux déplace la ligne d'eau de dizaines de mètres. → Scènes de **même saison sèche** uniquement, citer DE Africa (corrigé marées).

---

## 3 | Le meilleur choix pour TOI (solo junior, 10 jours)

**ShoreWatch, à risque ajusté.** Raisons :
- Exploite ta force (stats/data eng/QGIS) **sans** exiger de la vidéo/GPU local (SAM vidéo = côté serveur ; et ici on est surtout sur des scènes satellite, pas de vidéo).
- **Moins exécutable en erreur** : pas de problème de nadir-champ, pas de complexité de 2 flux, validation gratuite.
- Démo plus facile à atterrir en 60–90 s.

**Mais CONTOUR n'est pas mort** : il a un plafond de centralité Meta plus élevé (2 modèles + agentic + carte de refus = démonstration d'usage *agentic*, pas « un masque ») et un récit d'impact plus large (sécurité alimentaire).

**Piège à éviter : combiner les deux.** Trois récits en 90 s = scope creep, démo disjonctée. Les agents sont d'accord : **ne fusionne pas.**

---

## 4 | La seule addition qui aide les deux (et qui tue le risque n°1 de ShoreWatch)

**Ajoute un baseline NDWI vs SAM, affiché en live.** Sur 3–5 AOI (embouchure turbide = où NDWI casse), affiche : `SAM (phrase) : … | NDWI : … | Δ (m²)`. C'est exactement le slide qui répond au juge qui « fait le NDWI dans sa tête », et ça booste la Profondeur technique. C'est le swap à +2–5% de chances.

---

## 5 | Recommandation forte (décision)

**Le coup le plus malin n'est pas de choisir à l'aveugle — c'est de laisser les données trancher le matin du Jour 1 :**

> **Teste les deux capacités SAM en une matinée** : (a) prompt texte `water` sur 3 scènes côtières Saint-Louis, (b) prompt texte sur 3 scènes rizicoles au nadir. **Celui qui donne des masques nets gagne.**

- Si (a) est net et (b) est de la boue → **ShoreWatch** (le plus probable vu la littérature : eau = classe forte, champs = classe faible).
- Si les deux passent → arbitre sur l'utilisateur : tu veux un payeur institutionnel nommé (ONL) → ShoreWatch ; tu veux le récit « console de décision agricole + 2 modèles Meta » → CONTOUR.

**Mon instinct, pondéré par la littérature et le profil : ShoreWatch est le pari à risque ajusté le meilleur pour le 1er prix.** Odds réalistes : finaliste ~20–25%, 1er prix ~2–4% (conditionnel aux 3 mêmes conditions : héros SAM visible en live, démo = un instrument, utilisateur nommé + honnêteté visible).
