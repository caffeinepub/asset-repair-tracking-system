import { useState } from 'react';
import { useListAssets, useDeleteAsset, useGetClients, useGetCallerUserProfile } from '../hooks/useQueries';
import StatusBadge from '../components/StatusBadge';
import AddAssetForm from '../components/AddAssetForm';
import EditAssetForm from '../components/EditAssetForm';
import { AssetDetailModal } from '../components/AssetDetailModal';
import { Asset, AssetStatus, AppUserRole } from '../backend';
import { Search, Plus, Trash2, Eye, Edit, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: AssetStatus.inField, label: 'In Field' },
  { value: AssetStatus.inRepair, label: 'In Repair' },
  { value: AssetStatus.inProgramming, label: 'In Programming' },
  { value: AssetStatus.deployed, label: 'Deployed' },
  { value: AssetStatus.scrapped, label: 'Scrapped' },
];

function exportAssetsToCSV(assets: Asset[]) {
  const headers = ['Serial Number', 'Model', 'Client', 'Status', 'Condition', 'Date Registered'];
  const rows = assets.map(a => [
    a.serialNumber,
    a.model,
    a.client,
    a.status,
    a.condition,
    new Date(Number(a.dateFirstRegistered) / 1_000_000).toLocaleDateString(),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'assets.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function AssetsPage() {
  const { data: assets = [], isLoading } = useListAssets();
  const { data: clients = [] } = useGetClients();
  const { data: userProfile } = useGetCallerUserProfile();
  const deleteAsset = useDeleteAsset();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [viewAsset, setViewAsset] = useState<Asset | null>(null);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = userProfile?.appRole === AppUserRole.admin;

  const filtered = assets.filter(a => {
    const matchSearch =
      !search ||
      a.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.model.toLowerCase().includes(search.toLowerCase()) ||
      a.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || a.status === filterStatus;
    const matchClient = !filterClient || a.client === filterClient;
    return matchSearch && matchStatus && matchClient;
  });

  const handleDelete = async (serialNumber: string) => {
    if (!confirm(`Delete asset ${serialNumber}? This cannot be undone.`)) return;
    setDeletingId(serialNumber);
    try {
      await deleteAsset.mutateAsync(serialNumber);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Assets</h2>
          <p className="text-sm text-muted-foreground">Manage and track all registered assets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportAssetsToCSV(filtered)}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Asset
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search serial, model, client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm bg-background"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="h-8 px-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filterClient}
          onChange={e => setFilterClient(e.target.value)}
          className="h-8 px-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Clients</option>
          {clients.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Serial #</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Model</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Condition</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Registered</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No assets found
                  </td>
                </tr>
              ) : (
                filtered.map(asset => (
                  <tr key={asset.serialNumber} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">{asset.serialNumber}</td>
                    <td className="px-4 py-2.5 text-foreground">{asset.model}</td>
                    <td className="px-4 py-2.5 text-foreground">{asset.client}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={asset.status} /></td>
                    <td className="px-4 py-2.5 text-muted-foreground">{asset.condition}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">
                      {new Date(Number(asset.dateFirstRegistered) / 1_000_000).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setViewAsset(asset)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditAsset(asset)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(asset.serialNumber)}
                            disabled={deletingId === asset.serialNumber}
                          >
                            {deletingId === asset.serialNumber ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">{filtered.length} asset{filtered.length !== 1 ? 's' : ''} shown</p>
        </div>
      </div>

      {/* Modals */}
      {showAdd && <AddAssetForm open={showAdd} onClose={() => setShowAdd(false)} />}
      {editAsset && <EditAssetForm asset={editAsset} open={!!editAsset} onClose={() => setEditAsset(null)} />}
      {viewAsset && <AssetDetailModal asset={viewAsset} open={!!viewAsset} onClose={() => setViewAsset(null)} />}
    </div>
  );
}
