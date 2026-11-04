# KAIROS

**A food-supply monitor for Senegal: where and when the availability gap opens,
and when the data cannot say.**

KAIROS reads food-balance sources with Meta models, lets the code (not the model)
calculate every number, and refuses to conclude when a term is missing. Rice is the
MVP product; other products are listed with an explicit maturity level and refuse
until their data is examined.

Built for the Meta Global AI Developer Hackathon 2026 (Indie Developer track,
theme: Build for Your World). KAIROS replaces the earlier working name CONTOUR.

## What works today

| Piece | What it does | Status |
|---|---|---|
| Balance engine | `gap = demand - production - imports - stock release` in kt; refuses if any term is missing, never replaces it with zero | Tested |
| Source extraction | Muse Spark proposes the four terms with a quote from the text; code re-reads number and unit in that quote and rejects anything it cannot verify | Tested, used live |
| Tool-calling agent | Muse Spark chooses tools (product registry, balance, extraction, net-imports analysis, department rice yield, ranking); every number in the answer must come from a tool or the answer is flagged unverified | Tested, used live |
| Official data | FAOSTAT food balance of Senegal rice, 14 calendar years (2010-2023), versioned CSV with source, license and citation | Verified (identity checked to 1 kt) |
| Net-imports analysis | 63 years (1961-2023) of net rice imports from two FAOSTAT series spliced with a measured unit factor; five models tested one year ahead in relative error, chosen on the first half of the tests and evaluated on the second | Tested; **the model chosen by the rule does not beat persistence**; a reference range, compatible with its stated level, is published instead of a forecast |
| Product registry | Maturity levels 0 to 4; only rice is above level 0 | Tested |
| Rice yield by department | Official annual agricultural survey (DAPSA EAA 2017-2025) for 45 departments: yield estimated for 21 of them as the department mean over valid campaigns, with a band built from out-of-sample errors (leave one year out). The other 24 show "insufficient data". Interactive map, and two agent tools over the same code | Tested; **rain does not demonstrably improve it** (see `data/results/README.md`) |
| Sentinel-2 water extent | Water surface of a 231 km² zone of the river valley on 32 usable dates of 2026, by two independent methods (NDWI and the Sen2Cor water class), reproducible with `scripts/water-extent.mjs` | Measured; the two methods diverge, not validated |
| Cropland vegetation index | NDVI of the pixels ESA WorldCover (2021) classes as cropland (70.6 km² of the same zone), clouds, shadows and water excluded, on the same 32 dates, reproducible with `scripts/vegetation-index.mjs` | Measured; greenness only, not validated |
| Muse Spark + SAM 3.1 loop | Muse Spark (vision) looks at a Sentinel-2 image and proposes concepts; SAM 3.1 segments them; when SAM returns nothing, Spark gets the failed list and reformulates (3 rounds). Masks are decoded with Meta's official `meta-sam-parser`; the code measures areas and cross-checks each mask against ESA WorldCover. `scripts/sam-valley-segments.py` | Measured; 3 of 21 concepts matched, all river names; **no rice-parcel mask obtained** |
| Offline demo | Meta replies can be recorded and replayed with no network or credits | Verified |

## What is not done (read this before judging)

- **There is no published forecast, and the reason is subtler than "no signal".** KAIROS targets **net rice
  imports** (imports minus exports), not an "availability gap": on observed FAO data the balance closes by
  construction, so the gap is zero. A first analysis on 14 years (2010-2023) published 2,005 kt for 2024
  (1,353 to 2,657 kt); it is **withdrawn**, because it does not hold on the 63-year series.
  Tested one year ahead on 53 forecasts, in relative error:
  - Rule fixed in advance (choose on the first half of the tests, evaluate on the second): the chosen
    model (10-year linear window) has 0.94 times the error of persistence and wins 12 of 27 steps; a margin
    of 10% and a majority were required.
  - Rolling selection on past performance: 0.99 times the error, 17 of 41 steps won. No gain either.
  - **But one model, exponential growth, does better than persistence**: 0.82 times the error on the second
    half (16 of 27 steps) and about 0.90 over the later steps, in each of three eras. No rule based on the
    past ever picks it, because it was worse early in the series. Choosing it now would mean choosing it on
    the data that evaluates it. So the conclusion depends on the selection rule: a growth trend may bring a
    modest gain, but it is not demonstrated, and no model is claimed.
  What KAIROS publishes instead is a **reference range around the last observed value** (2,218 kt in 2023):
  about 1,600 to 3,100 kt for 2024 (the last value times 0.72 and 1.39). At a stated level of 80% it
  covered 25 of the last 33 years (76%; 95% interval 59% to 87%): compatible with 80%, no more. Persistence
  under-predicts (64% of its errors are positive, mean bias about +5%) and the range, symmetric in relative
  terms, does not correct that. Relative errors do not depend on the unit factor, so the unit question below
  affects absolute levels, not these ratios or the coverage. Modelling per capita, tried afterwards, did not
  change the picture.
- **Unit.** The two FAO series are not in the same unit: on the 4 common years (2010-2013) the recent
  series is 1.499 times the old one, every year (1.498 to 1.499), for imports, exports and production.
  That is the usual paddy-to-milled factor, so the recent series is very probably in paddy equivalent;
  this was not confirmed in FAO documentation. The old series (1961-2009) is multiplied by that
  measured factor to build one continuous series; the splice is refused if the factor is not stable.
- **Possible break in the FAO series.** Animal feed use jumps from 68 kt (2018) to 493 kt (2019)
  and 960 kt (2023). This may be an FAO imputation or methodology change; it was not verified.
  It does not enter net imports directly, but it may affect the year 2019.
- **Only FAOSTAT is connected.** USDA PSD and ANSD are identified but not extracted (the
  FAOSTAT API needs a token; the public bulk download was used). Extraction from pasted text
  still works and is labelled "user source".
- **The map shows rice yield, not a balance.** 21 of 45 departments have enough survey years for an estimate; there is no regional availability balance, and the national balance is not split by department. Estimates are department means with an out-of-sample error band, **not** model forecasts: rainfall (CHIRPS) gives no demonstrated overall gain (a small one in the rain-fed south, a loss in the irrigated north), and a MODIS NDVI test was inconclusive (too few valid pixels in the rainy season, 2025 missing). Survey data are imperfect (many round values; 2021 irrigated areas collapse and are excluded). Yields are not rice-specific satellite measures: the cropland mask covers all crops. Details: `data/results/README.md`.
- **The water-extent series is an index, not a crop measure.** NDWI (clouds and cloud shadows
  excluded) and the Sen2Cor water class correlate at 0.82 across the 32 usable dates, but their ratio
  has a median of 1.13 and ranges from 0.15 to 2.75; the lowest value comes from a single date
  (22 July), probably an artifact that was not verified. The January-March rise shows with both
  methods; the August rise shows with the NDWI only. Neither method is validated against field data,
  and water surface is not rice area. No balance figure uses it.
- **The vegetation index is greenness, not production.** The land cover map dates from 2021: it does
  not say what is cultivated in 2026 or which crop, and rice paddies may be classed as cropland or as
  wetland (46% of the zone is wetland), which was not checked. The mean NDVI of cropland pixels ranges
  from 0.18 (14 August) to 0.47 (13 October). The 0.4 "green cover" threshold is indicative and unused.
  Rainfall (CHIRPS) is used only in the department yield test, not in the balance.
- **SAM 3.1 is very sensitive to wording and found no rice parcels.** In the latest run Muse Spark proposed 21 concepts over 3 rounds; SAM returned a mask for 3 ("yellow river", "yellow creek", "winding creek", about 685 to 798 ha, 80 to 92% on the WorldCover permanent-water class). Every field, crop, wetland and pond concept returned nothing in that run (an earlier run matched "green wetland" and "brown cropland"; results vary between runs). No yield, area or production figure depends on SAM. The decoder is the official `meta-sam-parser` package, installed in an isolated environment.
- **"Real time" means recompute on new data.** Public sources are annual or monthly.
- The balance engine refuses negative demand, production and imports (a net exporter would be
  refused: to be confirmed). The forecast code has no such guard; its lower bound could become
  negative on other data, and the chart handles it.

## Where Meta models are used

- **Muse Spark 1.3** (`muse-spark-1.3`): extracts balance terms from text and acts as the
  tool-calling agent. It never produces a displayed number: the code validates each value
  against a verbatim quote and computes the balance.
- **SAM 3.1** (`sam-3.1`): segmentation test on Sentinel-2 imagery (see limits above).

## Run it

Requirements: Node.js 20.9 or later and npm.

```powershell
npm install
copy .env.example .env.local    # then add MODEL_API_KEY from the Meta Model API dashboard
npm run dev
```

Open `http://localhost:3000`. Checks:

```powershell
npm test
npm run typecheck
```

Never commit `.env.local` or any key.

### Offline demo (no network, no credits)

`META_RECORD=1` saves each Meta reply under `data/replay/`; `META_REPLAY=1` replays them
and never calls the API. A request that was never recorded fails instead of inventing an
answer. The recorded replies (`data/replay/`, versioned on purpose) come from fictional sample
text and from public-data questions (FAOSTAT, EAA) only; never record real visitor text.

## Project structure

- `src/lib/decision-engine/` - balance calculation and refusal
- `src/lib/meta/` - Meta API client, extraction validator, agent, replay
- `src/lib/forecast/` - FAOSTAT parser, backtest, models, interval and the publish-or-refuse gate
- `src/lib/products/` - product registry and maturity levels
- `src/lib/rice-yield/` - department rice yield: retention rules, estimate and empirical band (code), generated map paths and EAA/rain records
- `src/app/api/ingest` and `src/app/api/agent` - server routes (key stays server-side;
  size limits and rate limits protect credits)
- `src/components/` - source extraction, agent and map panels
- `data/sources/` - derived tables with provenance (FAOSTAT, EAA by department, CHIRPS by department, MODIS NDVI); `data/results/` - out-of-sample tests and their reading; `data/incoming/` - raw downloads (not versioned, `MANIFEST.md` lists URLs and SHA-256); `data/replay/` - recorded Meta replies
- `scripts/` - data pipelines (EAA, CHIRPS, MODIS NDVI, backtests, map paths)
- `docs/` - architecture, plan, decisions, research and the agent loop log

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the target design,
[docs/management/BOUCLE-AGENTS.md](docs/management/BOUCLE-AGENTS.md) for how the build was
run, and [docs/research/FEASIBILITE-DONNEES-PREVISIONS.md](docs/research/FEASIBILITE-DONNEES-PREVISIONS.md)
for the data audit.

## Data and attribution

- Food balance: FAO. 2025. FAOSTAT: Food Balances (2010-). Accessed on 3 November 2026.
  https://www.fao.org/faostat/en/#data/FBS Licence: CC-BY-4.0. Selected and analysed by KAIROS;
  FAO has not endorsed this use.
- Department boundaries: geoBoundaries gbOpen, Senegal ADM2, CC BY 3.0 IGO.
- Yields, areas, production by department: DAPSA, Enquête Agricole Annuelle 2017-2025, Senegal Open Data portal (dataset 18.3). Rice yield recomputed as production / area.
- Rainfall: CHIRPS v3.0, Climate Hazards Center, UC Santa Barbara. Land cover: ESA WorldCover 2021 (CC BY 4.0). Vegetation: MODIS MOD13Q1 (NASA), via Microsoft Planetary Computer.
- Imagery: Contains modified Copernicus Sentinel data 2026 (Sentinel-2 L2A, via Microsoft
  Planetary Computer).
- All sample values in the interface and in `data/replay/` are fictional and labelled so.

## License

Open-source publication is a submission requirement. A license has not been chosen yet:
add one before publishing the repository.
