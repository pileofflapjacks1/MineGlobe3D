import type { Metal } from '../data/types';

export const METAL_COLORS: Record<Metal, string> = {
  gold: '#d4af37',
  silver: '#a8b5c4',
  platinum: '#0ea5e9',
  palladium: '#38bdf8',
  copper: '#ea580c',
};

export const METAL_LABELS: Record<Metal, string> = {
  gold: 'Gold',
  silver: 'Silver',
  platinum: 'Platinum',
  palladium: 'Palladium',
  copper: 'Copper',
};

export const METAL_FILTER_OPTIONS: { id: Metal | 'all' | 'pgm'; label: string; color: string }[] = [
  { id: 'all', label: 'All', color: '#e8edf5' },
  { id: 'gold', label: 'Gold', color: '#d4af37' },
  { id: 'silver', label: 'Silver', color: '#a8b5c4' },
  { id: 'pgm', label: 'PGM', color: '#0ea5e9' },
];

export function isPgm(metal: Metal): boolean {
  return metal === 'platinum' || metal === 'palladium';
}

export function metalMatchesFilter(metal: Metal, filter: Metal | 'all' | 'pgm'): boolean {
  if (filter === 'all') return true;
  if (filter === 'pgm') return isPgm(metal);
  return metal === filter;
}
