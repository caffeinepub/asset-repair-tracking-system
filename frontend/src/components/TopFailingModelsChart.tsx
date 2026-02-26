import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTopFailingModels } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

const MODEL_LABELS: Record<string, string> = {
  vx680: 'VX680',
  vx820: 'VX820',
  m400: 'M400',
  carbon10: 'Carbon 10',
  carbon8: 'Carbon 8',
};

const MODEL_KEYS = ['vx680', 'vx820', 'm400', 'carbon10', 'carbon8'] as const;

export default function TopFailingModelsChart() {
  const { data, isLoading } = useTopFailingModels();

  const chartData = MODEL_KEYS
    .map((key) => ({
      model: MODEL_LABELS[key],
      count: data ? Number(data[key]) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Top Failing Models</h3>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-[220px] w-full rounded" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              layout="vertical"
              data={chartData}
              margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="model"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                width={72}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: 'var(--foreground)',
                }}
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                formatter={(value: number) => [value, 'Repairs']}
              />
              <Bar
                dataKey="count"
                radius={[0, 3, 3, 0]}
                maxBarSize={36}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill="#f59e0b" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
