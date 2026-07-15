/**
 * MineGlobe 3D — Core data model
 *
 * All production metrics are ILLUSTRATIVE and for demonstration only.
 * Extend these interfaces when adding real API integrations (EDGAR, IR, etc.).
 */

export type Metal = 'gold' | 'silver' | 'platinum' | 'palladium' | 'copper';

export type Period =
  | 'Q1 2025'
  | 'Q2 2025'
  | 'Q3 2025'
  | 'Q4 2025'
  | 'FY 2025'
  | 'Q1 2026'
  | 'Q2 2026';

export type ProductionUnit = 'koz' | 'Moz' | 'tonnes' | 'kt';

export type PanelView =
  | 'overview'
  | 'site'
  | 'company'
  | 'country'
  | 'watchlist'
  | 'compare'
  | 'search';

export interface Company {
  id: string;
  ticker: string;
  name: string;
  exchange: 'NYSE' | 'NYSE American';
  hqCity: string;
  hqCountry: string;
  hqLat: number;
  hqLng: number;
  description: string;
  website: string;
  primaryMetals: Metal[];
  marketCapNote: string;
  /**
   * SEC Central Index Key (10-digit zero-padded).
   * Used for EDGAR submissions lookups (latest 10-K/10-Q/8-K/etc.).
   */
  cik: string;
  /**
   * Fallback price / sparkline used when the yfinance quote API is offline.
   * Live prices come from server/ (yfinance) via QuotesProvider.
   */
  mockPrice: number;
  mockPriceChangePct: number;
  mockSparkline: number[];
}

/** One recent SEC filing row (from EDGAR submissions API via our proxy). */
export interface EdgarFiling {
  accessionNumber: string;
  filingDate: string;
  reportDate: string | null;
  form: string;
  primaryDocument: string;
  primaryDocDescription: string;
  size: number | null;
  /** Direct link to filing index on sec.gov */
  filingUrl: string;
  /** Direct link to primary document when available */
  documentUrl: string | null;
}

export interface EdgarFilingsResponse {
  cik: string;
  ticker: string | null;
  name: string | null;
  filings: EdgarFiling[];
  fetchedAt: string;
  source: string;
  error?: string;
}

export interface Country {
  id: string;
  name: string;
  isoCode: string;
  lat: number;
  lng: number;
  continent: string;
  summary: string;
  primaryMinerals: Metal[];
}

export interface MiningSite {
  id: string;
  name: string;
  countryId: string;
  lat: number;
  lng: number;
  primaryMetal: Metal;
  secondaryMetals: Metal[];
  /** Company IDs that operate / hold interest at this site */
  companyIds: string[];
  /** Ownership notes e.g. "NEM 38.5% / B 61.5% JV" */
  ownershipNote: string;
  description: string;
  status: 'operating' | 'development' | 'care-and-maintenance';
}

export interface SiteMetric {
  id: string;
  siteId: string;
  period: Period;
  metal: Metal;
  production: number;
  unit: ProductionUnit;
  yoyPct: number | null;
  /** All-in sustaining cost USD/oz (or equiv.) when applicable */
  aisc: number | null;
  grade: string | null;
  recovery: string | null;
  source: string;
}

export interface CompanyAggregate {
  companyId: string;
  period: Period;
  metal: Metal;
  production: number;
  unit: ProductionUnit;
  yoyPct: number | null;
  aisc: number | null;
  source: string;
}

export type SearchResultType = 'company' | 'site' | 'country' | 'metal';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  label: string;
  sublabel: string;
  meta?: string;
}
