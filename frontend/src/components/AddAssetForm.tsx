import { useState } from 'react';
import { useAddAsset, useGetClients } from '../hooks/useQueries';
import { AssetStatus } from '../backend';
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

export default function AddAssetForm({ open, onClose }: Props) {
  const addAsset = useAddAsset();
  const { data: clients = [], isLoading: clientsLoading } = useGetClients();

  const [form, setForm] = useState({
    serialNumber: '',
    model: '',
    client: '',
    status: AssetStatus.inRepair as AssetStatus,
    condition: '',
  });

  const handleSubmit = async () => {
    if (!form.serialNumber.trim() || !form.model.trim()) return;
    await addAsset.mutateAsync({
      serialNumber: form.serialNumber.trim(),
      model: form.model.trim(),
      client: form.client,
      status: form.status,
      condition: form.condition.trim(),
      dateFirstRegistered: BigInt(Date.now()) * 1_000_000n,
    });
    onClose();
  };

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Register New Asset</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Serial Number *</label>
            <Input
              value={form.serialNumber}
              onChange={e => set('serialNumber', e.target.value)}
              placeholder="e.g. SN-001234"
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Model *</label>
            <Input
              value={form.model}
              onChange={e => set('model', e.target.value)}
              placeholder="e.g. Verifone P400"
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Client</label>
            <select
              value={form.client}
              onChange={e => set('client', e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={clientsLoading}
            >
              <option value="">{clientsLoading ? 'Loading clients...' : 'Select client'}</option>
              {clients.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value={AssetStatus.inRepair}>In Repair</option>
              <option value={AssetStatus.inField}>In Field</option>
              <option value={AssetStatus.inProgramming}>In Programming</option>
              <option value={AssetStatus.deployed}>Deployed</option>
              <option value={AssetStatus.scrapped}>Scrapped</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Condition</label>
            <Input
              value={form.condition}
              onChange={e => set('condition', e.target.value)}
              placeholder="e.g. Good, Fair, Poor"
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={addAsset.isPending || !form.serialNumber.trim() || !form.model.trim()}
          >
            {addAsset.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Register Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
