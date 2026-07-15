import { useEffect, useMemo, useRef } from 'react';
import { Command } from 'cmdk';
import { Building2, Globe2, MapPin, Search, Sparkles, X } from 'lucide-react';
import { searchAll } from '../../utils/search';
import { useAppStore } from '../../store/useAppStore';
import {
  companyById,
  countryById,
  getSitesForCompany,
  getSitesForCountry,
  siteById,
} from '../../data/miningData';
import type { Metal } from '../../data/types';
import type { MetalFilter } from '../../store/useAppStore';

const typeIcon = {
  company: Building2,
  site: MapPin,
  country: Globe2,
  metal: Sparkles,
};

export function GlobalSearch() {
  const searchOpen = useAppStore((s) => s.searchOpen);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const selectSite = useAppStore((s) => s.selectSite);
  const selectCompany = useAppStore((s) => s.selectCompany);
  const selectCountry = useAppStore((s) => s.selectCountry);
  const setMetalFilter = useAppStore((s) => s.setMetalFilter);
  const requestFlyTo = useAppStore((s) => s.requestFlyTo);
  const setHighlightedSites = useAppStore((s) => s.setHighlightedSites);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!useAppStore.getState().searchOpen);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSearchOpen]);

  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  const results = useMemo(() => searchAll(searchQuery), [searchQuery]);

  const handleSelect = (type: string, id: string) => {
    setSearchOpen(false);
    setSearchQuery('');

    if (type === 'site') {
      const site = siteById[id];
      if (!site) return;
      selectSite(id);
      requestFlyTo(site.lat, site.lng, 1.5);
      setHighlightedSites([id]);
    } else if (type === 'company') {
      const company = companyById[id];
      if (!company) return;
      selectCompany(id);
      const sites = getSitesForCompany(id);
      setHighlightedSites(sites.map((s) => s.id));
      if (sites[0]) {
        requestFlyTo(sites[0].lat, sites[0].lng, 2.0);
      } else {
        requestFlyTo(company.hqLat, company.hqLng, 2.2);
      }
    } else if (type === 'country') {
      const country = countryById[id];
      if (!country) return;
      selectCountry(id);
      const sites = getSitesForCountry(id);
      setHighlightedSites(sites.map((s) => s.id));
      requestFlyTo(country.lat, country.lng, 1.9);
    } else if (type === 'metal') {
      const metal = id as Metal;
      const filter: MetalFilter = metal === 'platinum' || metal === 'palladium' ? 'pgm' : metal;
      setMetalFilter(filter);
    }
  };

  if (!searchOpen) {
    return (
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="group flex w-full max-w-md items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]/80 px-3 py-2 text-left text-sm text-[var(--color-text-dim)] backdrop-blur transition hover:border-[var(--color-gold)]/40 hover:text-[var(--color-text-muted)]"
        aria-label="Open global search"
      >
        <Search size={16} className="shrink-0 text-[var(--color-text-dim)]" />
        <span className="flex-1 truncate">Search companies, sites, countries…</span>
        <kbd className="hidden rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-text-dim)] sm:inline">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close search"
        onClick={() => setSearchOpen(false)}
      />
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-panel)] shadow-2xl">
        <Command label="Global search" shouldFilter={false}>
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3">
            <Search size={16} className="text-[var(--color-text-dim)]" />
            <Command.Input
              ref={inputRef}
              value={searchQuery}
              onValueChange={setSearchQuery}
              placeholder="Newmont Peñasquito, NEM, Mexico, silver…"
              className="flex-1 py-3.5 text-sm"
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="rounded p-1 text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
          <Command.List className="p-2">
            <Command.Empty>No matches. Try a ticker (NEM), mine, or country.</Command.Empty>
            {(['company', 'site', 'country', 'metal'] as const).map((type) => {
              const group = results.filter((r) => r.type === type);
              if (!group.length) return null;
              const Icon = typeIcon[type];
              return (
                <Command.Group
                  key={type}
                  heading={type === 'metal' ? 'Metals' : `${type}s`.replace('ys', 'ies')}
                >
                  {group.map((r) => (
                    <Command.Item
                      key={`${r.type}-${r.id}`}
                      value={`${r.type}-${r.id}-${r.label}`}
                      onSelect={() => handleSelect(r.type, r.id)}
                    >
                      <Icon
                        size={16}
                        className="shrink-0 text-[var(--color-gold-dim)]"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-[var(--color-text)]">
                          {r.label}
                        </div>
                        <div className="truncate text-xs text-[var(--color-text-muted)]">
                          {r.sublabel}
                        </div>
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
