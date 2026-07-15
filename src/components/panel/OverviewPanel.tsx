import { Building2, MapPin, Globe2 } from 'lucide-react';
import { companies, countries, miningSites } from '../../data/miningData';
import { useAppStore } from '../../store/useAppStore';
import { Disclaimer } from '../ui/Disclaimer';
import { PeriodSelector } from '../ui/PeriodSelector';
import { METAL_COLORS } from '../../utils/colors';

export function OverviewPanel() {
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const setPanelView = useAppStore((s) => s.setPanelView);
  const selectCompany = useAppStore((s) => s.selectCompany);
  const selectCountry = useAppStore((s) => s.selectCountry);
  const selectSite = useAppStore((s) => s.selectSite);
  const requestFlyTo = useAppStore((s) => s.requestFlyTo);
  const setHighlightedSites = useAppStore((s) => s.setHighlightedSites);
  const period = useAppStore((s) => s.period);
  const setPeriod = useAppStore((s) => s.setPeriod);

  const featured = ['nem', 'b', 'aem', 'fsm', 'hmy', 'ag', 'cde', 'wpm', 'exk', 'mux'];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-gold-dim)]">
          Welcome
        </p>
        <h2 className="text-xl font-bold tracking-tight text-[var(--color-text)]">
          Explore global precious metals
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
          Click markers on the globe, search for a ticker or mine, or browse by country. All figures
          are illustrative demo data styled after public operating statistics.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <MiniStat icon={Building2} label="Companies" value={companies.length} />
        <MiniStat icon={MapPin} label="Sites" value={miningSites.length} />
        <MiniStat icon={Globe2} label="Countries" value={countries.length} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
            Time travel
          </p>
          <PeriodSelector value={period} onChange={setPeriod} compact />
        </div>
        <p className="text-[11px] text-[var(--color-text-dim)]">
          Period updates marker sizing and detail metrics where data exists.
        </p>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
          Quick start
        </p>
        <div className="flex flex-col gap-1.5">
          <QuickBtn
            onClick={() => {
              setSearchOpen(true);
            }}
          >
            Search “Newmont Peñasquito”
          </QuickBtn>
          <QuickBtn
            onClick={() => {
              const site = miningSites.find((s) => s.id === 'ngm')!;
              selectSite(site.id);
              requestFlyTo(site.lat, site.lng, 1.5);
              setHighlightedSites([site.id]);
            }}
          >
            Fly to Nevada Gold Mines
          </QuickBtn>
          <QuickBtn onClick={() => setPanelView('watchlist')}>Open watchlist</QuickBtn>
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
          Featured companies
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {featured.map((id) => {
            const c = companies.find((x) => x.id === id)!;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectCompany(id)}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 py-2 text-left transition hover:border-[var(--color-gold)]/40"
              >
                <div className="text-sm font-semibold text-[var(--color-gold)]">{c.ticker}</div>
                <div className="truncate text-[11px] text-[var(--color-text-dim)]">{c.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
          Countries
        </p>
        <div className="flex flex-wrap gap-1.5">
          {countries.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                selectCountry(c.id);
                requestFlyTo(c.lat, c.lng, 1.9);
                setHighlightedSites(
                  miningSites.filter((s) => s.countryId === c.id).map((s) => s.id),
                );
              }}
              className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[11px] text-[var(--color-text-muted)] hover:border-[var(--color-teal)]/40 hover:text-[var(--color-text)]"
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/50 p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
          Metal colors
        </p>
        <div className="flex flex-wrap gap-3 text-[11px] text-[var(--color-text-muted)]">
          {Object.entries(METAL_COLORS).map(([k, color]) => (
            <span key={k} className="inline-flex items-center gap-1.5 capitalize">
              <span className="h-2 w-2 rounded-full" style={{ background: color }} />
              {k}
            </span>
          ))}
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2.5 text-center">
      <Icon size={14} className="mx-auto text-[var(--color-gold-dim)]" />
      <div className="mt-1 text-lg font-semibold text-[var(--color-text)]">{value}</div>
      <div className="text-[10px] text-[var(--color-text-dim)]">{label}</div>
    </div>
  );
}

function QuickBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-left text-xs font-medium text-[var(--color-text-muted)] transition hover:border-[var(--color-gold)]/30 hover:text-[var(--color-text)]"
    >
      {children}
    </button>
  );
}
