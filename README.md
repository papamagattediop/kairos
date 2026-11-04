<div align="center">

# KAIROS

**Food-supply monitor for Senegal.**<br>
Meta models read the sources. Code computes every number. The system refuses when the data cannot say.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6) ![Tests](https://img.shields.io/badge/tests-189%20passing-2e7d32) ![License](https://img.shields.io/badge/license-MIT-blue)

Meta Global AI Developer Hackathon 2026 · Indie Developer track · *Build for Your World*

</div>

---

## The idea

Rice is the staple of Senegal and most of it is imported. Decisions about it are made on figures nobody can audit. KAIROS inverts the usual use of a language model:

| Meta models do | Code does |
|---|---|
| Read sources, propose values with a verbatim quote, choose tools, look at satellite images | Verify each quote, compute every number, run the out-of-sample tests, decide to publish or refuse |

A model never produces a displayed number. If the data is insufficient, the answer is a refusal with its reason.

## Objective and vision

**Objective.** Give analysts a food-supply view of Senegal in which every number can be traced to a source and the system says "insufficient data" instead of guessing. Rice comes first because it is the most imported staple and the best documented.

**Where it goes next.** Extend the same pipeline, one product at a time, to the other staples: millet, maize, groundnut, onion and cowpea, which are already in the product registry at maturity level 0 (they refuse to display anything until their data has been examined). A product is promoted only when it passes the same gates as rice:

1. an official source with a documented unit and licence;
2. an out-of-sample test with a rule fixed in advance;
3. a measured uncertainty band, or an honest refusal.

Planned steps beyond that: more years and departments in the survey, a satellite predictor retested with a rule announced before looking (radar or marginal-quality optical data for the rainy season), and a regional balance once production, trade and stock data exist at that level. None of this is built yet.

## What it does

| Capability | Detail |
|---|---|
| **Rice yield by department** | Official annual survey (DAPSA EAA 2017-2025), 45 departments. Estimate and error band for the 21 with enough data; the other 24 show *insufficient data*. Interactive map. |
| **Net-imports analysis** | 63 years of FAOSTAT, five models tested one year ahead. None beats persistence under the pre-set rule, so **no forecast is published**: a reference range with its measured coverage is shown instead. |
| **Satellite layers** | Sentinel-2 L2A over the river valley (32 usable dates of 2026): water extent by two methods (NDWI and Sen2Cor class) and NDVI of ESA WorldCover cropland pixels, both reproducible with `scripts/`. Shown as indices, not as crop measures. |
| **Source extraction** | Muse Spark proposes the four balance terms with a quote; the code re-reads number and unit in the quote and rejects what it cannot verify. |
| **Tool-calling agent** | Muse Spark picks among six tools. Every number in its answer must appear in a tool result, or the answer is flagged *unverified*. |
| **Spark + SAM 3.1 loop** | Spark looks at a Sentinel-2 image and proposes concepts, SAM 3.1 segments them, the code measures areas and cross-checks against ESA WorldCover; failed concepts go back to Spark for reformulation. The interface shows the result of a **recorded run** of `scripts/sam-valley-segments.py` (not a live call). |
| **Balance engine** | `gap = demand − production − imports − stock release`, refuses if any term is missing, never substitutes zero. |
| **Offline demo** | Meta replies can be recorded and replayed: no network, no credits. |

## Where Meta models are used

| Model | Role | Guardrail |
|---|---|---|
| **Muse Spark 1.3** | Extraction, tool-calling agent, vision (proposes segmentation concepts) | Numbers verified against quotes and tool outputs |
| **SAM 3.1** | Segmentation of Sentinel-2 imagery, masks decoded with the official `meta-sam-parser` | Areas and cross-checks computed by code |

## Satellite and remote-sensing data

| Source | Used for | Outcome |
|---|---|---|
| Sentinel-2 L2A (Copernicus) | Water extent, cropland NDVI, image given to Spark and SAM 3.1 | Measured; indices only, not validated against field data |
| CHIRPS v3.0 (rainfall) | Tested as a predictor of department rice yield | About 3 % gain in the south, fragile; loss in the north |
| MODIS MOD13Q1 (NDVI) | Tested as a predictor of department rice yield | **Inconclusive**: too few valid pixels in the rainy season |
| ESA WorldCover 2021 | Cropland mask, cross-check of SAM masks | Used |

The department yield estimate itself comes from the official survey; no satellite predictor has shown a reliable gain yet, and we report that instead of claiming one.

## Results, stated plainly

- Yield estimate: out-of-sample mean error **17.4 %** over 163 leave-one-year-out cells (7.7 % in the irrigated north, 23 cells; 19.1 % in the rain-fed south, 140 cells).
- Rainfall (CHIRPS) gain is about 3 % in the south and fragile; MODIS NDVI was inconclusive.
- SAM matched 3 of 23 concepts: two river names and one coarse "green irrigated field" mask (10,891 ha, 47 % of the scene; 70 % of it falls on WorldCover wetland, 23 % on cropland). **No rice-parcel mask**, and no figure depends on SAM.

Full list of negative results and caveats: [docs/LIMITATIONS.md](docs/LIMITATIONS.md).

## Quick start

Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local     # add MODEL_API_KEY (Meta Model API dashboard)
npm run dev                    # http://localhost:3000
```

```bash
npm test                       # 189 tests
npm run typecheck
```

**Offline demo**: `META_REPLAY=1 npm run dev` replays the recorded replies in `data/replay/` and never calls the API; an unrecorded request fails instead of inventing an answer. Record with `META_RECORD=1`.

Never commit `.env.local` or any key.

## Project layout

```
src/lib/decision-engine/   balance calculation and refusal
src/lib/meta/              Meta API client, extraction validator, agent, replay
src/lib/forecast/          FAOSTAT parser, backtest, models, publish-or-refuse gate
src/lib/rice-yield/        retention rules, estimate, empirical band, map paths
src/lib/products/          product registry and maturity levels
src/app/api/               ingest, agent, forecast routes (key stays server-side)
src/components/            extraction, agent, map and SAM panels
data/sources/              derived tables with provenance
data/results/              out-of-sample tests and their reading
data/replay/               recorded Meta replies (public-data questions only)
scripts/                   data pipelines and backtests
docs/                      architecture, limitations, decisions, research
```

Further reading: [architecture](docs/ARCHITECTURE.md) · [limitations](docs/LIMITATIONS.md) · [results protocol](data/results/README.md) · [data feasibility audit](docs/research/FEASIBILITE-DONNEES-PREVISIONS.md)

## Data and attribution

- FAO. 2025. *FAOSTAT: Food Balances (2010-)*. Accessed 3 November 2026. CC-BY-4.0. Selected and analysed by KAIROS; FAO has not endorsed this use.
- DAPSA, *Enquête Agricole Annuelle 2017-2025*, Senegal Open Data portal (dataset 18.3). Rice yield recomputed as production / area.
- Department boundaries: geoBoundaries gbOpen, Senegal ADM2 (CC BY 3.0 IGO).
- Rainfall: CHIRPS v3.0, Climate Hazards Center, UC Santa Barbara. Land cover: ESA WorldCover 2021 (CC BY 4.0). Vegetation: MODIS MOD13Q1 (NASA).
- Contains modified Copernicus Sentinel data 2026 (Sentinel-2 L2A), via Microsoft Planetary Computer.
- Sample values in the interface and in `data/replay/` are fictional and labelled so.

## License

[MIT](LICENSE) © 2026 Papa Magatte Diop
