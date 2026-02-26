import { useListAssets, useListAllRepairs, useGetLowStockParts } from '../hooks/useQueries';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import RepairsByStageChart from '../components/RepairsByStageChart';
import TopFailingModelsChart from '../components/TopFailingModelsChart';
import { AssetStatus, RepairOutcome } from '../backend';
import { Cpu, Wrench, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { data: assets = [], isLoading: assetsLoading } = useListAssets();
  const { data: repairs = [], isLoading: repairsLoading } = useListAllRepairs();
  const { data: lowStockParts = [], isLoading: partsLoading } = useGetLowStockParts();

  const totalAssets = assets.length;
  const inRepair = assets.filter(a => a.status === AssetStatus.inRepair).length;
  const inField = assets.filter(a => a.status === AssetStatus.inField).length;
  const pendingRepairs = repairs.filter(r => r.outcome === RepairOutcome.pending).length;
  const completedRepairs = repairs.filter(r => r.outcome !== RepairOutcome.pending).length;

  const recentRepairs = [...repairs]
    .sort((a, b) => Number(b.dateReceived) - Number(a.dateReceived))
    .slice(0, 5);

  const recentAssets = [...assets]
    .sort((a, b) => Number(b.dateFirstRegistered) - Number(a.dateFirstRegistered))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Overview of your asset repair operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          title="Total Assets"
          value={totalAssets}
          icon={Cpu}
          loading={assetsLoading}
        />
        <KPICard
          title="In Field"
          value={inField}
          icon={CheckCircle}
          accent="success"
          loading={assetsLoading}
        />
        <KPICard
          title="In Repair"
          value={inRepair}
          icon={Wrench}
          accent="warning"
          loading={assetsLoading}
        />
        <KPICard
          title="Pending Repairs"
          value={pendingRepairs}
          icon={Clock}
          accent="warning"
          loading={repairsLoading}
        />
        <KPICard
          title="Completed"
          value={completedRepairs}
          icon={CheckCircle}
          accent="success"
          loading={repairsLoading}
        />
        <KPICard
          title="Low Stock"
          value={lowStockParts.length}
          icon={AlertTriangle}
          accent={lowStockParts.length > 0 ? 'destructive' : 'default'}
          loading={partsLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RepairsByStageChart />
        <TopFailingModelsChart />
      </div>

      {/* Recent Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Repairs */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Recent Repair Tickets</h3>
          </div>
          {repairsLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : recentRepairs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No repair tickets yet</div>
          ) : (
            <div className="divide-y divide-border">
              {recentRepairs.map(repair => (
                <div key={repair.ticketId} className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{repair.ticketId}</p>
                    <p className="text-xs text-muted-foreground truncate">{repair.serialNumber}</p>
                  </div>
                  <StatusBadge outcome={repair.outcome} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Assets */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Recently Registered Assets</h3>
          </div>
          {assetsLoading ? (
            <div className="p-4 space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : recentAssets.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No assets registered yet</div>
          ) : (
            <div className="divide-y divide-border">
              {recentAssets.map(asset => (
                <div key={asset.serialNumber} className="px-4 py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{asset.serialNumber}</p>
                    <p className="text-xs text-muted-foreground truncate">{asset.model} · {asset.client}</p>
                  </div>
                  <StatusBadge status={asset.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">Low Stock Alert</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {lowStockParts.map(part => (
              <div key={part.partNumber} className="bg-card border border-border rounded p-2">
                <p className="text-xs font-medium text-foreground">{part.partName}</p>
                <p className="text-xs text-muted-foreground">{part.partNumber}</p>
                <p className="text-xs text-destructive font-medium mt-0.5">
                  {Number(part.quantityInStock)} in stock (threshold: {Number(part.lowStockThreshold)})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
