import Papa from 'papaparse';
import type { Company, MiningSite, SiteMetric } from '../data/types';
import { companyById, countryById } from '../data/miningData';

export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSitesCsv(sites: MiningSite[]): void {
  const rows = sites.map((s) => ({
    id: s.id,
    name: s.name,
    country: countryById[s.countryId]?.name ?? s.countryId,
    lat: s.lat,
    lng: s.lng,
    primaryMetal: s.primaryMetal,
    secondaryMetals: s.secondaryMetals.join('; '),
    companies: s.companyIds.map((id) => companyById[id]?.ticker ?? id).join('; '),
    ownership: s.ownershipNote,
    status: s.status,
  }));
  downloadCsv('mineglobe-sites.csv', rows);
}

export function exportMetricsCsv(metrics: SiteMetric[], sites: MiningSite[]): void {
  const siteMap = Object.fromEntries(sites.map((s) => [s.id, s]));
  const rows = metrics.map((m) => ({
    siteId: m.siteId,
    siteName: siteMap[m.siteId]?.name ?? m.siteId,
    period: m.period,
    metal: m.metal,
    production: m.production,
    unit: m.unit,
    yoyPct: m.yoyPct ?? '',
    aisc: m.aisc ?? '',
    grade: m.grade ?? '',
    recovery: m.recovery ?? '',
    source: m.source,
  }));
  downloadCsv('mineglobe-metrics.csv', rows);
}

export function exportWatchlistCsv(
  companies: Company[],
  sites: MiningSite[],
): void {
  const companyRows = companies.map((c) => ({
    type: 'company',
    id: c.id,
    ticker: c.ticker,
    name: c.name,
    primaryMetals: c.primaryMetals.join('; '),
  }));
  const siteRows = sites.map((s) => ({
    type: 'site',
    id: s.id,
    ticker: s.companyIds.map((id) => companyById[id]?.ticker).join(';'),
    name: s.name,
    primaryMetals: s.primaryMetal,
  }));
  downloadCsv('mineglobe-watchlist.csv', [...companyRows, ...siteRows]);
}
