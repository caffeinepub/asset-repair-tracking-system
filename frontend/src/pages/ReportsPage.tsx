import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import StatusBadge from '@/components/StatusBadge';
import {
  useListAssets,
  useListAllRepairs,
  useGetMostReplacedParts,
  useGetRepeatedFaultAssets,
  useGetRepairsExceedingYearlyLimit,
} from '@/hooks/useQueries';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-popover-foreground mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-xs text-muted-foreground">
            <span style={{ color: entry.color }}>{entry.name}</span>:{' '}
            <span className="font-semibold text-popover-foreground">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function ReportsPage() {
  const [yearlyLimitYear, setYearlyLimitYear] = useState(new Date().getFullYear());
  const [yearlyLimitThreshold, setYearlyLimitThreshold] = useState(3);
  const [repeatedFaultThreshold, setRepeatedFaultThreshold] = useState(2);

  const { data: assets, isLoading: assetsLoading } = useListAssets();
  const { data: repairs, isLoading: repairsLoading } = useListAllRepairs();
  const { data: mostReplacedParts, isLoading: partsLoading } = useGetMostReplacedParts(5n);
  const { data: repeatedFaultAssets, isLoading: repeatedLoading } = useGetRepeatedFaultAssets(
    BigInt(repeatedFaultThreshold)
  );
  const { data: yearlyExceedingAssets, isLoading: yearlyLoading } = useGetRepairsExceedingYearlyLimit(
    BigInt(yearlyLimitThreshold),
    BigInt(yearlyLimitYear)
  );

  // Repair frequency by serial
  const repairFrequencyData = React.useMemo(() => {
    if (!repairs || !assets) return [];
    const countMap: Record<string, number> = {};
    repairs.forEach((r) => {
      countMap[r.serialNumber] = (countMap[r.serialNumber] || 0) + 1;
    });
    return Object.entries(countMap)
      .map(([serial, count]) => ({ serial: serial.slice(0, 8), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [repairs, assets]);

  // Parts usage data
  const partsData = React.useMemo(() => {
    if (!mostReplacedParts) return [];
    return mostReplacedParts.map(([partNumber, partName, qty]) => ({
      part: partName || partNumber,
      qty: Number(qty),
    }));
  }, [mostReplacedParts]);

  // Technician workload
  const technicianData = React.useMemo(() => {
    if (!repairs) return [];
    const countMap: Record<string, number> = {};
    repairs.forEach((r) => {
      countMap[r.technicianName] = (countMap[r.technicianName] || 0) + 1;
    });
    return Object.entries(countMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [repairs]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Insights into repair operations and asset health</p>
      </div>

      {/* Repair Frequency Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-card-foreground">Repair Frequency by Asset</CardTitle>
        </CardHeader>
        <CardContent>
          {repairsLoading || assetsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : repairFrequencyData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No repair data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={repairFrequencyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="serial"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
                <Bar dataKey="count" name="Repairs" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Parts Usage Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-card-foreground">Most Replaced Parts</CardTitle>
        </CardHeader>
        <CardContent>
          {partsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : partsData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No parts data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={partsData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="part"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={120}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
                <Bar dataKey="qty" name="Qty Used" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Technician Workload */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-card-foreground">Technician Workload</CardTitle>
        </CardHeader>
        <CardContent>
          {repairsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : technicianData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No technician data available.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={technicianData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.5 }} />
                <Legend
                  wrapperStyle={{ color: 'var(--muted-foreground)', fontSize: '12px' }}
                />
                <Bar dataKey="count" name="Tickets" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Repeated Fault Assets */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold text-card-foreground">Repeated Fault Assets</CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="fault-threshold" className="text-sm text-muted-foreground whitespace-nowrap">
                Min repairs:
              </Label>
              <Input
                id="fault-threshold"
                type="number"
                min={1}
                value={repeatedFaultThreshold}
                onChange={(e) => setRepeatedFaultThreshold(Number(e.target.value))}
                className="w-20 h-8 text-sm bg-background text-foreground border-input"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {repeatedLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : !repeatedFaultAssets || repeatedFaultAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">No assets with repeated faults.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Serial</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Model</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Client</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repeatedFaultAssets.map((asset) => (
                  <TableRow key={asset.serialNumber} className="border-border hover:bg-muted/50">
                    <TableCell className="font-mono text-sm text-foreground">{asset.serialNumber}</TableCell>
                    <TableCell className="text-sm text-foreground">{asset.model}</TableCell>
                    <TableCell className="text-sm text-foreground">{asset.client}</TableCell>
                    <TableCell><StatusBadge status={asset.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Yearly Limit Exceeded */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold text-card-foreground">Assets Exceeding Yearly Repair Limit</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Label htmlFor="yearly-year" className="text-sm text-muted-foreground whitespace-nowrap">Year:</Label>
                <Input
                  id="yearly-year"
                  type="number"
                  min={2020}
                  max={2030}
                  value={yearlyLimitYear}
                  onChange={(e) => setYearlyLimitYear(Number(e.target.value))}
                  className="w-24 h-8 text-sm bg-background text-foreground border-input"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="yearly-limit" className="text-sm text-muted-foreground whitespace-nowrap">Limit:</Label>
                <Input
                  id="yearly-limit"
                  type="number"
                  min={1}
                  value={yearlyLimitThreshold}
                  onChange={(e) => setYearlyLimitThreshold(Number(e.target.value))}
                  className="w-20 h-8 text-sm bg-background text-foreground border-input"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {yearlyLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : !yearlyExceedingAssets || yearlyExceedingAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">No assets exceeding the yearly repair limit.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Serial</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Model</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Client</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {yearlyExceedingAssets.map((asset) => (
                  <TableRow key={asset.serialNumber} className="border-border hover:bg-muted/50">
                    <TableCell className="font-mono text-sm text-foreground">{asset.serialNumber}</TableCell>
                    <TableCell className="text-sm text-foreground">{asset.model}</TableCell>
                    <TableCell className="text-sm text-foreground">{asset.client}</TableCell>
                    <TableCell><StatusBadge status={asset.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
