import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRepairsByStage } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';

const STAGE_LABELS: Record<string, string> = {
  awaitingParts: 'Awaiting Parts',
  closed: 'Closed',
  deployed: 'Deployed',
  diagnosing: 'Diagnosing',
  programming: 'Programming',
  qaTesting: 'QA Testing',
  readyDeploy: 'Ready Deploy',
  received: 'Received',
  repairing: 'Repairing',
};

const STAGE_KEYS = [
  'awaitingParts',
  'closed',
  'deployed',
  'diagnosing',
  'programming',
  'qaTesting',
  'readyDeploy',
  'received',
  'repairing',
] as const;

export default function RepairsByStageChart() {
  const { data, isLoading } = useRepairsByStage();

  const chartData = STAGE_KEYS.map((key) => ({
    stage: STAGE_LABELS[key],
    count: data ? Number(data[key]) : 0,
  }));

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Repairs by Stage</h3>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-[220px] w-full rounded" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: -16, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="stage"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                angle={-45}
                textAnchor="end"
                interval={0}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
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
                fill="#10b981"
                radius={[3, 3, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
