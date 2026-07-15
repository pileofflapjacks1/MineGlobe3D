import { Line, LineChart, ResponsiveContainer } from 'recharts';

interface Props {
  data: number[];
  color?: string;
  width?: number | string;
  height?: number;
  positive?: boolean;
}

export function Sparkline({
  data,
  color,
  width = '100%',
  height = 32,
  positive,
}: Props) {
  const stroke =
    color ??
    (positive === undefined
      ? '#d4af37'
      : positive
        ? '#34d399'
        : '#f87171');

  const series = data.map((v, i) => ({ i, v }));

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
