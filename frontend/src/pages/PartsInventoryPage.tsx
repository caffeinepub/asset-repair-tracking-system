import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { Part } from '../backend';
import { useAuth } from '../contexts/AuthContext';
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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Plus, Search, AlertTriangle, Loader2 } from 'lucide-react';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function PartsInventoryPage() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [addPartOpen, setAddPartOpen] = useState(false);
  const [adjustPart, setAdjustPart] = useState<Part | null>(null);
  const [newPart, setNewPart] = useState({
    partNumber: '',
    partName: '',
    compatibleModel: '',
    quantityInStock: '',
    lowStockThreshold: '',
  });
  const [partError, setPartError] = useState('');

  const { data: parts = [], isLoading } = useQuery<Part[]>({
    queryKey: ['parts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listParts();
    },
    enabled: !!actor && !actorFetching,
  });

  const { data: lowStockParts = [] } = useQuery<Part[]>({
    queryKey: ['lowStockParts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLowStockParts();
    },
    enabled: !!actor && !actorFetching,
  });

  const addPartMutation = useMutation({
    mutationFn: async (part: Part) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addPart(part);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockParts'] });
      toast.success('Part added successfully.');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add part.'),
  });

  const filtered = parts.filter((p) => {
    return (
      !search ||
      p.partNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.partName.toLowerCase().includes(search.toLowerCase()) ||
      p.compatibleModel.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPart.partNumber.trim() || !newPart.partName.trim()) {
      setPartError('Part number and name are required.');
      return;
    }
    setPartError('');
    const qty = parseInt(newPart.quantityInStock) || 0;
    const threshold = parseInt(newPart.lowStockThreshold) || 0;
    await addPartMutation.mutateAsync({
      partNumber: newPart.partNumber.trim(),
      partName: newPart.partName.trim(),
      compatibleModel: newPart.compatibleModel.trim(),
      quantityInStock: BigInt(qty),
      lowStockThreshold: BigInt(threshold),
    });
    setNewPart({ partNumber: '', partName: '', compatibleModel: '', quantityInStock: '', lowStockThreshold: '' });
    setAddPartOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parts Inventory</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage spare parts and stock levels</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setAddPartOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Part
          </Button>
        )}
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Low Stock Alert</AlertTitle>
          <AlertDescription>
            {lowStockParts.length} part{lowStockParts.length > 1 ? 's are' : ' is'} below the low stock threshold:{' '}
            {lowStockParts.map((p) => p.partName).join(', ')}.
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search parts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
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
                <TableHead>Part Number</TableHead>
                <TableHead>Part Name</TableHead>
                <TableHead>Compatible Model</TableHead>
                <TableHead>In Stock</TableHead>
                <TableHead>Threshold</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-muted-foreground py-12">
                    No parts found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((part) => {
                  const isLow = part.quantityInStock <= part.lowStockThreshold;
                  return (
                    <TableRow key={part.partNumber}>
                      <TableCell className="font-mono text-sm">{part.partNumber}</TableCell>
                      <TableCell>{part.partName}</TableCell>
                      <TableCell>{part.compatibleModel}</TableCell>
                      <TableCell>
                        <Badge variant={isLow ? 'destructive' : 'default'}>
                          {String(part.quantityInStock)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{String(part.lowStockThreshold)}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAdjustPart(part)}
                          >
                            Adjust Stock
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Part Dialog */}
      {isAdmin && (
        <Dialog open={addPartOpen} onOpenChange={(open) => { if (!open) { setPartError(''); } setAddPartOpen(open); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Part</DialogTitle>
              <DialogDescription>Register a new spare part in the inventory.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPart} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="part-number">Part Number</Label>
                <Input
                  id="part-number"
                  value={newPart.partNumber}
                  onChange={(e) => setNewPart({ ...newPart, partNumber: e.target.value })}
                  placeholder="e.g. P-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="part-name">Part Name</Label>
                <Input
                  id="part-name"
                  value={newPart.partName}
                  onChange={(e) => setNewPart({ ...newPart, partName: e.target.value })}
                  placeholder="e.g. Display Screen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compatible-model">Compatible Model</Label>
                <Input
                  id="compatible-model"
                  value={newPart.compatibleModel}
                  onChange={(e) => setNewPart({ ...newPart, compatibleModel: e.target.value })}
                  placeholder="e.g. VX680"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="qty-in-stock">Qty in Stock</Label>
                  <Input
                    id="qty-in-stock"
                    type="number"
                    min="0"
                    value={newPart.quantityInStock}
                    onChange={(e) => setNewPart({ ...newPart, quantityInStock: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="low-stock-threshold">Low Stock Threshold</Label>
                  <Input
                    id="low-stock-threshold"
                    type="number"
                    min="0"
                    value={newPart.lowStockThreshold}
                    onChange={(e) => setNewPart({ ...newPart, lowStockThreshold: e.target.value })}
                    placeholder="5"
                  />
                </div>
              </div>
              {partError && <p className="text-destructive text-xs">{partError}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddPartOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addPartMutation.isPending}>
                  {addPartMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : 'Add Part'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Stock Adjustment Modal — uses onClose prop */}
      {adjustPart && (
        <StockAdjustmentModal
          open={!!adjustPart}
          onClose={() => setAdjustPart(null)}
          part={adjustPart}
        />
      )}
    </div>
  );
}
