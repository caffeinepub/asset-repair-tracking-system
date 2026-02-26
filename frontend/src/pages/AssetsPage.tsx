import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/StatusBadge';
import AddAssetForm from '@/components/AddAssetForm';
import AssetDetailModal from '@/components/AssetDetailModal';
import { useListAssets, useDeleteAsset } from '@/hooks/useQueries';
import { Asset, AssetStatus } from '@/backend';

const MODELS = ['VX680', 'VX820', 'M400', 'Carbon 10', 'Carbon 8'];

export default function AssetsPage() {
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const { data: assets, isLoading } = useListAssets();
  const deleteAsset = useDeleteAsset();

  const filtered = (assets ?? []).filter((asset) => {
    const matchesSearch =
      !search ||
      asset.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      asset.model.toLowerCase().includes(search.toLowerCase()) ||
      asset.client.toLowerCase().includes(search.toLowerCase());
    const matchesModel = modelFilter === 'all' || asset.model === modelFilter;
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
    return matchesSearch && matchesModel && matchesStatus;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage registered devices</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by serial, model, or client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background text-foreground placeholder:text-muted-foreground border-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter:</span>
            </div>
            <Select value={modelFilter} onValueChange={setModelFilter}>
              <SelectTrigger className="w-36 bg-background text-foreground border-input">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="all">All Models</SelectItem>
                {MODELS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-background text-foreground border-input">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={AssetStatus.inField}>In Field</SelectItem>
                <SelectItem value={AssetStatus.inRepair}>In Repair</SelectItem>
                <SelectItem value={AssetStatus.inProgramming}>In Programming</SelectItem>
                <SelectItem value={AssetStatus.deployed}>Deployed</SelectItem>
                <SelectItem value={AssetStatus.scrapped}>Scrapped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-card-foreground">
            {isLoading ? 'Loading...' : `${filtered.length} Asset${filtered.length !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">No assets found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Serial Number</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Model</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Client</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Condition</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Registered</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((asset) => (
                  <TableRow
                    key={asset.serialNumber}
                    className="border-border hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedAsset(asset)}
                  >
                    <TableCell className="font-mono text-sm text-foreground">{asset.serialNumber}</TableCell>
                    <TableCell className="text-sm text-foreground">{asset.model}</TableCell>
                    <TableCell className="text-sm text-foreground">{asset.client}</TableCell>
                    <TableCell>
                      <StatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{asset.condition}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(Number(asset.dateFirstRegistered) / 1_000_000).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                        onClick={() => deleteAsset.mutate(asset.serialNumber)}
                        disabled={deleteAsset.isPending}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showAddForm && <AddAssetForm open={showAddForm} onClose={() => setShowAddForm(false)} />}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          open={!!selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
}
