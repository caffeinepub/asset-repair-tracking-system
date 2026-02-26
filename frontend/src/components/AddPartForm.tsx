import { useState } from 'react';
import { useAddPart } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddPartForm({ open, onClose }: Props) {
  const addPart = useAddPart();
  const [form, setForm] = useState({
    partNumber: '',
    partName: '',
    compatibleModel: '',
    quantityInStock: '',
    lowStockThreshold: '',
  });

  const handleSubmit = async () => {
    if (!form.partNumber.trim() || !form.partName.trim()) return;
    await addPart.mutateAsync({
      partNumber: form.partNumber.trim(),
      partName: form.partName.trim(),
      compatibleModel: form.compatibleModel.trim(),
      quantityInStock: BigInt(parseInt(form.quantityInStock) || 0),
      lowStockThreshold: BigInt(parseInt(form.lowStockThreshold) || 5),
    });
    onClose();
  };

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Add Part</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Part Number *</label>
            <Input
              value={form.partNumber}
              onChange={e => set('partNumber', e.target.value)}
              placeholder="e.g. P-001"
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Part Name *</label>
            <Input
              value={form.partName}
              onChange={e => set('partName', e.target.value)}
              placeholder="e.g. Power Supply Unit"
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Compatible Model</label>
            <Input
              value={form.compatibleModel}
              onChange={e => set('compatibleModel', e.target.value)}
              placeholder="e.g. Verifone P400"
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Qty in Stock</label>
              <Input
                type="number"
                min="0"
                value={form.quantityInStock}
                onChange={e => set('quantityInStock', e.target.value)}
                placeholder="0"
                className="bg-background border-input text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Low Stock Threshold</label>
              <Input
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={e => set('lowStockThreshold', e.target.value)}
                placeholder="5"
                className="bg-background border-input text-foreground"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={addPart.isPending || !form.partNumber.trim() || !form.partName.trim()}
          >
            {addPart.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Add Part
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
