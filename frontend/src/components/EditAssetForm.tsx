import { useState } from 'react';
import { useUpdateAsset, useGetClients } from '../hooks/useQueries';
import { Asset, AssetStatus } from '../backend';
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
  asset: Asset;
  open: boolean;
  onClose: () => void;
}

export default function EditAssetForm({ asset, open, onClose }: Props) {
  const updateAsset = useUpdateAsset();
  const { data: clients = [], isLoading: clientsLoading } = useGetClients();

  const [form, setForm] = useState({
    model: asset.model,
    client: asset.client,
    status: asset.status,
    condition: asset.condition,
  });

  const handleSubmit = async () => {
    await updateAsset.mutateAsync({
      serialNumber: asset.serialNumber,
      asset: {
        serialNumber: asset.serialNumber,
        model: form.model,
        client: form.client,
        status: form.status,
        condition: form.condition,
        dateFirstRegistered: asset.dateFirstRegistered,
      },
    });
    onClose();
  };

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Asset — {asset.serialNumber}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Model</label>
            <Input
              value={form.model}
              onChange={e => set('model', e.target.value)}
              className="bg-background border-input text-foreground"
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
              className="bg-background border-input text-foreground"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={updateAsset.isPending}>
            {updateAsset.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
