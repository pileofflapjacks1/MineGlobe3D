import { Heart, GitCompare, ExternalLink, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  companyById,
  countryById,
  getSiteMetrics,
  siteById,
} from '../../data/miningData';
import { useAppStore } from '../../store/useAppStore';
import { MetricCard } from '../ui/MetricCard';
import { ProductionChart } from '../charts/ProductionChart';
import { Disclaimer } from '../ui/Disclaimer';
import { METAL_COLORS, METAL_LABELS } from '../../utils/colors';
import { PeriodSelector } from '../ui/PeriodSelector';

export function SiteView({ siteId }: { siteId: string }) {
  const site = siteById[siteId];
  const period = useAppStore((s) => s.period);
  const setPeriod = useAppStore((s) => s.setPeriod);
  const watchedSiteIds = useAppStore((s) => s.watchedSiteIds);
  const toggleWatchSite = useAppStore((s) => s.toggleWatchSite);
  const selectCompany = useAppStore((s) => s.selectCompany);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const requestFlyTo = useAppStore((s) => s.requestFlyTo);

  if (!site) {
    return <p className="text-sm text-[var(--color-text-muted)]">Site not found.</p>;
  }

  const country = countryById[site.countryId];
  const allMetrics = getSiteMetrics(siteId);
  const periodMetrics = allMetrics.filter((m) => m.period === period);
  const displayMetrics =
    periodMetrics.length > 0
      ? periodMetrics
      : allMetrics.filter((m) => m.period === allMetrics[allMetrics.length - 1]?.period);
  const watched = watchedSiteIds.includes(siteId);
  const sources = [...new Set(displayMetrics.map((m) => m.source))];

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
              Mining site
            </p>
            <h2 className="text-xl font-bold text-[var(--color-text)]">{site.name}</h2>
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              {country?.name ?? site.countryId} · {site.status}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                toggleWatchSite(siteId);
                toast.success(watched ? 'Removed from watchlist' : 'Added to watchlist');
              }}
              className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
              aria-label={watched ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              <Heart
                size={16}
                className={watched ? 'fill-[var(--color-gold)] text-[var(--color-gold)]' : ''}
              />
            </button>
            <button
              type="button"
              onClick={() => {
                toggleCompare(`s:${siteId}`);
                toast.success('Toggled in compare');
              }}
              className="rounded-lg border border-[var(--color-border)] p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
              aria-label="Add to compare"
            >
              <GitCompare size={16} />
            </button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{
              background: `${METAL_COLORS[site.primaryMetal]}22`,
              color: METAL_COLORS[site.primaryMetal],
            }}
          >
            Primary: {METAL_LABELS[site.primaryMetal]}
          </span>
          {site.secondaryMetals.map((m) => (
            <span
              key={m}
              className="rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-[11px] text-[var(--color-text-muted)]"
            >
              {METAL_LABELS[m] ?? m}
            </span>
          ))}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{site.description}</p>
      <p className="text-xs text-[var(--color-text-dim)]">
        Ownership: <span className="text-[var(--color-silver)]">{site.ownershipNote}</span>
      </p>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
          Operators
        </p>
        <div className="flex flex-wrap gap-2">
          {site.companyIds.map((cid) => {
            const co = companyById[cid];
            if (!co) return null;
            return (
              <button
                key={cid}
                type="button"
                onClick={() => selectCompany(cid)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-text)] transition hover:border-[var(--color-gold)]/40"
              >
                <Building2 size={12} className="text-[var(--color-gold)]" />
                {co.ticker}
                <span className="text-[var(--color-text-dim)]">· {co.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
          Production metrics
        </p>
        <PeriodSelector value={period} onChange={setPeriod} compact />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {displayMetrics.map((m) => (
          <MetricCard
            key={m.id}
            metal={m.metal}
            production={m.production}
            unit={m.unit}
            yoyPct={m.yoyPct}
            aisc={m.aisc}
            period={m.period}
          />
        ))}
        {!displayMetrics.length && (
          <p className="col-span-full text-sm text-[var(--color-text-dim)]">
            No metrics for {period}. Try another period.
          </p>
        )}
      </div>

      {(displayMetrics[0]?.grade || displayMetrics[0]?.recovery) && (
        <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-bg)]/50 px-3 py-2 text-xs text-[var(--color-text-muted)]">
          {displayMetrics[0]?.grade && <div>Grade: {displayMetrics[0].grade}</div>}
          {displayMetrics[0]?.recovery && <div>Recovery: {displayMetrics[0].recovery}</div>}
        </div>
      )}

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
          Trend
        </p>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2">
          <ProductionChart metrics={allMetrics} />
        </div>
      </div>

      <div>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
          Sources
        </p>
        <ul className="space-y-1 text-[11px] leading-snug text-[var(--color-text-dim)]">
          {sources.map((s) => (
            <li key={s} className="flex gap-1.5">
              <ExternalLink size={10} className="mt-0.5 shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => requestFlyTo(site.lat, site.lng, 1.4)}
        className="w-full rounded-lg border border-[var(--color-gold)]/30 bg-[var(--color-gold)]/10 py-2 text-xs font-semibold text-[var(--color-gold)] transition hover:bg-[var(--color-gold)]/20"
      >
        Focus on globe
      </button>

      <Disclaimer />
    </div>
  );
}
