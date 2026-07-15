import type { SearchResult } from '../data/types';
import { companies, countries, miningSites } from '../data/miningData';
import { companyById, countryById } from '../data/miningData';
import { METAL_LABELS } from './colors';
import type { Metal } from '../data/types';

export function searchAll(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];

  for (const c of companies) {
    if (
      c.ticker.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.id.includes(q)
    ) {
      results.push({
        id: c.id,
        type: 'company',
        label: `${c.ticker} — ${c.name}`,
        sublabel: `${c.exchange} · ${c.hqCity}, ${c.hqCountry}`,
        meta: c.primaryMetals.map((m) => METAL_LABELS[m]).join(', '),
      });
    }
  }

  for (const s of miningSites) {
    const country = countryById[s.countryId];
    const tickers = s.companyIds.map((id) => companyById[id]?.ticker).filter(Boolean).join(', ');
    const hay = `${s.name} ${country?.name ?? ''} ${tickers} ${s.primaryMetal}`.toLowerCase();
    if (hay.includes(q) || s.name.toLowerCase().includes(q)) {
      results.push({
        id: s.id,
        type: 'site',
        label: s.name,
        sublabel: `${tickers} · ${country?.name ?? s.countryId} · ${METAL_LABELS[s.primaryMetal]}${
          s.secondaryMetals.length
            ? ` & ${s.secondaryMetals
                .filter((m): m is Metal => m in METAL_LABELS)
                .map((m) => METAL_LABELS[m])
                .join(', ')}`
            : ''
        }`,
        meta: s.ownershipNote,
      });
    }
  }

  for (const c of countries) {
    if (c.name.toLowerCase().includes(q) || c.isoCode.toLowerCase().includes(q)) {
      results.push({
        id: c.id,
        type: 'country',
        label: c.name,
        sublabel: `${c.continent} · ${c.primaryMinerals.map((m) => METAL_LABELS[m]).join(', ')}`,
        meta: c.summary.slice(0, 80) + '…',
      });
    }
  }

  const metalKeys = Object.keys(METAL_LABELS) as Metal[];
  for (const m of metalKeys) {
    if (METAL_LABELS[m].toLowerCase().includes(q) || m.includes(q)) {
      results.push({
        id: m,
        type: 'metal',
        label: METAL_LABELS[m],
        sublabel: 'Filter markers by primary metal',
      });
    }
  }

  // Prefer exact ticker / name matches first
  return results
    .sort((a, b) => {
      const aExact = a.label.toLowerCase().startsWith(q) ? 0 : 1;
      const bExact = b.label.toLowerCase().startsWith(q) ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return a.label.localeCompare(b.label);
    })
    .slice(0, 40);
}
