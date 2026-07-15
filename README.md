# MineGlobe 3D — Interactive Precious Metals Mining Explorer

A modern, professional, fully interactive **3D globe** web app for exploring **NYSE-listed precious metals mining companies**, their operations by country, mining sites, and illustrative quarterly/yearly production metrics (gold, silver, platinum, palladium).

> **Illustrative data based on public company reports and filings as of mid-2026. For demonstration and educational purposes only. Always verify with official 10-Q/10-K, AIF, or company IR releases. Not financial advice.**

## Quick start (clone from GitHub)

```bash
git clone https://github.com/pileofflapjacks1/MineGlobe3D.git
cd MineGlobe3D
npm install
npm run dev          # globe UI → http://localhost:5173
```

**Full features** (live stock quotes + SEC EDGAR + LLM proxy):

```bash
# Needs Python 3.10+ on your PATH (or: PYTHON=/path/to/python3.11 npm run dev:api)
npm run dev:all      # UI + local API on :8000
```

Or run separately:

```bash
npm run dev          # frontend only
npm run dev:api      # local API (quotes, EDGAR, LLM proxy)
```

| What you run | Globe & demo mining data | Live prices | EDGAR filings | Ask AI (your key) |
|--------------|--------------------------|-------------|---------------|-------------------|
| `npm run dev` only | Yes | Mock fallback | Offline message | Needs API server |
| `npm run dev:all` | Yes | yfinance | Live from SEC | Yes (optional key) |

```bash
npm run build        # production build
npm run preview      # preview production build
```

**Requirements:**
- **Node.js 18+** (tested with Node 24) — enough for the core app
- **Python 3.10+** (optional) — only for live quotes, EDGAR, and the LLM proxy. `server/run.sh` creates a venv and installs deps automatically. If `python3` is older (e.g. macOS 3.8), install a newer Python and either put it first on `PATH` or run `PYTHON=$(which python3.11) npm run dev:api`.

## Features

- **3D Earth** via `react-globe.gl` (Blue Marble + topology bump, atmosphere)
- **Clickable site markers** sized by production volume, colored by primary metal
- **Camera fly-to** on search / marker / country selection
- **Country labels** as hotspot entry points
- **Optional HQ → mine arcs**
- **Details panel** for site, company, and country context
- **Global search** (`⌘K` / `Ctrl+K`) across companies, sites, countries, metals
- **Metal filters** (Gold / Silver / PGM / All)
- **Period selector** (time travel across illustrative quarters)
- **Watchlist** persisted in `localStorage`
- **Compare mode** with radar chart (up to 3 entities)
- **CSV export** (sites, metrics, watchlist)
- **Live stock prices + sparklines** via **yfinance** (local FastAPI; mock fallback)
- **Optional LLM assistant** (Settings → your API key; default **xAI Grok**, also OpenAI / custom OpenAI-compatible)
- **Dark premium mining/finance aesthetic** (gold / silver / teal tokens)
- **Responsive** desktop panel + mobile bottom sheet

## Project structure

```
server/               # yfinance quote API (FastAPI)
  main.py
  requirements.txt
  run.sh
src/
  data/
    types.ts          # TypeScript interfaces
    miningData.ts     # Companies, countries, sites, metrics (edit me)
  services/
    quotes.ts         # Frontend client for /api/quotes
  store/
    useAppStore.ts    # Zustand + localStorage watchlist
  components/
    globe/            # GlobeView, controls, legend
    panel/            # Site / company / country / watchlist / compare
    search/           # cmdk global search
    charts/           # Recharts production trends + sparklines
    layout/           # Navbar
    ui/               # Metrics, disclaimers, modals
  utils/              # format, colors, export, search
```

## Extending the dataset

All demo data lives in **`src/data/miningData.ts`**.

1. **Add a company** — append to `companies` (use a real NYSE ticker).
2. **Add a site** — append to `miningSites` with accurate `lat`/`lng` and `companyIds`.
3. **Add metrics** — append `SiteMetric` rows with `period`, `metal`, `production`, `unit`, `yoyPct`, `aisc`, and a clear `source` string.
4. **Optional rollups** — append `companyAggregates` for company-level cards.

Interfaces are defined in `src/data/types.ts`. Metals: `gold | silver | platinum | palladium | copper`. Periods include `Q1 2025` … `Q2 2026` and `FY 2025`.

### Coverage (v1 sample)

| Entity | Count | Notes |
|--------|------:|-------|
| Countries | 13 | US, Canada, Australia, South Africa, Peru, Mexico, Ghana, Argentina, Indonesia, China, Colombia, Dominican Republic, Mali |
| Companies | 26 | Majors + mid-tiers + juniors: NEM, B, AEM, AU, GFI, SBSW, PAAS, HL, CDE, BVN, FCX, KGC, WPM, AG, **FSM**, **USAU**, **SVM**, **EXK**, **MUX**, **HMY**, IAG, EGO, NGD, FNV, RGLD |
| Sites | 55+ | Nevada Gold Mines, Peñasquito, Segovia, Ying District, Pueblo Viejo, Côté Gold, Mponeng… |
| Metrics | 180+ | Multi-period gold/silver/PGM with YoY & AISC where relevant |

## Design tokens

| Token | Value | Use |
|-------|-------|-----|
| Background | `#0a0f1c` | App canvas |
| Gold | `#d4af37` | Primary accent / gold metal |
| Silver | `#a8b5c4` | Secondary / silver metal |
| Teal | `#0ea5e9` | PGM / interactive accents |

Defined in `src/index.css` via Tailwind v4 `@theme`.

## Live stock prices (yfinance)

Prices and sparklines are loaded from a small **Python FastAPI** service that wraps **`yfinance`** (Yahoo Finance data).

| Piece | Path |
|-------|------|
| API server | `server/main.py` |
| Requirements | `server/requirements.txt` |
| Frontend client | `src/services/quotes.ts` |
| React hook / context | `src/hooks/useStockQuotes.ts`, `src/context/QuotesContext.tsx` |
| Vite proxy | `/api` → `http://127.0.0.1:8000` |

**Endpoints**

- `GET /api/health`
- `GET /api/quotes?tickers=NEM,B,AEM`
- `GET /api/quote/NEM`

Quotes are cached ~60s server-side and refreshed ~2 minutes in the UI. Company panels show a **yfinance** badge when live; otherwise a **mock** fallback from `miningData.ts`.

> Market data is delayed/indicative and not for trading decisions.

## SEC CIK map & EDGAR latest filings

Each company in `miningData.ts` has a **`cik`** (10-digit SEC Central Index Key).

| Piece | Path |
|-------|------|
| CIK on company records | `src/data/miningData.ts` (`cik` field) |
| Types | `EdgarFiling` in `src/data/types.ts` |
| API proxy | `GET /api/edgar/filings/{cik}?limit=12&forms=10-K,10-Q,8-K,…` |
| UI | Company panel → **SEC EDGAR filings** table |

The browser never calls `data.sec.gov` directly (CORS + User-Agent policy). The local API fetches submissions JSON with a compliant User-Agent and caches ~5 minutes.

Open any company (e.g. NEM) to see recent **10-K / 10-Q / 20-F / 40-F / 6-K / 8-K** with links to the filing index and primary document on sec.gov.

## Optional LLM (Grok / OpenAI / custom)

Bring your own key under **Settings** (gear icon in the navbar).

| Setting | Default |
|---------|---------|
| Provider | **xAI · Grok** (`https://api.x.ai/v1`) |
| Model | `grok-4.5` |
| Also supported | OpenAI, custom OpenAI-compatible base URL |

- Key is stored in **browser localStorage** only (`mineglobe-llm-settings`) — never committed to git.
- Chat goes through `POST /api/llm/chat` on the local API (avoids CORS; key is not stored on the server).
- **Ask AI** panel uses the selected site/company/country as context plus the demo catalog.
- Does **not** auto-detect 10-K/earnings; users can paste filing text for extraction help.

Get an xAI key: [console.x.ai](https://console.x.ai)

See [SECURITY.md](./SECURITY.md) for privacy notes when forking or deploying.

## Future API integration

| Source | Use | Integration sketch |
|--------|-----|--------------------|
| **SEC EDGAR** | Production footnotes, AISC from 10-Q/10-K | Backend job → normalize into `SiteMetric[]` |
| **Company IR / RSS** | Operating statistics PDFs/tables | Scrape or manual CSV → merge into `miningData` |
| **Polygon / paid feeds** | Low-latency quotes | Swap yfinance backend implementation |
| **GeoJSON** | Country polygon highlights | Load simplified topojson; drive `polygonsData` on the globe |
| **User accounts** | Synced watchlists | Replace `localStorage` persist with API |

## Known limitations

- Metrics are **illustrative**, not audited production numbers.
- Ownership percentages and JV economics are simplified for demo clarity.
- Globe textures load from a public CDN (`jsdelivr` / three-globe examples).
- No authentication, real-time pipeline, custom CSV upload, or trading integration.
- Copper is included for FCX context; the UI emphasizes precious metals.
- Performance depends on device GPU; auto-rotate can be paused from globe controls.

## Tech stack

- React 18+ / TypeScript / Vite
- Tailwind CSS v4
- `react-globe.gl` + Three.js
- Recharts, Zustand, cmdk, framer-motion, lucide-react, react-hot-toast, papaparse, date-fns

## License / disclaimer

Demo project for educational purposes. Company names and tickers are used for illustrative mapping only. **Not affiliated with any mining company or exchange. Not financial advice.**
