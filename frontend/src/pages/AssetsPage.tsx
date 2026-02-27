import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { Asset, AssetStatus } from '../backend';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  Upload,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from 'lucide-react';
import AddAssetForm from '../components/AddAssetForm';
import EditAssetForm from '../components/EditAssetForm';
import { AssetDetailModal } from '../components/AssetDetailModal';
import ImportPreviewModal from '../components/ImportPreviewModal';
import ImportSummaryModal from '../components/ImportSummaryModal';
import { BatchImportResult } from '../backend';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function statusLabel(status: AssetStatus): string {
  switch (status) {
    case AssetStatus.inField: return 'In Field';
    case AssetStatus.inRepair: return 'In Repair';
    case AssetStatus.inProgramming: return 'In Programming';
    case AssetStatus.deployed: return 'Deployed';
    case AssetStatus.scrapped: return 'Scrapped';
    default: return String(status);
  }
}

function statusVariant(status: AssetStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case AssetStatus.inField: return 'default';
    case AssetStatus.inRepair: return 'secondary';
    case AssetStatus.scrapped: return 'destructive';
    default: return 'outline';
  }
}

export default function AssetsPage() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<Asset | null>(null);
  const [viewAsset, setViewAsset] = useState<Asset | null>(null);
  const [deleteSerial, setDeleteSerial] = useState<string | null>(null);
  const [importPreviewOpen, setImportPreviewOpen] = useState(false);
  const [importSummaryOpen, setImportSummaryOpen] = useState(false);
  const [parsedSerials, setParsedSerials] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<BatchImportResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAssets();
    },
    enabled: !!actor && !actorFetching,
  });

  const deleteMutation = useMutation({
    mutationFn: async (serialNumber: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteAsset(serialNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
      toast.success('Asset deleted successfully.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete asset.'),
  });

  const importMutation = useMutation({
    mutationFn: async (serials: string[]): Promise<BatchImportResult> => {
      if (!actor) throw new Error('Actor not available');
      return actor.importAssetBatch(serials);
    },
    onSuccess: (result: BatchImportResult) => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
      setImportResult(result);
      setImportPreviewOpen(false);
      setImportSummaryOpen(true);
    },
    onError: (err: any) => toast.error(err.message || 'Import failed.'),
  });

  const filtered = assets.filter((a) => {
    const matchSearch =
      !search ||
      a.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.model.toLowerCase().includes(search.toLowerCase()) ||
      a.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async () => {
    if (!deleteSerial) return;
    await deleteMutation.mutateAsync(deleteSerial);
    setDeleteSerial(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const { parseFile } = await import('../utils/fileParser');
      const result = await parseFile(file);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setParsedSerials(result.serialNumbers);
      setImportPreviewOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse file.');
    }
  };

  const handleExportCSV = async () => {
    if (filtered.length === 0) {
      toast.error('No assets to export.');
      return;
    }
    try {
      setIsExporting(true);
      const { exportAssetsAsCSV } = await import('../utils/csvExport');
      exportAssetsAsCSV(filtered);
      toast.success(`Exported ${filtered.length} asset(s) as CSV.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to export CSV.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (filtered.length === 0) {
      toast.error('No assets to export.');
      return;
    }
    try {
      setIsExporting(true);
      const { exportAssetsAsExcel } = await import('../utils/csvExport');
      await exportAssetsAsExcel(filtered);
      toast.success(`Exported ${filtered.length} asset(s) as Excel.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to export Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Assets</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage all registered assets</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Export button — available to all authenticated users */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export
                  <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                  Export as Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2 text-blue-500" />
                  Export as CSV (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Import & Add Asset — admin only */}
            {isAdmin && (
              <>
                <label htmlFor="import-file">
                  <Button variant="outline" size="sm" asChild>
                    <span className="cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </span>
                  </Button>
                </label>
                <input
                  id="import-file"
                  type="file"
                  accept=".xlsx,.csv,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Asset
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by serial, model, or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value={AssetStatus.inField}>In Field</SelectItem>
              <SelectItem value={AssetStatus.inRepair}>In Repair</SelectItem>
              <SelectItem value={AssetStatus.inProgramming}>In Programming</SelectItem>
              <SelectItem value={AssetStatus.deployed}>Deployed</SelectItem>
              <SelectItem value={AssetStatus.scrapped}>Scrapped</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Serial Number</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      No assets found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((asset) => (
                    <TableRow key={asset.serialNumber}>
                      <TableCell className="font-mono text-sm">{asset.serialNumber}</TableCell>
                      <TableCell>{asset.model}</TableCell>
                      <TableCell>{asset.client}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(asset.status)}>
                          {statusLabel(asset.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{asset.condition}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8"
                                onClick={() => setViewAsset(asset)}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View</TooltipContent>
                          </Tooltip>
                          {isAdmin && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8"
                                    onClick={() => setEditAsset(asset)}
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="w-8 h-8 text-destructive hover:text-destructive"
                                    onClick={() => setDeleteSerial(asset.serialNumber)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Modals */}
        {isAdmin && addOpen && (
          <AddAssetForm open={addOpen} onClose={() => setAddOpen(false)} />
        )}

        {isAdmin && editAsset && (
          <EditAssetForm
            open={!!editAsset}
            onClose={() => setEditAsset(null)}
            asset={editAsset}
          />
        )}

        {viewAsset && (
          <AssetDetailModal
            open={!!viewAsset}
            onClose={() => setViewAsset(null)}
            asset={viewAsset}
          />
        )}

        <AlertDialog open={!!deleteSerial} onOpenChange={(open) => !open && setDeleteSerial(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Asset</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete asset{' '}
                <span className="font-mono font-medium">{deleteSerial}</span>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isAdmin && (
          <>
            <ImportPreviewModal
              open={importPreviewOpen}
              onClose={() => setImportPreviewOpen(false)}
              serialNumbers={parsedSerials}
              existingAssets={assets}
              onConfirm={(serials) => importMutation.mutate(serials)}
              isImporting={importMutation.isPending}
            />
            {importResult && (
              <ImportSummaryModal
                open={importSummaryOpen}
                onClose={() => {
                  setImportSummaryOpen(false);
                  setImportResult(null);
                }}
                result={importResult}
              />
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
