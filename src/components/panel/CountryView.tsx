import { MapPin, Building2 } from 'lucide-react';
import {
  companyById,
  countryById,
  getCompaniesForCountry,
  getLatestSiteMetrics,
  getSitesForCountry,
} from '../../data/miningData';
import { useAppStore } from '../../store/useAppStore';
import { Disclaimer } from '../ui/Disclaimer';
import { METAL_COLORS, METAL_LABELS } from '../../utils/colors';
import { formatProduction } from '../../utils/format';

export function CountryView({ countryId }: { countryId: string }) {
  const country = countryById[countryId];
  const selectSite = useAppStore((s) => s.selectSite);
  const selectCompany = useAppStore((s) => s.selectCompany);
  const requestFlyTo = useAppStore((s) => s.requestFlyTo);
  const setHighlightedSites = useAppStore((s) => s.setHighlightedSites);
  const period = useAppStore((s) => s.period);

  if (!country) {
    return <p className="text-sm text-[var(--color-text-muted)]">Country not found.</p>;
  }

  const sites = getSitesForCountry(countryId);
  const cos = getCompaniesForCountry(countryId);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
          Country · {country.isoCode} · {country.continent}
        </p>
        <h2 className="text-xl font-bold text-[var(--color-text)]">{country.name}</h2>
      </div>

      <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{country.summary}</p>

      <div className="flex flex-wrap gap-1.5">
        {country.primaryMinerals.map((m) => (
          <span
            key={m}
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: `${METAL_COLORS[m]}22`, color: METAL_COLORS[m] }}
          >
            {METAL_LABELS[m]}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Stat label="NYSE companies" value={String(cos.length)} />
        <Stat label="Tracked sites" value={String(sites.length)} />
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
          Major companies
        </p>
        <div className="flex flex-wrap gap-2">
          {cos.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCompany(c.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-medium hover:border-[var(--color-gold)]/40"
            >
              <Building2 size={12} className="text-[var(--color-gold)]" />
              {c.ticker}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
            Top sites
          </p>
          <button
            type="button"
            className="text-[11px] text-[var(--color-teal)] hover:underline"
            onClick={() => {
              setHighlightedSites(sites.map((s) => s.id));
              requestFlyTo(country.lat, country.lng, 1.85);
            }}
          >
            Focus region
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-bg)] text-[var(--color-text-dim)]">
              <tr>
                <th className="px-3 py-2 font-medium">Site</th>
                <th className="px-3 py-2 font-medium">Metal</th>
                <th className="px-3 py-2 font-medium">Latest</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => {
                const m =
                  getLatestSiteMetrics(site.id, period).find(
                    (x) => x.metal === site.primaryMetal,
                  ) ?? getLatestSiteMetrics(site.id, period)[0];
                const tickers = site.companyIds
                  .map((id) => companyById[id]?.ticker)
                  .filter(Boolean)
                  .join('/');
                return (
                  <tr
                    key={site.id}
                    className="cursor-pointer border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-hover)]"
                    onClick={() => {
                      selectSite(site.id);
                      requestFlyTo(site.lat, site.lng, 1.5);
                    }}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5 font-medium text-[var(--color-text)]">
                        <MapPin size={12} style={{ color: METAL_COLORS[site.primaryMetal] }} />
                        {site.name}
                      </div>
                      <div className="text-[10px] text-[var(--color-text-dim)]">{tickers}</div>
                    </td>
                    <td className="px-3 py-2 text-[var(--color-text-muted)]">
                      {METAL_LABELS[site.primaryMetal]}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-[var(--color-silver)]">
                      {m ? formatProduction(m.production, m.unit) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-[var(--color-gold)]">{value}</div>
    </div>
  );
}
