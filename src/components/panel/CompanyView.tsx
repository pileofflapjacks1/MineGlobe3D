import { Heart, GitCompare, MapPin, ExternalLink, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  companyById,
  countryById,
  getCompanyAggregates,
  getLatestSiteMetrics,
  getSitesForCompany,
} from '../../data/miningData';
import { useAppStore } from '../../store/useAppStore';
import { useQuotes } from '../../context/QuotesContext';
import { MetricCard } from '../ui/MetricCard';
import { Sparkline } from '../charts/Sparkline';
import { Disclaimer } from '../ui/Disclaimer';
import { EdgarFilings } from './EdgarFilings';
import { METAL_COLORS, METAL_LABELS } from '../../utils/colors';
import { formatPrice } from '../../utils/format';
import { PeriodSelector } from '../ui/PeriodSelector';
import { edgarCompanyBrowseUrl } from '../../services/edgar';

export function CompanyView({ companyId }: { companyId: string }) {
  const company = companyById[companyId];
  const period = useAppStore((s) => s.period);
  const setPeriod = useAppStore((s) => s.setPeriod);
  const watched = useAppStore((s) => s.watchedCompanyIds.includes(companyId));
  const toggleWatchCompany = useAppStore((s) => s.toggleWatchCompany);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const selectSite = useAppStore((s) => s.selectSite);
  const requestFlyTo = useAppStore((s) => s.requestFlyTo);
  const setHighlightedSites = useAppStore((s) => s.setHighlightedSites);
  const { getPrice, isLoading, refresh, status } = useQuotes();

  if (!company) {
    return <p className="text-sm text-[var(--color-text-muted)]">Company not found.</p>;
  }

  const sites = getSitesForCompany(companyId);
  const aggregates = getCompanyAggregates(companyId).filter((a) => a.period === period);
  const fallbackAgg = getCompanyAggregates(companyId);
  const displayAgg = aggregates.length ? aggregates : fallbackAgg.slice(0, 3);
  const quote = getPrice(company);
  const priceUp = quote.changePct >= 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
            Company · {company.exchange} · CIK {company.cik}
          </p>
          <h2 className="text-xl font-bold text-[var(--color-text)]">
            <span className="text-[var(--color-gold)]">{company.ticker}</span>
            <span className="ml-2 text-base font-medium text-[var(--color-text-muted)]">
              {company.name}
            </span>
          </h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            HQ {company.hqCity}, {company.hqCountry}
            {' · '}
            <a
              href={edgarCompanyBrowseUrl(company.cik)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-teal)] hover:underline"
            >
              EDGAR
            </a>
          </p>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              toggleWatchCompany(companyId);
              toast.success(watched ? 'Removed from watchlist' : 'Added to watchlist');
            }}
            className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
            aria-label="Toggle watchlist"
          >
            <Heart
              size={16}
              className={watched ? 'fill-[var(--color-gold)] text-[var(--color-gold)]' : ''}
            />
          </button>
          <button
            type="button"
            onClick={() => {
              toggleCompare(`c:${companyId}`);
              toast.success('Toggled in compare');
            }}
            className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
            aria-label="Compare"
          >
            <GitCompare size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {company.primaryMetals.map((m) => (
          <span
            key={m}
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: `${METAL_COLORS[m]}22`, color: METAL_COLORS[m] }}
          >
            {METAL_LABELS[m]}
          </span>
        ))}
        <span className="rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-[11px] text-[var(--color-text-dim)]">
          {company.marketCapNote}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{company.description}</p>

      {/* Live stock strip (yfinance via local API) */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="mb-0.5 flex items-center gap-2">
              <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-dim)]">
                {quote.isLive ? 'Live price' : isLoading ? 'Loading price…' : 'Price (fallback)'}
              </p>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                  quote.isLive
                    ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                    : 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]'
                }`}
              >
                {quote.isLive ? 'yfinance' : status === 'loading' ? '…' : 'mock'}
              </span>
              <button
                type="button"
                onClick={() => void refresh()}
                className="rounded p-0.5 text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
                aria-label="Refresh quote"
                title="Refresh quote"
              >
                <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-semibold tabular-nums">{formatPrice(quote.price)}</span>
              <span
                className={`text-xs font-medium ${priceUp ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}
              >
                {priceUp ? '+' : ''}
                {quote.changePct.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="w-28">
            <Sparkline data={quote.sparkline} positive={priceUp} height={36} />
          </div>
        </div>
        <p className="mt-2 text-[10px] text-[var(--color-text-dim)]">
          {quote.isLive
            ? `Source: Yahoo Finance via yfinance${quote.asOf ? ` · as of ${new Date(quote.asOf).toLocaleString()}` : ''}. Delayed/indicative; not for trading.`
            : 'Live quote API offline — showing static fallback. Start the yfinance server (`npm run dev:api`).'}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
          Attributable production (rollup)
        </p>
        <PeriodSelector value={period} onChange={setPeriod} compact />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {displayAgg.map((a) => (
          <MetricCard
            key={`${a.period}-${a.metal}`}
            metal={a.metal}
            production={a.production}
            unit={a.unit}
            yoyPct={a.yoyPct}
            aisc={a.aisc}
            period={a.period}
          />
        ))}
        {!displayAgg.length && (
          <p className="text-sm text-[var(--color-text-dim)]">No aggregate for this period.</p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
            Key sites ({sites.length})
          </p>
          <button
            type="button"
            className="text-[11px] text-[var(--color-teal)] hover:underline"
            onClick={() => {
              setHighlightedSites(sites.map((s) => s.id));
              if (sites[0]) requestFlyTo(sites[0].lat, sites[0].lng, 2.0);
            }}
          >
            Highlight on globe
          </button>
        </div>
        <ul className="space-y-1.5">
          {sites.map((site) => {
            const metrics = getLatestSiteMetrics(site.id, period);
            const primary = metrics.find((m) => m.metal === site.primaryMetal) ?? metrics[0];
            return (
              <li key={site.id}>
                <button
                  type="button"
                  onClick={() => {
                    selectSite(site.id);
                    requestFlyTo(site.lat, site.lng, 1.5);
                    setHighlightedSites([site.id]);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/40 px-3 py-2 text-left transition hover:border-[var(--color-gold)]/30 hover:bg-[var(--color-bg-hover)]"
                >
                  <MapPin size={14} style={{ color: METAL_COLORS[site.primaryMetal] }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{site.name}</div>
                    <div className="truncate text-[11px] text-[var(--color-text-dim)]">
                      {countryById[site.countryId]?.name} · {METAL_LABELS[site.primaryMetal]}
                      {primary
                        ? ` · ${primary.production} ${primary.unit} (${primary.period})`
                        : ''}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <a
        href={company.website}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-teal)] hover:underline"
      >
        Company website <ExternalLink size={12} />
      </a>

      <EdgarFilings cik={company.cik} ticker={company.ticker} />

      <Disclaimer />
    </div>
  );
}
