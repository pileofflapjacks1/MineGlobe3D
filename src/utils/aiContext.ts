/**
 * Build a compact system context for the mining analyst LLM from current app state.
 */
import {
  companies,
  companyById,
  countryById,
  getCompanyAggregates,
  getLatestSiteMetrics,
  getSitesForCompany,
  getSitesForCountry,
  siteById,
} from '../data/miningData';

export function buildMiningSystemPrompt(opts: {
  selectedCompanyId: string | null;
  selectedSiteId: string | null;
  selectedCountryId: string | null;
  period: string;
}): string {
  const lines: string[] = [
    'You are MineGlobe Assistant — a careful precious-metals mining research helper inside MineGlobe 3D.',
    'Rules:',
    '- Production metrics in the app are ILLUSTRATIVE demo data unless the user pastes official text.',
    '- Never claim live 10-K/10-Q ingestion. Tell users to verify with SEC EDGAR, 10-Q/10-K, AIF, or company IR.',
    '- Not financial advice. No trade recommendations.',
    '- Prefer concise, structured answers (bullets, tables in markdown).',
    '- If asked to extract filings, only extract from text the user provides.',
    `- Current reporting period focus in the UI: ${opts.period}.`,
    '',
    'Catalog snapshot (demo dataset):',
    `Companies (${companies.length}): ${companies.map((c) => c.ticker).join(', ')}`,
  ];

  if (opts.selectedCompanyId) {
    const c = companyById[opts.selectedCompanyId];
    if (c) {
      const sites = getSitesForCompany(c.id);
      const aggs = getCompanyAggregates(c.id).slice(0, 6);
      lines.push(
        '',
        '### Selected company',
        `${c.ticker} — ${c.name} (${c.exchange})`,
        `SEC CIK: ${c.cik}`,
        `HQ: ${c.hqCity}, ${c.hqCountry}`,
        c.description,
        `Primary metals: ${c.primaryMetals.join(', ')}`,
        `Sites: ${sites.map((s) => s.name).join('; ') || 'none mapped (e.g. streamer/royalty)'}`,
        'Aggregates (illustrative):',
        ...aggs.map(
          (a) =>
            `  - ${a.period} ${a.metal}: ${a.production} ${a.unit}` +
            (a.yoyPct != null ? ` YoY ${a.yoyPct}%` : '') +
            (a.aisc != null ? ` AISC ${a.aisc}` : ''),
        ),
      );
    }
  }

  if (opts.selectedSiteId) {
    const s = siteById[opts.selectedSiteId];
    if (s) {
      const country = countryById[s.countryId];
      const metrics = getLatestSiteMetrics(s.id, opts.period);
      const ops = s.companyIds.map((id) => companyById[id]?.ticker ?? id).join(', ');
      lines.push(
        '',
        '### Selected site',
        `${s.name} — ${country?.name ?? s.countryId}`,
        s.description,
        `Primary metal: ${s.primaryMetal}; operators: ${ops}`,
        `Ownership note: ${s.ownershipNote}`,
        'Latest metrics (illustrative):',
        ...metrics.map(
          (m) =>
            `  - ${m.period} ${m.metal}: ${m.production} ${m.unit}` +
            (m.yoyPct != null ? ` YoY ${m.yoyPct}%` : '') +
            (m.aisc != null ? ` AISC ${m.aisc}` : '') +
            ` [${m.source}]`,
        ),
      );
    }
  }

  if (opts.selectedCountryId) {
    const country = countryById[opts.selectedCountryId];
    if (country) {
      const sites = getSitesForCountry(country.id);
      lines.push(
        '',
        '### Selected country',
        `${country.name} (${country.isoCode}) — ${country.continent}`,
        country.summary,
        `Sites: ${sites.map((s) => s.name).join('; ')}`,
      );
    }
  }

  return lines.join('\n');
}
