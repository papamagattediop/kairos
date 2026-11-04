# Limitations and negative results

What KAIROS does not do, and what it tried and could not show. Nothing here is hidden behind a number in the interface.

## Net-imports forecast: no model claimed

KAIROS targets **net rice imports** (imports minus exports), not an availability gap: on observed FAO data the balance closes by construction, so the gap is zero.

A first analysis on 14 years (2010-2023) published 2,005 kt for 2024 (1,353 to 2,657 kt). It is **withdrawn**: it does not hold on the 63-year series.

Five models, tested one year ahead on 53 forecasts, in relative error:

- **Rule fixed in advance** (choose on the first half of the tests, evaluate on the second, with a required margin of 10 % and a majority of steps). The chosen model (10-year linear window) has 0.94 times the error of persistence and wins 12 of 27 steps. Not enough.
- **Rolling selection on past performance.** 0.99 times the error, 17 of 41 steps won. No gain.
- **Exponential growth** does better: 0.82 times the error on the second half (16 of 27 steps), about 0.90 over the later steps, in each of three eras. No rule based on the past ever picks it, because it was worse early in the series. Choosing it now would mean choosing it on the data that evaluates it.

So the conclusion depends on the selection rule. A growth trend may bring a modest gain; it is not demonstrated, and **no model is claimed**.

What is published instead is a **reference range around the last observed value** (2,218 kt in 2023): about 1,600 to 3,100 kt for 2024 (last value times 0.72 and 1.39). At a stated 80 % level it covered 25 of the last 33 years (76 %, 95 % interval 59 % to 87 %): compatible with 80 %, no more. Persistence under-predicts (64 % of its errors are positive, mean bias about +5 %) and the symmetric range does not correct that. Modelling per capita did not change the picture.

## Unit of the FAO series

The two FAO series are not in the same unit. On the 4 common years (2010-2013) the recent series is 1.499 times the old one every year (1.498 to 1.499), for imports, exports and production. That is the usual paddy-to-milled factor, so the recent series is very probably in paddy equivalent. This was not confirmed in FAO documentation. The old series (1961-2009) is multiplied by the measured factor to build one continuous series; the splice is refused if the factor is not stable. Relative errors and coverage do not depend on this factor.

## Possible break in the FAO series

Animal feed use jumps from 68 kt (2018) to 493 kt (2019) and 960 kt (2023): possibly an FAO imputation or methodology change, not verified. It does not enter net imports directly but may affect 2019.

## Rice yield by department

- The estimate is the department's geometric mean over valid campaigns. The band holds 80 % of the out-of-sample errors pooled by group (irrigated north, rain-fed south): it describes the group, not a guarantee for one department.
- 21 of 45 departments have at least 7 valid campaigns (2017-2025 without 2021) and a mean rice area of at least 1,000 ha. The north conclusion rests on 3 departments.
- Rainfall (CHIRPS) brings about 3 % in the south (fragile: one test among several, 8 campaigns) and degrades the north.
- MODIS NDVI is **inconclusive**: too few valid pixels in the rainy season, the last campaign missing, a non-representative sub-sample.
- Survey data are imperfect (many round values). 2021 is excluded because irrigated areas collapse in the source (Dagana: 775 ha instead of about 50,000).
- The cropland mask covers all crops, not only rice.

Protocol and numbers: [`data/results/README.md`](../data/results/README.md).

## Satellite indices

- **Water extent.** NDWI and the Sen2Cor water class correlate at 0.82 across 32 usable dates, but their ratio has a median of 1.13 and ranges from 0.15 to 2.75 (lowest value from a single date, probably an artifact, not verified). Neither is validated against field data, and water surface is not rice area.
- **Vegetation index.** Greenness, not production. The land cover map dates from 2021; rice paddies may be classed as cropland or wetland (46 % of the zone is wetland), not checked. The 0.4 "green cover" threshold is indicative and unused.

## SAM 3.1

SAM is very sensitive to wording. In the latest run (the prompt asks Spark for at least three irrigated-crop concepts) Muse Spark proposed 23 concepts over 3 rounds and SAM returned a mask for 3: "yellow water" and "yellow stream" (about 780 to 800 ha, 80 % on the WorldCover permanent-water class) and "green irrigated field", a single 10,891 ha blob (47 % of the scene) of which 70 % falls on WorldCover herbaceous wetland and 23 % on cropland; it covers 36 % of the cropland class and 71 % of the wetland class. That is the whole green belt, not parcels: wetland and cropland cannot be told apart, which is the very ambiguity noted above. "rectangular field", "crop plots", "green paddy", "irrigation canal" and the other crop concepts returned nothing. Earlier runs gave other matches ("green wetland", "brown cropland", river names): results vary between runs. **No rice-parcel mask was obtained**, and no yield, area or production figure depends on SAM.

## Scope

- Only FAOSTAT is connected for the balance. USDA PSD and ANSD are identified, not extracted. Extraction from pasted text works and is labelled "user source".
- The map shows rice yield, not a balance: there is no regional availability balance.
- "Real time" means recompute on new data; public sources are annual or monthly.
- The balance engine refuses negative demand, production and imports (a net exporter would be refused: to be confirmed). The forecast code has no such guard; its lower bound could become negative on other data, and the chart handles it.
