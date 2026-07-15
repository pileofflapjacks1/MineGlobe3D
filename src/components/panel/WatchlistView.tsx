import { Heart, MapPin, Building2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { companyById, getLatestSiteMetrics, siteById } from '../../data/miningData';
import { useAppStore } from '../../store/useAppStore';
import { useQuotes } from '../../context/QuotesContext';
import { exportWatchlistCsv } from '../../utils/export';
import { Disclaimer } from '../ui/Disclaimer';
import { METAL_COLORS } from '../../utils/colors';
import { formatPrice, formatProduction } from '../../utils/format';

export function WatchlistView() {
  const watchedCompanyIds = useAppStore((s) => s.watchedCompanyIds);
  const watchedSiteIds = useAppStore((s) => s.watchedSiteIds);
  const toggleWatchCompany = useAppStore((s) => s.toggleWatchCompany);
  const toggleWatchSite = useAppStore((s) => s.toggleWatchSite);
  const selectCompany = useAppStore((s) => s.selectCompany);
  const selectSite = useAppStore((s) => s.selectSite);
  const requestFlyTo = useAppStore((s) => s.requestFlyTo);
  const setHighlightedSites = useAppStore((s) => s.setHighlightedSites);
  const { getPrice } = useQuotes();

  const companies = watchedCompanyIds.map((id) => companyById[id]).filter(Boolean);
  const sites = watchedSiteIds.map((id) => siteById[id]).filter(Boolean);

  // Simple portfolio rollup from watched sites' latest gold/silver
  let goldKoz = 0;
  let silverMoz = 0;
  for (const site of sites) {
    for (const m of getLatestSiteMetrics(site.id)) {
      if (m.metal === 'gold' && m.unit === 'koz') goldKoz += m.production;
      if (m.metal === 'silver' && m.unit === 'Moz') silverMoz += m.production;
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
            Watchlist
          </p>
          <h2 className="text-xl font-bold text-[var(--color-text)]">Saved interests</h2>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Stored locally in your browser
          </p>
        </div>
        <button
          type="button"
          disabled={!companies.length && !sites.length}
          onClick={() => {
            exportWatchlistCsv(companies, sites);
            toast.success('Watchlist exported');
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] disabled:opacity-40"
        >
          <Download size={14} /> CSV
        </button>
      </div>

      {(goldKoz > 0 || silverMoz > 0) && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3">
            <div className="text-[10px] text-[var(--color-text-dim)]">Watched sites · Gold</div>
            <div className="text-lg font-semibold text-[var(--color-gold)]">
              {goldKoz.toFixed(0)} koz
            </div>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3">
            <div className="text-[10px] text-[var(--color-text-dim)]">Watched sites · Silver</div>
            <div className="text-lg font-semibold text-[var(--color-silver)]">
              {silverMoz.toFixed(1)} Moz
            </div>
          </div>
        </div>
      )}

      {!companies.length && !sites.length && (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-center">
          <Heart className="mx-auto mb-2 text-[var(--color-text-dim)]" size={24} />
          <p className="text-sm text-[var(--color-text-muted)]">
            No items yet. Open any company or site and tap the heart icon.
          </p>
        </div>
      )}

      {!!companies.length && (
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
            Companies ({companies.length})
          </h3>
          <ul className="space-y-1.5">
            {companies.map((c) => (
              <li
                key={c.id}
                className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => selectCompany(c.id)}
                >
                  <Building2 size={14} className="shrink-0 text-[var(--color-gold)]" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {c.ticker} · {c.name}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-dim)]">
                      {(() => {
                        const q = getPrice(c);
                        const up = q.changePct >= 0;
                        return (
                          <span>
                            {formatPrice(q.price)}{' '}
                            <span
                              className={
                                up ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                              }
                            >
                              {up ? '+' : ''}
                              {q.changePct.toFixed(2)}%
                            </span>
                            {!q.isLive && (
                              <span className="ml-1 text-[var(--color-warning)]">fallback</span>
                            )}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  aria-label="Remove"
                  onClick={() => {
                    toggleWatchCompany(c.id);
                    toast.success('Removed');
                  }}
                  className="p-1 text-[var(--color-gold)]"
                >
                  <Heart size={14} className="fill-current" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!!sites.length && (
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
            Sites ({sites.length})
          </h3>
          <ul className="space-y-1.5">
            {sites.map((site) => {
              const m = getLatestSiteMetrics(site.id)[0];
              return (
                <li
                  key={site.id}
                  className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2"
                >
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => {
                      selectSite(site.id);
                      requestFlyTo(site.lat, site.lng, 1.5);
                      setHighlightedSites([site.id]);
                    }}
                  >
                    <MapPin size={14} style={{ color: METAL_COLORS[site.primaryMetal] }} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{site.name}</div>
                      <div className="text-[11px] text-[var(--color-text-dim)]">
                        {m ? formatProduction(m.production, m.unit) : site.primaryMetal}
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => {
                      toggleWatchSite(site.id);
                      toast.success('Removed');
                    }}
                    className="p-1 text-[var(--color-gold)]"
                  >
                    <Heart size={14} className="fill-current" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Disclaimer />
    </div>
  );
}
