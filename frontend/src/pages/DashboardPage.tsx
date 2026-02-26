import React from 'react';
import { Package, Wrench, AlertTriangle, CheckCircle } from 'lucide-react';
import KPICard from '@/components/KPICard';
import RepairsByStageChart from '@/components/RepairsByStageChart';
import TopFailingModelsChart from '@/components/TopFailingModelsChart';
import StatusBadge from '@/components/StatusBadge';
import {
  useListAssets,
  useListAllRepairs,
  useGetLowStockParts,
} from '@/hooks/useQueries';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AssetStatus, RepairOutcome } from '@/backend';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DashboardPage() {
  const { data: assets, isLoading: assetsLoading } = useListAssets();
  const { data: repairs, isLoading: repairsLoading } = useListAllRepairs();
  const { data: lowStockParts, isLoading: partsLoading } = useGetLowStockParts();

  const totalAssets = assets?.length ?? 0;
  const inRepair = assets?.filter((a) => a.status === AssetStatus.inRepair).length ?? 0;
  const openRepairs = repairs?.filter((r) => r.outcome === RepairOutcome.pending).length ?? 0;
  const lowStock = lowStockParts?.length ?? 0;

  const recentRepairs = repairs
    ? [...repairs]
        .sort((a, b) => Number(b.dateReceived) - Number(a.dateReceived))
        .slice(0, 5)
    : [];

  const recentAssets = assets
    ? [...assets]
        .sort((a, b) => Number(b.dateFirstRegistered) - Number(a.dateFirstRegistered))
        .slice(0, 5)
    : [];

  return (
    <div className="p-6 space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your repair operations</p>
      </div>

      {/* Low stock alert */}
      {!partsLoading && lowStock > 0 && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-destructive font-semibold">Low Stock Alert</AlertTitle>
          <AlertDescription className="text-destructive/90">
            {lowStock} part{lowStock !== 1 ? 's are' : ' is'} running low on stock. Visit Parts Inventory to restock.
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {assetsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))
        ) : (
          <>
            <KPICard
              title="Total Assets"
              value={totalAssets}
              description="Registered devices"
              icon={Package}
              iconColor="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
            />
            <KPICard
              title="In Repair"
              value={inRepair}
              description="Currently being serviced"
              icon={Wrench}
              iconColor="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            />
            <KPICard
              title="Open Tickets"
              value={openRepairs}
              description="Pending resolution"
              icon={AlertTriangle}
              iconColor="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
            />
            <KPICard
              title="Low Stock Parts"
              value={lowStock}
              description="Parts needing restock"
              icon={CheckCircle}
              iconColor="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RepairsByStageChart />
        <TopFailingModelsChart />
      </div>

      {/* Recent Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Repairs */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-card-foreground">Recent Repair Tickets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {repairsLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : recentRepairs.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No repair tickets yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium text-xs">Ticket ID</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs">Serial</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs">Stage</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs">Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRepairs.map((repair) => (
                    <TableRow key={repair.ticketId} className="border-border hover:bg-muted/50">
                      <TableCell className="text-xs font-mono text-foreground py-2">
                        {repair.ticketId.slice(0, 12)}...
                      </TableCell>
                      <TableCell className="text-xs text-foreground py-2">{repair.serialNumber}</TableCell>
                      <TableCell className="text-xs text-foreground py-2">{repair.currentStage}</TableCell>
                      <TableCell className="py-2">
                        <StatusBadge outcome={repair.outcome} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Assets */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-card-foreground">Recently Registered Assets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {assetsLoading ? (
              <div className="p-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : recentAssets.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No assets registered yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium text-xs">Serial</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs">Model</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs">Client</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentAssets.map((asset) => (
                    <TableRow key={asset.serialNumber} className="border-border hover:bg-muted/50">
                      <TableCell className="text-xs font-mono text-foreground py-2">{asset.serialNumber}</TableCell>
                      <TableCell className="text-xs text-foreground py-2">{asset.model}</TableCell>
                      <TableCell className="text-xs text-foreground py-2">{asset.client}</TableCell>
                      <TableCell className="py-2">
                        <StatusBadge status={asset.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
