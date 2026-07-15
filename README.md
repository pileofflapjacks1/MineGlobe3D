# MineGlobe 3D — Interactive Precious Metals Mining Explorer

A modern, professional **3D globe** web app for exploring **NYSE / NYSE American** precious metals mining companies: operations by country, mining sites, illustrative production metrics, live stock quotes, SEC EDGAR filings, and an optional LLM assistant (Grok by default).

**Repo:** [github.com/pileofflapjacks1/MineGlobe3D](https://github.com/pileofflapjacks1/MineGlobe3D)

> **Illustrative mining data** based on public company reports and filings (styled as of mid-2026). For demonstration and educational purposes only. Always verify with official 10-Q / 10-K, AIF, or company IR releases. **Not financial advice.** Stock quotes and EDGAR links are live when the local API is running; production tables in the app are demo data unless you extend them.

---

## Quick start

```bash
git clone https://github.com/pileofflapjacks1/MineGlobe3D.git
cd MineGlobe3D
npm install
npm run dev
```

Open **http://localhost:5173**

### Full stack (recommended)

Live prices (yfinance), SEC EDGAR filings, and LLM proxy:

```bash
# Requires Python 3.10+ on PATH (or: PYTHON=/path/to/python3.11 npm run dev:all)
npm run dev:all
```

| Command | Globe + demo metrics | Live prices | EDGAR filings | Ask AI |
|---------|----------------------|-------------|---------------|--------|
| `npm run dev` | Yes | Mock fallback | Offline until API up | Needs API + your key |
| `npm run dev:all` | Yes | yfinance | Live from SEC | Optional (Settings) |
| `npm run dev` + `npm run dev:api` | Same as full stack | Same | Same | Same |

```bash
npm run build      # production build → dist/
npm run preview    # serve production build
npm run lint       # oxlint
```

### Requirements

| Dependency | Required? | Notes |
|------------|-----------|--------|
| **Node.js 18+** | Yes | Core UI (tested on Node 24) |
| **Python 3.10+** | Optional | Live quotes, EDGAR, LLM proxy. `server/run.sh` creates a venv automatically. |
| Modern browser + WebGL | Yes | Globe rendering |
| LLM API key | Optional | xAI / OpenAI / custom — only for Ask AI |

If system `python3` is too old (e.g. macOS 3.8):

```bash
# Example after installing Python 3.11+
PYTHON=$(command -v python3.11) npm run dev:api
```

---

## Features

### Globe & navigation
- Textured Earth (`react-globe.gl` + Three.js) with atmosphere and surface-bound markers
- Markers sized by relative production volume; colored by primary metal (gold / silver / PGM / copper)
- Hover tooltips, click-to-select, smooth camera fly-to
- Country labels; optional HQ → mine arcs
- Auto-rotate, reset view, metal filters, period selector (“time travel” for demo metrics)

### Data panels
- **Site** — production cards, YoY, AISC, trend charts, sources, operators
- **Company** — profile, mock/live price + sparkline, aggregate rollups, site list, **SEC EDGAR filings**
- **Country** — overview, companies, top sites table
- **Watchlist** — companies/sites in `localStorage`, export CSV
- **Compare** — up to 3 entities, radar + table KPIs
- Global search (`⌘K` / `Ctrl+K`) across tickers, mines, countries, metals

### Live integrations (local API on `:8000`)
- **yfinance** stock quotes + sparklines
- **SEC EDGAR** latest filings per company CIK
- **LLM chat proxy** (OpenAI-compatible) for Ask AI — user-supplied key only

### UX
- Dark mining/finance theme (gold / silver / teal tokens)
- Desktop side panel + mobile bottom sheet
- Toasts, disclaimers, error boundary
- CSV export (sites, metrics, watchlist)

---

## Dataset specs (v1)

All demo production data is in **`src/data/miningData.ts`**. Each company includes a real **SEC CIK**.

| Entity | Count | Notes |
|--------|------:|-------|
| **Countries** | 13 | US, Canada, Australia, South Africa, Peru, Mexico, Ghana, Argentina, Indonesia, China, Colombia, Dominican Republic, Mali |
| **Companies** | 25 | See ticker list below (all have CIKs) |
| **Mining sites** | 56 | Real or highly plausible major operations |
| **Site metrics** | 157 | Multi-period gold / silver / PGM / copper; YoY & AISC where relevant |

**Tickers:**  
`NEM`, `B`, `AEM`, `AU`, `GFI`, `SBSW`, `PAAS`, `HL`, `CDE`, `BVN`, `FCX`, `KGC`, `WPM`, `AG`, `FSM`, `USAU`, `SVM`, `EXK`, `MUX`, `HMY`, `IAG`, `EGO`, `NGD`, `FNV`, `RGLD`

**Metals:** `gold` · `silver` · `platinum` · `palladium` · `copper`  

**Periods:** `Q1 2025` … `Q2 2026`, plus `FY 2025`

### Extending the dataset

1. Add a **company** (real ticker + **10-digit CIK**).
2. Add **sites** with `lat` / `lng` and `companyIds`.
3. Add **SiteMetric** rows (`period`, `metal`, `production`, `unit`, `yoyPct`, `aisc`, `source`).
4. Optionally add **companyAggregates** for company-level cards.

Types: `src/data/types.ts`.

---

## Architecture

```
MineGlobe3D/
├── public/                 # favicon, static assets
├── server/                 # Python FastAPI (optional local backend)
│   ├── main.py             # quotes + EDGAR + LLM proxy
│   ├── requirements.txt
│   └── run.sh              # venv + uvicorn :8000
├── src/
│   ├── App.tsx
│   ├── data/               # types + miningData.ts
│   ├── services/           # quotes, edgar, llm clients
│   ├── store/              # Zustand (UI + LLM settings)
│   ├── context/            # QuotesProvider
│   ├── hooks/
│   ├── components/
│   │   ├── globe/
│   │   ├── panel/          # site/company/country + EdgarFilings
│   │   ├── search/
│   │   ├── settings/       # API key / provider
│   │   ├── ai/             # Ask AI panel
│   │   ├── charts/
│   │   └── ui/
│   └── utils/
├── SECURITY.md
└── README.md
```

Vite proxies `/api/*` → `http://127.0.0.1:8000` in development.

### Local API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/quotes?tickers=NEM,B` | Batch yfinance quotes + sparklines |
| `GET` | `/api/quote/{ticker}` | Single quote |
| `GET` | `/api/edgar/filings/{cik}?limit=12&forms=10-K,10-Q,8-K` | Recent SEC filings |
| `POST` | `/api/llm/chat` | OpenAI-compatible chat proxy (client sends API key) |

---

## Live stock prices (yfinance)

| Piece | Location |
|-------|----------|
| Server | `server/main.py` |
| Client | `src/services/quotes.ts` |
| State | `src/hooks/useStockQuotes.ts`, `src/context/QuotesContext.tsx` |

- Server cache ~**60s**; UI refresh ~**2 min**
- Company panel shows **yfinance** badge when live, else **mock** fallback from `miningData.ts`
- Delayed/indicative market data — not for trading

---

## SEC CIK map & EDGAR filings

- Every company has a **`cik`** field (zero-padded 10 digits).
- Company panel → **SEC EDGAR filings** table (10-K, 10-Q, 20-F, 40-F, 6-K, 8-K by default).
- Links open filing index / primary document on **sec.gov**.
- Server caches EDGAR responses ~**5 minutes**.
- Browser never calls `data.sec.gov` directly (CORS + User-Agent policy).

### How new filings appear later

EDGAR is queried **when you open/refresh a company panel** (after cache expiry). New 10-Qs/8-Ks show up automatically on the next fetch — **no** edit to `miningData.ts` needed for the filings list.

Demo **production metrics** do **not** auto-update from filings; that remains static/demo data until you extend the pipeline.

---

## Optional LLM (Grok / OpenAI / custom)

**Settings** (gear) → provider, API key, model → **Test connection** → **Ask AI** (sparkles).

| Setting | Default |
|---------|---------|
| Provider | **xAI · Grok** (`https://api.x.ai/v1`) |
| Model | `grok-4.5` |
| Also | OpenAI, custom OpenAI-compatible base URL |

- Key stored only in browser **`localStorage`** (`mineglobe-llm-settings`) — never committed
- Proxied via `POST /api/llm/chat` (avoids CORS; server does not persist keys)
- Context = selected site/company/country + demo catalog
- Helpful for Q&A and pasting filing text to extract metrics — **not** a filings subscription

xAI keys: [console.x.ai](https://console.x.ai)  
Privacy: [SECURITY.md](./SECURITY.md)

---

## Design tokens

| Token | Value | Use |
|-------|-------|-----|
| Background | `#0a0f1c` | App canvas |
| Gold | `#d4af37` | Accent / gold metal |
| Silver | `#a8b5c4` | Secondary / silver |
| Teal | `#0ea5e9` | PGM / interactive |

Defined in `src/index.css` (Tailwind CSS v4 `@theme`).

---

## Keyboard & UI shortcuts

| Action | Shortcut / control |
|--------|--------------------|
| Global search | `⌘K` / `Ctrl+K` |
| Settings | Navbar gear |
| Ask AI | Navbar sparkles |
| Watchlist / Compare | Navbar icons |
| Pause globe rotate | Globe control (left) |

---

## Tech stack

| Layer | Stack |
|-------|--------|
| UI | React 19, TypeScript, Vite 8 |
| Styles | Tailwind CSS v4 |
| 3D | `react-globe.gl`, Three.js |
| Charts | Recharts |
| State | Zustand (+ `localStorage` persist) |
| Search UI | cmdk |
| Motion / icons / toasts | framer-motion, lucide-react, react-hot-toast |
| Export / dates | papaparse, date-fns |
| API | FastAPI, uvicorn, yfinance, httpx |

---

## Known limitations

- Production / AISC figures are **illustrative demo data**, not a live fundamentals feed.
- Ownership and JV shares are simplified.
- Globe textures load from a public CDN.
- No user accounts, no auto-ingest of production tables from 10-Qs.
- EDGAR updates only when the filings panel is loaded/refreshed (plus short cache).
- GPU-dependent globe performance; auto-rotate can be paused.
- Copper appears for multi-metal context (e.g. FCX); focus is precious metals.

---

## Roadmap ideas (not in v1)

| Idea | Sketch |
|------|--------|
| Auto production updates | EDGAR/IR poller → parse → `SiteMetric` store |
| “New filing” badges | Background CIK poll + last-seen accession |
| GeoJSON country polygons | `polygonsData` on the globe |
| Server-side LLM keys | Env var proxy for production deploys |
| Live paid market data | Polygon (or similar) behind the same quotes API |

---

## Contributing / forking

1. Fork or clone the repo.
2. Never commit API keys or `.env` files (see `.gitignore` and `SECURITY.md`).
3. Prefer GitHub noreply email for public commits if you care about personal email privacy.

---

## License / disclaimer

Demo project for educational purposes. Company names, tickers, and CIKs are used for illustrative mapping only. **Not affiliated with any mining company, exchange, or the SEC. Not financial advice.** Always verify filings and operating statistics with official sources.
