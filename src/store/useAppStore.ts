import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Metal, PanelView, Period } from '../data/types';
import { DEFAULT_PERIOD } from '../data/miningData';

export type MetalFilter = Metal | 'all' | 'pgm';

interface FlyToTarget {
  lat: number;
  lng: number;
  altitude?: number;
  /** bump key so repeated fly-to same coords still triggers */
  nonce: number;
}

interface AppState {
  // Selection
  selectedSiteId: string | null;
  selectedCompanyId: string | null;
  selectedCountryId: string | null;
  panelView: PanelView;
  compareIds: string[]; // company or site ids with prefix c: / s:
  metalFilter: MetalFilter;
  period: Period;
  searchQuery: string;
  searchOpen: boolean;
  infoOpen: boolean;
  autoRotate: boolean;
  mobilePanelOpen: boolean;
  showArcs: boolean;
  flyTo: FlyToTarget | null;
  highlightedSiteIds: string[] | null;

  // Watchlist
  watchedCompanyIds: string[];
  watchedSiteIds: string[];

  // Actions
  selectSite: (id: string | null) => void;
  selectCompany: (id: string | null) => void;
  selectCountry: (id: string | null) => void;
  setPanelView: (view: PanelView) => void;
  setMetalFilter: (f: MetalFilter) => void;
  setPeriod: (p: Period) => void;
  setSearchQuery: (q: string) => void;
  setSearchOpen: (open: boolean) => void;
  setInfoOpen: (open: boolean) => void;
  setAutoRotate: (v: boolean) => void;
  setMobilePanelOpen: (v: boolean) => void;
  setShowArcs: (v: boolean) => void;
  requestFlyTo: (lat: number, lng: number, altitude?: number) => void;
  setHighlightedSites: (ids: string[] | null) => void;
  toggleWatchCompany: (id: string) => void;
  toggleWatchSite: (id: string) => void;
  toggleCompare: (prefixedId: string) => void;
  clearCompare: () => void;
  resetSelection: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedSiteId: null,
      selectedCompanyId: null,
      selectedCountryId: null,
      panelView: 'overview',
      compareIds: [],
      metalFilter: 'all',
      period: DEFAULT_PERIOD,
      searchQuery: '',
      searchOpen: false,
      infoOpen: false,
      autoRotate: true,
      mobilePanelOpen: false,
      showArcs: false,
      flyTo: null,
      highlightedSiteIds: null,
      watchedCompanyIds: [],
      watchedSiteIds: [],

      selectSite: (id) =>
        set({
          selectedSiteId: id,
          selectedCompanyId: null,
          selectedCountryId: null,
          panelView: id ? 'site' : 'overview',
          mobilePanelOpen: !!id,
          highlightedSiteIds: id ? [id] : null,
        }),

      selectCompany: (id) =>
        set({
          selectedCompanyId: id,
          selectedSiteId: null,
          selectedCountryId: null,
          panelView: id ? 'company' : 'overview',
          mobilePanelOpen: !!id,
        }),

      selectCountry: (id) =>
        set({
          selectedCountryId: id,
          selectedSiteId: null,
          selectedCompanyId: null,
          panelView: id ? 'country' : 'overview',
          mobilePanelOpen: !!id,
        }),

      setPanelView: (view) =>
        set({
          panelView: view,
          mobilePanelOpen: view !== 'overview',
        }),

      setMetalFilter: (f) => set({ metalFilter: f }),
      setPeriod: (p) => set({ period: p }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSearchOpen: (open) => set({ searchOpen: open }),
      setInfoOpen: (open) => set({ infoOpen: open }),
      setAutoRotate: (v) => set({ autoRotate: v }),
      setMobilePanelOpen: (v) => set({ mobilePanelOpen: v }),
      setShowArcs: (v) => set({ showArcs: v }),

      requestFlyTo: (lat, lng, altitude = 1.8) =>
        set({
          flyTo: { lat, lng, altitude, nonce: Date.now() },
          autoRotate: false,
        }),

      setHighlightedSites: (ids) => set({ highlightedSiteIds: ids }),

      toggleWatchCompany: (id) => {
        const cur = get().watchedCompanyIds;
        set({
          watchedCompanyIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
        });
      },

      toggleWatchSite: (id) => {
        const cur = get().watchedSiteIds;
        set({
          watchedSiteIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
        });
      },

      toggleCompare: (prefixedId) => {
        const cur = get().compareIds;
        if (cur.includes(prefixedId)) {
          set({ compareIds: cur.filter((x) => x !== prefixedId) });
        } else if (cur.length < 3) {
          set({ compareIds: [...cur, prefixedId], panelView: 'compare', mobilePanelOpen: true });
        }
      },

      clearCompare: () => set({ compareIds: [], panelView: 'overview' }),

      resetSelection: () =>
        set({
          selectedSiteId: null,
          selectedCompanyId: null,
          selectedCountryId: null,
          panelView: 'overview',
          highlightedSiteIds: null,
          mobilePanelOpen: false,
        }),
    }),
    {
      name: 'mineglobe-watchlist',
      partialize: (s) => ({
        watchedCompanyIds: s.watchedCompanyIds,
        watchedSiteIds: s.watchedSiteIds,
        metalFilter: s.metalFilter,
        period: s.period,
        showArcs: s.showArcs,
      }),
    },
  ),
);
