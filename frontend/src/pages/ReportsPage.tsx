import { useState } from 'react';
import {
  useListAssets,
  useListAllRepairs,
  useGetMostReplacedParts,
  useGetRepeatedFaultAssets,
} from '../hooks/useQueries';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BarChart2, AlertTriangle, Wrench, Package } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const LIME_GREEN = '#84cc16';

export default function ReportsPage() {
  const { data: assets = [] } = useListAssets();
  const { data: repairs = [] } = useListAllRepairs();
  const { data: mostReplacedParts = [] } = useGetMostReplacedParts(10n);
  const { data: repeatedFaultAssets = [] } = useGetRepeatedFaultAssets(3n);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [yearLimit, setYearLimit] = useState(3);
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  const tickColor = isDark ? LIME_GREEN : undefined;
  const gridColor = isDark ? '#84cc1640' : 'oklch(0.88 0.01 240)';
  const tooltipStyle = isDark
    ? {
        backgroundColor: 'var(--card)',
        border: `1px solid ${LIME_GREEN}40`,
        borderRadius: '6px',
        fontSize: '12px',
        color: LIME_GREEN,
      }
    : {
        backgroundColor: 'oklch(0.18 0.025 240)',
        border: '1px solid oklch(0.25 0.03 240)',
        borderRadius: '6px',
        fontSize: '12px',
        color: 'oklch(0.92 0.01 240)',
      };

  // Repair frequency by serial
  const repairFrequency = assets
    .map(a => ({
      serial: a.serialNumber,
      count: repairs.filter(r => r.serialNumber === a.serialNumber).length,
    }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Technician workload
  const techWorkload: Record<string, number> = {};
  repairs.forEach(r => {
    techWorkload[r.technicianName] = (techWorkload[r.technicianName] || 0) + 1;
  });
  const techData = Object.entries(techWorkload)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Parts chart data
  const partsChartData = mostReplacedParts.map(([pn, name, qty]) => ({
    name: name || pn,
    qty: Number(qty),
  }));

  // Yearly limit alerts
  const yearStart = BigInt(new Date(yearFilter, 0, 1).getTime()) * 1_000_000n;
  const yearEnd = BigInt(new Date(yearFilter + 1, 0, 1).getTime()) * 1_000_000n;
  const yearlyAlerts = assets.filter(a => {
    const count = repairs.filter(
      r =>
        r.serialNumber === a.serialNumber &&
        r.repairStartDate >= yearStart &&
        r.repairStartDate < yearEnd
    ).length;
    return count > yearLimit;
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-foreground">Reports & Analytics</h2>
        <p className="text-sm text-muted-foreground">Insights into repair operations and asset health</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Repair Frequency */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Top Repaired Assets</h3>
          </div>
          {repairFrequency.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No repair data available</p>
          ) : (
            <div className="space-y-2">
              {repairFrequency.map(item => (
                <div key={item.serial} className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground w-32 truncate">{item.serial}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(item.count / repairFrequency[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-6 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Replaced Parts */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Most Replaced Parts</h3>
          </div>
          {partsChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No parts data available</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={partsChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: tickColor }}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: tickColor }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="qty" fill="oklch(0.55 0.18 240)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Technician Workload */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Technician Workload</h3>
          </div>
          {techData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No technician data available</p>
          ) : (
            <div className="space-y-2">
              {techData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-28 truncate">{item.name}</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-success h-2 rounded-full"
                      style={{ width: `${(item.count / techData[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-foreground w-6 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Repeated Fault Assets */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="text-sm font-semibold text-foreground">Repeated Fault Assets (≥3 repairs)</h3>
          </div>
          {repeatedFaultAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No repeated fault assets</p>
          ) : (
            <div className="space-y-1.5">
              {repeatedFaultAssets.map(asset => (
                <div key={asset.serialNumber} className="flex items-center justify-between p-2 bg-warning/10 border border-warning/20 rounded">
                  <div>
                    <p className="text-xs font-mono font-medium text-foreground">{asset.serialNumber}</p>
                    <p className="text-xs text-muted-foreground">{asset.model} · {asset.client}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Yearly Repair Limit */}
      <div className="bg-card border border-border rounded-lg p-4">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Yearly Repair Limit Alerts</h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">Year:</label>
            <input
              type="number"
              value={yearFilter}
              onChange={e => setYearFilter(Number(e.target.value))}
              className="h-7 w-20 px-2 text-xs rounded border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <label className="text-xs text-muted-foreground">Limit:</label>
            <input
              type="number"
              value={yearLimit}
              onChange={e => setYearLimit(Number(e.target.value))}
              className="h-7 w-16 px-2 text-xs rounded border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
        {yearlyAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No assets exceeded the repair limit of {yearLimit} in {yearFilter}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {yearlyAlerts.map(asset => (
              <div key={asset.serialNumber} className="p-2 bg-destructive/10 border border-destructive/20 rounded">
                <p className="text-xs font-mono font-medium text-foreground">{asset.serialNumber}</p>
                <p className="text-xs text-muted-foreground">{asset.model} · {asset.client}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
