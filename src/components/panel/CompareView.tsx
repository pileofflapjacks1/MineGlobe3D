import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { X } from 'lucide-react';
import {
  companyById,
  getCompanyAggregates,
  getLatestSiteMetrics,
  getSiteVolumeScore,
  siteById,
} from '../../data/miningData';
import { useAppStore } from '../../store/useAppStore';
import { Disclaimer } from '../ui/Disclaimer';

const COLORS = ['#d4af37', '#0ea5e9', '#a8b5c4'];

export function CompareView() {
  const compareIds = useAppStore((s) => s.compareIds);
  const toggleCompare = useAppStore((s) => s.toggleCompare);
  const clearCompare = useAppStore((s) => s.clearCompare);
  const period = useAppStore((s) => s.period);

  if (!compareIds.length) {
    return (
      <div className="space-y-3">
        <h2 className="text-xl font-bold">Compare</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Add up to 3 companies or sites using the compare icon on detail views. Comparison uses
          illustrative production / AISC / YoY KPIs.
        </p>
        <Disclaimer />
      </div>
    );
  }

  const items = compareIds.map((pid) => {
    const [kind, id] = pid.split(':') as ['c' | 's', string];
    if (kind === 'c') {
      const co = companyById[id];
      const aggs = getCompanyAggregates(id);
      const gold = aggs.find((a) => a.metal === 'gold') ?? aggs[0];
      return {
        pid,
        label: co?.ticker ?? id,
        name: co?.name ?? id,
        production: gold?.production ?? 0,
        aisc: gold?.aisc ?? 0,
        yoy: Math.abs(gold?.yoyPct ?? 0),
        sites: 0,
      };
    }
    const site = siteById[id];
    const m = getLatestSiteMetrics(id, period)[0];
    return {
      pid,
      label: site?.name?.slice(0, 14) ?? id,
      name: site?.name ?? id,
      production: m?.production ?? getSiteVolumeScore(id, period),
      aisc: m?.aisc ?? 0,
      yoy: Math.abs(m?.yoyPct ?? 0),
      sites: 1,
    };
  });

  // Normalize for radar 0–100
  const maxP = Math.max(...items.map((i) => i.production), 1);
  const maxA = Math.max(...items.map((i) => i.aisc || 1), 1);
  const maxY = Math.max(...items.map((i) => i.yoy || 1), 1);

  const axes = ['Production', 'Cost efficiency', 'YoY momentum'];
  const radarData = axes.map((axis) => {
    const row: Record<string, string | number> = { axis };
    items.forEach((item, idx) => {
      if (axis === 'Production') row[item.label] = (item.production / maxP) * 100;
      if (axis === 'Cost efficiency')
        row[item.label] = item.aisc ? ((maxA - item.aisc + maxA * 0.1) / maxA) * 100 : 50;
      if (axis === 'YoY momentum') row[item.label] = Math.min(100, (item.yoy / maxY) * 100);
      void idx;
    });
    return row;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-dim)]">
            Comparison
          </p>
          <h2 className="text-xl font-bold">Side-by-side KPIs</h2>
        </div>
        <button
          type="button"
          onClick={clearCompare}
          className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={item.pid}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs"
            style={{ borderColor: `${COLORS[i]}66`, color: COLORS[i] }}
          >
            {item.label}
            <button
              type="button"
              aria-label={`Remove ${item.label}`}
              onClick={() => toggleCompare(item.pid)}
              className="rounded-full p-0.5 hover:bg-white/10"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      <div className="h-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#1e2a42" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: '#8b9bb4', fontSize: 10 }} />
            <Tooltip
              contentStyle={{
                background: '#121a2e',
                border: '1px solid #1e2a42',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {items.map((item, i) => (
              <Radar
                key={item.pid}
                name={item.label}
                dataKey={item.label}
                stroke={COLORS[i]}
                fill={COLORS[i]}
                fillOpacity={0.2}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-border)]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[var(--color-bg)] text-[var(--color-text-dim)]">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Production</th>
              <th className="px-3 py-2">AISC</th>
              <th className="px-3 py-2">|YoY|</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.pid} className="border-t border-[var(--color-border-subtle)]">
                <td className="px-3 py-2 font-medium" style={{ color: COLORS[i] }}>
                  {item.name}
                </td>
                <td className="px-3 py-2 tabular-nums">{item.production.toLocaleString()}</td>
                <td className="px-3 py-2 tabular-nums">
                  {item.aisc ? `$${item.aisc}` : '—'}
                </td>
                <td className="px-3 py-2 tabular-nums">{item.yoy.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-[var(--color-text-dim)]">
        Radar axes are normalized within the comparison set for visual contrast only.
      </p>
      <Disclaimer />
    </div>
  );
}
