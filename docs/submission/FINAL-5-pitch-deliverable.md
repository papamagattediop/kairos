# FINAL 5 — Meta Global AI Developer Hackathon 2026
### Pitch-ready deliverable for Papa Magatte Diop (Dakar, indie track, solo, 10 days, live demo required)

Rubric weights used throughout: Impact 30% · Meta Tooling 25% · Demo 25% · Depth 20%.
Winning rules enforced on every entry: wound > widget · sponsor capability = visible punchline · one sentence / one flow / runs live · prove with numbers · 90 seconds.

---

## 1. PRIXVU — the judge's #1 (8.00)

**Title:** PrixVu
**Tagline:** *Snap the board. Track the price.*
**Theme:** 1 — Build for Your World

**The wound (first-person, for the form):**
> I already shipped a food-price tracker for Dakar households — but every price in it was typed by hand. The real price board of a market is chalk, sunlight, and Wolof-French mix; updating it is a daily hour of manual entry. My tracker is only as fresh as my patience for typing.

**One-sentence pitch (what the judge repeats):**
> Photograph any Dakar market price board — chalk, paint, or print — and Muse Spark reads it, types it, and pushes it into a live price-alert dashboard in under 10 seconds.

**What it does:**
A market vendor or the user photographs a price board with a phone. The photo goes to Muse Spark 1.3 with a JSON schema (item, unit, price XOF, quality/grade, line confidence). Spark returns typed rows plus flags for illegible lines and anomalies versus the stored price history. Rows land in the existing tracker's dashboard; a threshold rule fires a household alert ("Oignon rouge +22% vs hier"). Every extraction keeps the cropped line image for human confirmation when confidence is low — the model never silently invents a price.

**Meta tool mapping (signature capability, and why a wrapper doesn't qualify):**
- **Muse Spark 1.3 — multimodal input + schema-constrained structured output + agentic comparison in one call.** The signature moment: a *handwritten chalk board* enters as an image; typed, validated JSON with per-row confidence comes out, already compared against yesterday's series. An OCR-API-plus-regex wrapper fails exactly here — OCR has no notion of "this line is onion at 1250 FCFA/kg vs yesterday's 1025," no schema discipline, no illegibility judgment. The visible punchline on stage is Spark doing perception → typing → reasoning about the price series in a single flow.

**Rubric scores (target profile):**
| Criterion | Score | The line that wins it |
|---|---|---|
| Impact (30%) | 9 | "Food prices are the #1 daily economic pain in Dakar; the tracker already exists — this removes its bottleneck." |
| Tooling (25%) | 8 | "One Spark call: photo in, typed price records with confidence and anomaly flags out." |
| Demo (25%) | 9 | "Phone snap → JSON on screen → dashboard row → alert banner, live in 90 seconds." |
| Depth (20%) | 7 | "Schema validation + confidence gating + human-confirm queue + anomaly detection vs stored history." |

**10-day build plan (solo, API-only):**
- **Days 1–2 (verify, kill-or-continue):** Collect 30 real board photos (Sandaga, Grand Yoff, HLM, Castors — printed/painted boards first, chalk second). Run them through Spark with a draft schema. Measure field-level accuracy by hand. *Go/no-go: ≥85% on printed boards, ≥70% on chalk.*
- **Days 3–4:** Lock the schema; build the extraction service (photo → Spark → validated rows + confidence). Build the line-crop preview for confirmations.
- **Days 5–6:** Wire into the existing tracker DB/API. Threshold alert rules (per item, per day, per %). Dashboard: "newest board" view + alert feed.
- **Day 7:** Failure UX — illegible line handling, retry-with-second-angle, manual override with audit log.
- **Day 8:** Demo assets: printed prop board, pre-loaded 7-day price history, seeded alert.
- **Day 9:** Full 90-second run-through ×5, timed; fallback screenshots if API hiccups.
- **Day 10:** Buffer + submit video/application.

**90-second live demo script:**
- **0–10s:** "Every morning, Dakar's real price board is this — chalk. My tracker has the prices; getting them in is manual. Watch." Show dashboard with yesterday's prices.
- **10–25s:** Photograph a real price-board prop with the phone; photo appears on screen.
- **25–45s:** Spark call runs live → JSON streams in: `{item:"Oignon rouge", unit:"kg", price_xof:1250, confidence:0.94}`.
- **45–60s:** Rows land in the dashboard; alert banner fires: **"Oignon rouge +22% vs hier — seuil dépassé."**
- **60–75s:** Point to one flagged low-confidence line → crop shown → one-tap human confirm. "The model never guesses; it asks."
- **75–90s:** "30 boards, 5 markets, 94% typed without human touch. From photo to household alert in one flow."

**The "prove it" metric:** **≥92% field-level extraction accuracy on 50 photographed boards** (ground truth by hand), plus **≤10s photo→dashboard** and **≥70% of lines zero-touch**.

**Biggest risk + mitigation:** Handwritten/chalk boards degrade extraction. → Mitigation: (a) start with painted/printed boards (most Sandaga stalls) where accuracy is high and demo is safe; (b) second-photo retry under better light before flagging; (c) confidence gate + human-confirm queue means errors are visible and correctable — and honestly reported in the pitch ("70–80% zero-touch on chalk, 95%+ on printed"); (d) the demo prop is a printed board, so the stage never depends on bad chalk.

**Application-form angle:**
- *Idea clarity/feasibility:* "This is not a new product idea — it is the missing 20% of a product I have already built and deployed [link tracker]. The wound (manual entry) is mine, documented in my own backlog. 10 days is enough because the tracker, its users, and its data model already exist; only the extraction pipeline is new."
- *Demonstrated technical skill:* "I ship: [tracker] is live with real Dakar price data. As a statistician, I don't trust my own model — I hand-labeled 50 boards to measure extraction accuracy, and I built a confidence-gated human-in-the-loop so wrong prices never silently enter a system households rely on."

---

## 2. SHOREWATCH — Theme 2's best bet (7.68)

**Title:** ShoreWatch
**Tagline:** *Describe the coast in words. Get a decade of measurement.*
**Theme:** 2 — Push the Frontier

**The wound:**
> Saint-Louis is losing ground to the Atlantic — the Langue de Barbarie spit has shifted for decades, yet erosion rates reaching local planners arrive years late, from studies nobody can update. I live in the country whose coastline is a moving border.

**One-sentence pitch:**
> Type "the shoreline of the Langue de Barbarie" into SAM 3.1 and watch it track that same coastline across ten years of Copernicus satellite frames — outputting meters-per-year erosion, validated against published rates.

**What it does:**
A noun phrase ("shoreline of Langue de Barbarie, Saint-Louis") seeds SAM 3.1 on a Sentinel-2 frame from 2015. SAM returns the mask; SAM's cross-frame identity tracking carries that same shoreline entity through 2015–2025 frames (cloud gaps and seasonal noise included). Each year's shoreline position becomes a transect measurement; the slope is erosion rate in m/year with a confidence band. The result is a dashboard: animated map (mask marching inland), rate card, and the published literature rate plotted on the same axis as a validation marker.

**Meta tool mapping:**
- **SAM 3.1 — noun-phrase → mask + cross-frame identity tracking.** The signature capability is *identity*: the same coastline kept tracked as one entity across a decade of frames. A per-image-segmentation wrapper (segment each frame, diff masks) produces noise, not measurement — it re-acquires the "shoreline" every frame, loses it in cloud shadow, and its year-to-year delta is meaningless. The visible punchline: one ID badge on the coast, persisting as the timeline scrubs 2015→2025.

**Rubric scores (target profile):**
| Criterion | Score | The winning line |
|---|---|---|
| Impact (30%) | 7 | "Coastal erosion displaces Saint-Louis communities; an updatable measurement tool is climate adaptation infrastructure." |
| Tooling (25%) | 9 | "Cross-frame identity tracking on a decade of real satellite imagery — the sponsor's frontier capability, made visible." |
| Demo (25%) | 8 | "Word phrase → mask → timeline scrub → a rate counting up on a map nobody has animated before." |
| Depth (20%) | 8 | "Tide/season normalization, confidence bands, and validation against published rates — statistics done honestly." |

**10-day build plan:**
- **Days 1–2 (verify):** Pull Sentinel-2 L2A for Saint-Louis tile 2015–2025 via Copernicus/Planetary Computer; count cloud-free scenes per year. Test SAM 3.1 noun-phrase call + cross-frame tracking on 3 frames. *Go/no-go: ≥6 usable scenes/year, tracking holds across a 2-month gap.*
- **Days 3–4:** Build scene-selection pipeline (cloud mask, median composite per year, one demo frame per year kept raw for SAM).
- **Days 5–6:** SAM runs per year + tracking pass; transect extraction (NORTH-oriented transects every 100 m); rate = OLS slope per transect; aggregate + bootstrap CI.
- **Days 7:** Validation: pull 2–3 published rates for the stretch (academic papers, ANAC/Coastal Zone studies); overlay on dashboard.
- **Day 8:** Dashboard: animated map, timeline scrubber, rate card with CI, literature marker.
- **Days 9–10:** Demo rehearsal + buffer; pre-cache every API response as fallback.

**90-second live demo script:**
- **0–10s:** "This is Saint-Louis. The ocean is eating it. Measuring how fast normally takes a research project." Show a 2015 frame.
- **10–25s:** Type the noun phrase → SAM 3.1 returns the shoreline mask; identity badge lights up.
- **25–50s:** Scrub the timeline: mask follows the same coast 2015→2025, skipping cloudy frames, ID never breaks.
- **50–70s:** Rate card appears: **"-4.8 m/an (IC 95%: 3.9–5.7)"**; literature marker on the same chart: "published: -3 to -7 m/an."
- **70–90s:** "One sentence in, a decade of measurement out — and it lands inside the published range. That's SAM watching a coastline the way a human would: remembering what it saw."

**Prove it metric:** **Computed mean erosion rate falls within the published range for the chosen stretch** (e.g., within ±20% of the published mean), with CI shown; ≥6 cloud-controlled frames per year.

**Biggest risk + mitigation:** Shoreline noise fabricates false trends (tide level ≠ erosion). → Mitigation: (a) use near-tide proxy — select scenes from a narrow tide window where tide data is available (Copernicus coastal tide services / global tide models), or median-composite per year; (b) measure along fixed transects, not raw mask area; (c) report per-transect spread, not one headline number; (d) validation against published rates is *part of the product*, not an afterthought — if my number disagrees with the literature, the dashboard shows it; (e) pick the best-documented 8–10 km stretch, not the whole coast.

**Application-form angle:**
- *Clarity/feasibility:* "Copernicus data is free and public; SAM 3.1's API does the hard part (identity across frames). The 10-day risk is data plumbing, not invention — and Days 1–2 are a hard go/no-go on scene availability before I commit."
- *Technical skill:* "I'm a statistician: the pitch isn't a pretty map, it's an OLS slope with bootstrap confidence intervals, tide normalization, and validation against peer-reviewed rates. I will show my error bars — and where I disagree with the literature."

---

## 3. BUDGET-1M (7.55)

**Title:** BUDGET-1M
**Tagline:** *The whole corpus. One prompt. With receipts.*
**Theme:** 1 — Build for Your World

**The wound:**
> Senegal's public statistics — census tables, finance laws, household surveys — sit in hundreds of PDFs that no one reads across. Every comparison ("does the region with 18% of the people get 18% of the health budget?") takes a researcher a week. As a statistician, I watch policy arguments run on vibes because the corpus is too big to hold in one head.

**One-sentence pitch:**
> Drop the entire Senegalese census + budget + survey corpus into Muse Spark's 1M-token context and get a cited one-page policy brief with every number machine-verified against its source page.

**What it does:**
The ANSD census tables, the Loi de Finance, and EHCVM survey extracts are converted to text and loaded into a single Spark call (~700–900k tokens). The prompt asks one comparative question (e.g., "population share vs. health budget share by region, plus 5-year trend where available") and demands structured output: claims + page-cited evidence + a choropleth data table. A verification pass then regex/extracts each cited page-span from the source text; claims without a verified span are dropped or flagged. Output: a one-page brief where every sentence carries a clickable [p. XX] that opens the highlighted source paragraph.

**Meta tool mapping:**
- **Muse Spark 1.3 — 1M-token context + multimodal document reasoning + structured cited output.** Signature capability: *the entire corpus in one prompt*. A RAG wrapper (chunk → embed → retrieve → answer) cannot do this task: cross-document comparisons die at chunk boundaries, retrieval silently drops the one table that contradicts the narrative. The punchline on stage: the context bar filling to 800k tokens — "the whole corpus is in the room" — and answers that span three documents at once, with receipts.

**Rubric scores (target profile):**
| Criterion | Score | The winning line |
|---|---|---|
| Impact (30%) | 8 | "Citizens, journalists, and MPs get week-long statistical comparisons in minutes, from the official sources only." |
| Tooling (25%) | 9 | "800k tokens of Senegalese public statistics in one prompt — 1M context as the whole architecture, not a feature." |
| Demo (25%) | 7 | "Corpus loads, brief writes itself, every [p. XX] click opens the real source paragraph." |
| Depth (20%) | 7 | "Machine citation verification: no claim ships unless its page-span is matched in the source text." |

**10-day build plan:**
- **Days 1–2 (verify):** Download the corpus (ANSD open data, Journal Officiel finance laws, EHCVM reports). Extract text (pdfplumber for tables). Measure token count. Test Spark with 200k, then full corpus. *Go/no-go: full corpus ≤ ~900k tokens and extraction of tables is usable.*
- **Days 3–4:** Ingestion pipeline: PDF → text + page anchors; build the corpus packer + prompt template with output schema (claims[] with page cites + choropleth rows).
- **Days 5–6:** Verification pass: claim → cited span → string match/normalized match in source; badge per claim (verified/flagged); drop rule.
- **Day 7:** Brief renderer (one page, Senegal choropleth from returned table, clickable cites → source viewer).
- **Day 8:** Pick 3 demo questions that make a senator wince; pre-run, then re-run live.
- **Days 9–10:** Rehearsal, fallbacks (cached JSON), submission.

**90-second live demo script:**
- **0–10s:** "1,200+ pages of Senegalese public statistics. Nobody reads across them. Watch."
- **10–25s:** Load the corpus pack → context bar fills: **"782,431 tokens — census + budget + surveys, one prompt."**
- **25–45s:** Type the question: "Population share vs. health budget share by region, 5-year trend, cite pages." Spark runs.
- **45–70s:** Brief writes: claims with [p.214] [p.58] cites; choropleth renders; one sentence highlighted: "Region Thiès: 17.8% of population, 11.2% of health budget."
- **70–90s:** Click [p.214] → source paragraph opens, span highlighted. Banner: **"12/12 citations verified against source text. Unverified claims are dropped, not shown."** — "It's fast *and* it can't lie about where it got the number."

**Prove it metric:** **100% of displayed citations machine-verified** against source page-spans (verification panel counts shown live); full-corpus call completes **<5 minutes**.

**Biggest risk + mitigation:** Hallucinated citations. → Mitigation: the verification pass is the product — page-span string match before a claim is displayed; unverified claims get dropped or visually flagged; the live demo shows the verifier badge counting 12/12. Also mitigate table-extraction garbage: spot-check 10 pages per source document; keep official PDFs linked as the ultimate fallback for any flagged claim.

**Application-form angle:**
- *Clarity/feasibility:* "No new data collection: the corpus is already public and downloadable. The engineering risk is token budget + citation integrity, both testable in 48 hours. I as a statistician can validate the output better than most applicants can validate their model's outputs."
- *Technical skill:* "The differentiator is not prompting — it's the verification layer I build around Spark: schema, page anchors, span matching, drop rules. That's engineering discipline a statistics background gives me for free."

---

## 4. PARCELZERO (7.55)

**Title:** ParcelZero
**Tagline:** *Type a field. Get hectares.*
**Theme:** 1 — Build for Your World

**The wound:**
> The Niayes — the market-gardening belt that feeds Dakar — has no up-to-date map of what's actually under cultivation. Ministries plan irrigation water on decade-old inventories. I can measure a field from satellite in minutes now; nobody does, because the map doesn't exist.

**One-sentence pitch:**
> Type "irrigated fields of the Niayes" and SAM 3.1 paints every matching field block on Sentinel-2 imagery, summing them into a hectares-per-commune choropleth in one flow.

**What it does:**
The user types a noun phrase ("champs irrigués des Niayes"). SAM 3.1 runs on current Sentinel-2 tiles across the Niayes belt and returns masks for every region matching the phrase. Masks are vectorized, dissolved into field blocks, and area-computed in hectares per commune; the result renders as a live choropleth with a ranked table. A validation panel shows 30 hand-checked sample polygons (from OSM/open cadastral traces) with per-block area error — the honest resolution story is on screen, not buried.

**Meta tool mapping:**
- **SAM 3.1 — noun-phrase → mask over arbitrary regions, at scale.** Signature capability: *language-driven segmentation* — the query is a phrase in French, not a training run or a pixel recipe. A supervised crop-classifier wrapper would need labeled Niayes training data that doesn't exist and would output a class raster, not instantiable hectare polygons. Punchline on stage: the phrase typed on screen → masks blooming on the map → hectares counting up.

**Rubric scores (target profile):**
| Criterion | Score | The winning line |
|---|---|---|
| Impact (30%) | 7 | "Irrigation planning for the belt that feeds a capital of 3M+, mapped on demand instead of once per decade." |
| Tooling (25%) | 8 | "A noun phrase in French becomes hectare polygons — language as the segmentation interface." |
| Demo (25%) | 8 | "Type → masks → choropleth animates; it's the most 'magic' 30 seconds of the five." |
| Depth (20%) | 6 | "Mask→polygon vectorization, block dissolve, and a validation panel with measured area error." |

**10-day build plan:**
- **Days 1–2 (verify):** Grab 3 Sentinel-2 scenes over the Niayes (Bargny, Sebikotane, Malika axis). Run SAM 3.1 with "champs irrigués" in French and English. Check: are small plots visible at 10m? *Reframe go/no-go: if plots < ~0.5 ha are unresolvable, the product is FIELD-BLOCK mapping, not parcel mapping — say so openly.* Check OSM for validation polygons.
- **Days 3–4:** Tiling pipeline over the Niayes bbox; SAM batch runs; mask vectorization (rasterio/shapely); block dissolve by commune boundary (admin boundaries from OSM/GADM).
- **Days 5–6:** Hectare math (pixel-area projection-aware), choropleth UI, ranked commune table.
- **Day 7:** Validation panel: 30 sample polygons, per-block % area error, aggregate stats.
- **Day 8:** Demo prompt set (3 phrases: irrigated fields / bare soil / fallow — show one, keep two as bonus).
- **Days 9–10:** Rehearsal, cached fallback, submission.

**90-second live demo script:**
- **0–10s:** "The Niayes feed Dakar. Nobody has a current map of it. There's no form to fill in — you just say what you want."
- **10–30s:** Type **"champs irrigués des Niayes"** → SAM 3.1 runs → masks paint across the satellite tile.
- **30–55s:** Choropleth builds commune by commune; table: "Bargny 412 ha · Sebikotane 388 ha · …"; total counts up.
- **55–75s:** Validation panel: "30 hand-checked blocks: median area error 11%. At 10m resolution I map field *blocks*, not cadastral parcels — and I show the error."
- **75–90s:** "From a noun phrase to hectares in one flow. Change the phrase, get a different map — no training data required."

**Prove it metric:** **Median area error ≤15% against 30 hand-validated polygons**, mapped coverage reported honestly (field blocks ≥ ~0.5 ha at 10m).

**Biggest risk + mitigation:** 10m Sentinel-2 resolution breaks "cadastral parcel" claims. → Mitigation: reframe *in the title and on stage* as **field-block mapping** ("I map what irrigation looks like from space, and I say exactly what that resolution means"); validation panel with measured error is displayed, not hidden; small-plot exclusion threshold stated; if Planet/air imagery is unavailable, don't fake it — the honesty *is* the credibility with a statistics-literate judge.

**Application-form angle:**
- *Clarity/feasibility:* "Fixed geography (Niayes), free imagery, SAM does the perception. The one honest constraint — 10m resolution — is designed into the product claim (field blocks, error bars), not papered over."
- *Technical skill:* "Geospatial pipeline: tiled SAM inference, projection-aware hectare math, vector dissolve by admin unit, and a validation set I hand-labeled. I measure my own error before anyone asks."

---

## 5. CARRAPIDE (7.25)

**Title:** CarRapide
**Tagline:** *Traffic that remembers every vehicle.*
**Theme:** 2 — Push the Frontier

**The wound:**
> Dakar's traffic decisions — signal timing, BRT planning, lane rules — run on counts from the 2014 census-era surveys. I cross Point E every morning in a car rapide; the data that governs that intersection is a decade stale, and "count the cars" has never been cheaper than hiring a person with a clipboard.

**One-sentence pitch:**
> Film any Dakar intersection and SAM 3.1 tracks every car rapide and taxi with a persistent ID across the clip — turning 60 seconds of video into per-vehicle counts, dwell times, and flow, no clipboard required.

**What it does:**
A 60-second phone clip of a busy intersection (Point E, Liberté 6) is processed by SAM 3.1: each vehicle is segmented and assigned a persistent identity that survives occlusion (a car rapide passing behind a bus keeps its ID). The dashboard streams live counts — unique vehicles, unique car rapides, mean dwell at the light, per-direction flow — and shows the ID ledger: "vehicle #17: entered 00:12, still tracked at 00:58, 3 occlusions survived." An honest accuracy panel reports ID switches against a hand-labeled 15-second ground-truth segment.

**Meta tool mapping:**
- **SAM 3.1 — cross-frame identity tracking over video.** Signature capability: *persistence*. A per-frame detector (YOLO-style wrapper) counts boxes, not vehicles — it double-counts everything that leaves and re-enters the frame and has no answer for occlusion, which is most of a Dakar intersection. The visible punchline: colored ID badges holding steady on vehicles as they pass behind buses, with the unique-vehicle counter staying honest.

**Rubric scores (target profile):**
| Criterion | Score | The winning line |
|---|---|---|
| Impact (30%) | 7 | "Fresh, free, on-demand traffic counts for a city whose transport data is a decade old." |
| Tooling (25%) | 9 | "Persistent identity through occlusion — SAM 3.1's tracking as the whole point, not a bolt-on." |
| Demo (25%) | 8 | "Boxes with stubborn ID badges on real Dakar footage; the counter that doesn't lie is mesmerizing." |
| Depth (20%) | 6 | "Hand-labeled ground truth segment, ID-switch count, recall — measured, not claimed." |

**10-day build plan:**
- **Days 1–2 (verify):** Film 3 clips (Point E morning, Liberté 6 midday, one roundabout) from a safe vantage. Run SAM 3.1 tracking API on a 30s segment. Measure: does an ID survive a 5-second occlusion? *Go/no-go: ≥1 ID-switch-free occlusion per clip and total pipeline <3× clip length.*
- **Days 3–4:** Ingestion: clip → frame stream → batched SAM tracking calls; ID ledger table (id, first/last seen, occlusion count).
- **Days 5–6:** Dashboard: streaming counts (unique vehicles, vehicle class incl. car rapide/taxi recognition via noun-phrase second pass or simple class prompt), dwell time, direction split via entry/exit zones drawn on the frame.
- **Day 7:** Ground truth: hand-label 15s of the demo clip; compute recall + ID switches; accuracy panel.
- **Day 8:** Demo hardening: run the *exact* demo clip through the *exact* pipeline on stage; pre-compute nothing except fallbacks.
- **Days 9–10:** Rehearse latency live; submit.

**90-second live demo script:**
- **0–10s:** "This is Point E, 8am. The last proper count of this intersection is from 2014. Film it and press run."
- **10–40s:** Hit **Run** → clip plays with live boxes + ID badges; one car rapide disappears behind a bus and its badge **survives** — call it out: "#23 is back."
- **40–65s:** Counts stream: **"47 véhicules uniques · 12 car rapides · dwell moyen 34s · 61% direction Almadies."**
- **65–80s:** Accuracy panel: "Hand-labeled 15s ground truth: recall 92%, **2 ID switches / 60s**. A per-frame detector would report 83 'vehicles' — it counts the same bus four times."
- **80–90s:** "SAM doesn't just see traffic — it remembers each vehicle. That's the difference between boxes and data."

**Prove it metric:** **Recall ≥90% and ID switches ≤3 per 60s clip** vs hand-labeled ground truth; pipeline completes **<3× realtime** (or states its honest throughput).

**Biggest risk + mitigation:** Live latency + ID flicker. → Mitigation: (a) the demo runs the pipeline live on a *pre-filmed* clip — "live" means the model actually executes on stage, not that the camera is hot; (b) choose a vantage with clean occlusion moments, not max chaos; (c) frame-sampling rate tuned so the run fits the 90s slot (state throughput honestly: "we process 1 frame every 0.5s"); (d) accuracy panel pre-empts the judge's doubt with hand-labeled truth.

**Application-form angle:**
- *Clarity/feasibility:* "Data collection is trivial (a phone and an intersection); SAM's API does the perception+tracking. The risk is latency, which is an engineering-number problem I bound with a go/no-go on Day 2."
- *Technical skill:* "Tracking systems live or die on evaluation: I hand-labeled a ground-truth segment and report recall and ID switches on stage. That's the statistician's habit applied to computer vision."

---

## RECOMMENDATION — pick ONE

**Pick PrixVu.** Reasons, in order of rubric weight:

1. **The wound is proven, not performed.** He *already shipped* the tracker. "I built the widget, the widget hurt here, this fixes it" is the purest possible answer to "bring a wound not a widget" — and no competitor can copy that authenticity in an application form.
2. **Lowest execution risk for a solo junior in 10 days.** One API (Spark), one schema, one dashboard he already owns. Every other idea carries a data-acquisition or geospatial-pipeline risk that can burn 3 of 10 days.
3. **Demo dominance in 90 seconds.** Photo → JSON → dashboard row → alert banner is legible to every judge, live, with a physical prop. It's the only idea where the sponsor capability (multimodal structured output) and the demo motion are the *same gesture*.
4. **Numbers he can actually own.** 92% accuracy on 50 hand-labeled boards is a statistician's proof — measurable by him, defensible under questioning.

**Dark horse: ShoreWatch**, only if the Day-1–2 checklist passes (≥6 usable scenes/year AND tracking survives a frame gap). Theme 2 is the differentiation play (see below), and a coastline animating over a decade is the most *memorable* image of the five. But it is a geospatial pipeline, and pipelines kill solo hackathons.

**Avoid as primary:** BUDGET-1M (safest to build, weakest live visual — a page of text generating is a weaker stage moment than a photo or a map); ParcelZero (resolution honesty limits the claim); CarRapide (live-video tracking is the highest-latency risk of the set).

---

## DIVERSIFICATION NOTE — Theme 1 vs Theme 2 strategy

The top 5 splits **3 × Theme 1 / 2 × Theme 2**. Read that as a map of where the crowd is, not where the value is:

- **Theme 1 ("Build for Your World") is the default indie lane** — most solo devs will land here because "local problem + API wrapper" is the easiest narrative. PrixVu competes in the crowded lane *but wins it on authenticity* (real shipped product, real users). If the applicant pool skews wrapper-y, PrixVu's wound-story is a genuine outlier.
- **Theme 2 ("Push the Frontier") is likely less crowded.** It demands a capability demonstration (tracking, measurement) rather than a product story — higher floor, fewer entrants. ShoreWatch and CarRapide both put a *signature SAM capability* (cross-frame identity) on stage in a way Theme 1 projects mostly can't. A judge scoring "Use of Meta Tooling 25%" will find the frontier entries more distinctive on that axis.
- **Strategic read:** apply with **PrixVu as primary** (highest expected value: best score × lowest risk). If the 48h checklist for ShoreWatch passes cleanly and he wants a differentiation bet, **ShoreWatch as the Theme 2 alternative** maximizes distinctiveness per tooling point. Do not split effort across two builds — solo, 10 days, one demo.

---

## BEFORE YOU APPLY — 48-hour verification checklist

Hard gates. If a gate fails, switch project before writing the application, not after.

**For PrixVu (primary):**
- [ ] Spark API access confirmed; multimodal call works with an image + JSON schema in one request.
- [ ] Hand-test: 5 real board photos (2 printed/painted, 3 chalk, Wolof-French mix) through the draft schema. Printed ≥85% field accuracy? Chalk ≥70%?
- [ ] Existing tracker: repo runnable, deployed URL reachable, DB schema known — the application will link it.
- [ ] 30 board photos collected or collectable in week 1 (markets scouted, permission to photograph confirmed — most vendors don't care, but ask).

**For ShoreWatch (alternative):**
- [ ] Copernicus/Planetary Computer access working; Saint-Louis tile: ≥6 cloud-controlled scenes per year for 2015–2025.
- [ ] SAM 3.1 API: noun-phrase call returns a sane shoreline mask on one frame; cross-frame tracking holds across a 2-frame gap.
- [ ] Published erosion rates for the chosen stretch found and PDFs in hand (the validation chart is non-negotiable).
- [ ] Tide-data proxy available (tide tables or model) for scene selection.

**For CarRapide / ParcelZero (if chosen instead):**
- [ ] SAM 3.1 tracking latency measured on a real 15s clip (CarRapide go/no-go: <3× realtime).
- [ ] At least one good filming vantage (safe, legal, clean occlusion) (CarRapide).
- [ ] Sentinel-2 scene over the Niayes: can you even *see* field blocks? OSM validation polygons exist? (ParcelZero).

**Universal (all projects):**
- [ ] Read the hackathon ToS: solo track eligibility confirmed; deployed-demo requirement satisfied by a public URL he controls.
- [ ] API quota/rate limits for the chosen tool written down; fallback assets (cached outputs, screenshots) prepared for every live call.

---

## HONORABLE MENTIONS — where they fit (brief)

- **CropDoc (7.05)** — fallback if PrixVu's chalk test fails below go/no-go: same Spark multimodal pattern, imagery instead of boards; less personal wound, same tool story.
- **RoadCrackGuard (7.00)** — SAM-on-infrastructure variant; weaker wound, similar demo mechanics to CarRapide with less charm.
- **SunRoof Sahel (6.65)** — nice choropleth story; loses to ParcelZero on tooling-punchline clarity.
- **Kirikou / offline Glimmer agent (6.55)** — the *offline* story is a strong honesty pitch but a weaker live demo (on-device 30B can't stage-flash like an API call); keep as the "what if the network dies" resilience note inside any entry.
- **Jaam Jox speaker-attributed STT (6.55)** — best as a **fusion**, not a primary: bolt Wolof voice input onto PrixVu ("say the price") using Muse Voice Transcribe — turns PrixVu's flow into photo *or* voice → dashboard, deepening tooling coverage without a second project.

---

*Final call: PrixVu. Wound is real, demo is physical, proof is statistical, risk is bounded. Ship it.*
