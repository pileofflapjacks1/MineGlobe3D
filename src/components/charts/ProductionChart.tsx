import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SiteMetric } from '../../data/types';
import { METAL_COLORS } from '../../utils/colors';
import type { Metal } from '../../data/types';

interface Props {
  metrics: SiteMetric[];
  metal?: Metal;
  height?: number;
}

/** Build period-ordered series for one metal (or primary available). */
export function ProductionChart({ metrics, metal, height = 180 }: Props) {
  if (!metrics.length) {
    return (
      <div className="flex h-[180px] items-center justify-center text-sm text-[var(--color-text-dim)]">
        No trend data for this selection
      </div>
    );
  }

  const metals = metal
    ? [metal]
    : ([...new Set(metrics.map((m) => m.metal))] as Metal[]);

  const periods = [...new Set(metrics.map((m) => m.period))].sort((a, b) => {
    const order = ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025', 'FY 2025', 'Q1 2026', 'Q2 2026'];
    return order.indexOf(a) - order.indexOf(b);
  });

  // Prefer quarterly for trends; drop FY if we have quarters
  const hasQuarterly = periods.some((p) => p.startsWith('Q'));
  const chartPeriods = hasQuarterly ? periods.filter((p) => p.startsWith('Q')) : periods;

  const data = chartPeriods.map((period) => {
    const row: Record<string, string | number> = { period };
    for (const m of metals) {
      const hit = metrics.find((x) => x.period === period && x.metal === m);
      if (hit) row[m] = hit.production;
    }
    return row;
  });

  const unit = metrics.find((m) => metals.includes(m.metal))?.unit ?? 'koz';

  if (metals.length === 1) {
    const m = metals[0];
    const color = METAL_COLORS[m];
    return (
      <div className="w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${m}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1e2a42" strokeDasharray="3 3" />
            <XAxis
              dataKey="period"
              tick={{ fill: '#8b9bb4', fontSize: 10 }}
              axisLine={{ stroke: '#1e2a42' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#8b9bb4', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={40}
              unit={` ${unit}`}
            />
            <Tooltip
              contentStyle={{
                background: '#121a2e',
                border: '1px solid #1e2a42',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#a8b5c4' }}
              formatter={(value) => [`${value} ${unit}`, m]}
            />
            <Area
              type="monotone"
              dataKey={m}
              stroke={color}
              fill={`url(#grad-${m})`}
              strokeWidth={2}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1e2a42" strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            tick={{ fill: '#8b9bb4', fontSize: 10 }}
            axisLine={{ stroke: '#1e2a42' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#8b9bb4', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              background: '#121a2e',
              border: '1px solid #1e2a42',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          {metals.map((m) => (
            <Bar key={m} dataKey={m} fill={METAL_COLORS[m]} radius={[3, 3, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
