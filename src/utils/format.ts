import type { Metal, ProductionUnit } from '../data/types';
import { METAL_LABELS } from './colors';

export function formatProduction(value: number, unit: ProductionUnit): string {
  if (unit === 'Moz') {
    return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`;
  }
  if (value >= 1000 && unit === 'koz') {
    return `${(value / 1000).toFixed(2)} Moz`;
  }
  if (Number.isInteger(value)) return `${value.toLocaleString()} ${unit}`;
  return `${value.toFixed(1)} ${unit}`;
}

export function formatYoy(yoy: number | null): string {
  if (yoy === null || yoy === undefined) return '—';
  const sign = yoy > 0 ? '+' : '';
  return `${sign}${yoy.toFixed(1)}%`;
}

export function formatAisc(aisc: number | null): string {
  if (aisc === null || aisc === undefined) return '—';
  return `$${aisc.toLocaleString()}/oz`;
}

export function formatMetal(metal: Metal): string {
  return METAL_LABELS[metal] ?? metal;
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function yoyTone(yoy: number | null): 'up' | 'down' | 'flat' {
  if (yoy === null || Math.abs(yoy) < 0.05) return 'flat';
  return yoy > 0 ? 'up' : 'down';
}

export const DATA_DISCLAIMER =
  'Illustrative data based on public company reports and filings as of mid-2026. For demonstration and educational purposes only. Always verify with official 10-Q/10-K, AIF, or company IR releases. Not financial advice.';

export const SHORT_DISCLAIMER =
  'Illustrative demo data · Not financial advice · Verify with official filings';
