import React, { useState } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StockAdjustmentModal } from '@/components/StockAdjustmentModal';
import { useListParts, useGetLowStockParts, useAddPart } from '@/hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Part } from '@/backend';

const MODELS = ['VX680', 'VX820', 'M400', 'Carbon 10', 'Carbon 8'];

function AddPartDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addPart = useAddPart();
  const [form, setForm] = useState({
    partNumber: '',
    partName: '',
    compatibleModel: '',
    quantityInStock: 0,
    lowStockThreshold: 5,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addPart.mutateAsync({
      partNumber: form.partNumber,
      partName: form.partName,
      compatibleModel: form.compatibleModel,
      quantityInStock: BigInt(form.quantityInStock),
      lowStockThreshold: BigInt(form.lowStockThreshold),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Add New Part</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-foreground">Part Number</Label>
            <Input
              value={form.partNumber}
              onChange={(e) => setForm({ ...form, partNumber: e.target.value })}
              required
              className="bg-background text-foreground border-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground">Part Name</Label>
            <Input
              value={form.partName}
              onChange={(e) => setForm({ ...form, partName: e.target.value })}
              required
              className="bg-background text-foreground border-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground">Compatible Model</Label>
            <Select
              value={form.compatibleModel}
              onValueChange={(v) => setForm({ ...form, compatibleModel: v })}
            >
              <SelectTrigger className="bg-background text-foreground border-input">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                {MODELS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-foreground">Qty in Stock</Label>
              <Input
                type="number"
                min={0}
                value={form.quantityInStock}
                onChange={(e) => setForm({ ...form, quantityInStock: Number(e.target.value) })}
                className="bg-background text-foreground border-input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-foreground">Low Stock Threshold</Label>
              <Input
                type="number"
                min={0}
                value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })}
                className="bg-background text-foreground border-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border text-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={addPart.isPending}>
              {addPart.isPending ? 'Adding...' : 'Add Part'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function PartsInventoryPage() {
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [adjustingPart, setAdjustingPart] = useState<Part | null>(null);

  const { data: parts, isLoading } = useListParts();
  const { data: lowStockParts } = useGetLowStockParts();

  const filtered = (parts ?? []).filter((part) => {
    return (
      !search ||
      part.partNumber.toLowerCase().includes(search.toLowerCase()) ||
      part.partName.toLowerCase().includes(search.toLowerCase()) ||
      part.compatibleModel.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Parts Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage spare parts and stock levels</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Part
        </Button>
      </div>

      {/* Low stock alert */}
      {lowStockParts && lowStockParts.length > 0 && (
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-destructive font-semibold">Low Stock Alert</AlertTitle>
          <AlertDescription className="text-destructive/90">
            {lowStockParts.length} part{lowStockParts.length !== 1 ? 's are' : ' is'} below the low stock threshold:{' '}
            {lowStockParts.map((p) => p.partName).join(', ')}.
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by part number, name, or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background text-foreground placeholder:text-muted-foreground border-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-card-foreground">
            {isLoading ? 'Loading...' : `${filtered.length} Part${filtered.length !== 1 ? 's' : ''}`}
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
            <p className="text-sm text-muted-foreground p-6 text-center">No parts found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Part Number</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Part Name</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Compatible Model</TableHead>
                  <TableHead className="text-muted-foreground font-medium">In Stock</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Low Stock Threshold</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((part) => {
                  const isLow = part.quantityInStock <= part.lowStockThreshold;
                  return (
                    <TableRow key={part.partNumber} className="border-border hover:bg-muted/50">
                      <TableCell className="font-mono text-sm text-foreground">{part.partNumber}</TableCell>
                      <TableCell className="text-sm text-foreground">{part.partName}</TableCell>
                      <TableCell className="text-sm text-foreground">{part.compatibleModel}</TableCell>
                      <TableCell>
                        <span className={`text-sm font-medium ${isLow ? 'text-destructive' : 'text-foreground'}`}>
                          {Number(part.quantityInStock)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{Number(part.lowStockThreshold)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAdjustingPart(part)}
                          className="text-xs border-border text-foreground hover:bg-accent"
                        >
                          Adjust Stock
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showAddDialog && (
        <AddPartDialog open={showAddDialog} onClose={() => setShowAddDialog(false)} />
      )}
      {adjustingPart && (
        <StockAdjustmentModal
          part={adjustingPart}
          open={!!adjustingPart}
          onClose={() => setAdjustingPart(null)}
        />
      )}
    </div>
  );
}
