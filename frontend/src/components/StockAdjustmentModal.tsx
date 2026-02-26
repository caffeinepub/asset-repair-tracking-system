import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdatePartStock } from '../hooks/useQueries';
import { Part } from '../backend';
import { Loader2, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

interface StockAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  part: Part | null;
}

export function StockAdjustmentModal({ open, onClose, part }: StockAdjustmentModalProps) {
  const [delta, setDelta] = useState('1');
  const [operation, setOperation] = useState<'add' | 'remove'>('add');
  const updateStock = useUpdatePartStock();

  if (!part) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(delta) || 0;
    if (amount <= 0) return;
    const actualDelta = operation === 'add' ? BigInt(amount) : BigInt(-amount);
    try {
      await updateStock.mutateAsync({ partNumber: part.partNumber, delta: actualDelta });
      toast.success(`Stock ${operation === 'add' ? 'increased' : 'decreased'} by ${amount}`);
      setDelta('1');
      onClose();
    } catch {
      toast.error('Failed to update stock — quantity cannot go below zero');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-foreground">Adjust Stock</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 mb-4">
          <p className="text-sm font-medium text-foreground">{part.partName}</p>
          <p className="font-mono text-xs text-primary">{part.partNumber}</p>
          <p className="text-sm text-muted-foreground">Current stock: <span className="text-foreground font-semibold">{Number(part.quantityInStock)}</span></p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <Button type="button" variant={operation === 'add' ? 'default' : 'outline'} size="sm"
              onClick={() => setOperation('add')} className="flex-1 gap-1">
              <Plus className="w-3.5 h-3.5" /> Add
            </Button>
            <Button type="button" variant={operation === 'remove' ? 'destructive' : 'outline'} size="sm"
              onClick={() => setOperation('remove')} className="flex-1 gap-1">
              <Minus className="w-3.5 h-3.5" /> Remove
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm text-foreground">Quantity</Label>
            <Input type="number" min={1} value={delta} onChange={e => setDelta(e.target.value)}
              className="bg-muted border-border" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={updateStock.isPending || !delta || parseInt(delta) <= 0}>
              {updateStock.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</> : 'Update Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default StockAdjustmentModal;
