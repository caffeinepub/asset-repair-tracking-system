import { useState, useRef } from 'react';
import { useAddPart } from '../hooks/useQueries';
import { Loader2, Upload, X, ImageOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface Props {
  open: boolean;
  onClose: () => void;
}

function fileToUint8Array(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      resolve(new Uint8Array(arrayBuffer));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export default function AddPartForm({ open, onClose }: Props) {
  const addPart = useAddPart();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    partNumber: '',
    partName: '',
    compatibleModel: '',
    quantityInStock: '',
    lowStockThreshold: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setImageError('Only JPEG, PNG, and WebP images are accepted.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Image must be 2MB or smaller.');
      return;
    }

    setImageError('');
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleRemoveImage();
    setForm({ partNumber: '', partName: '', compatibleModel: '', quantityInStock: '', lowStockThreshold: '' });
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.partNumber.trim() || !form.partName.trim()) return;

    let imageBytes: Uint8Array | undefined;
    if (imageFile) {
      imageBytes = await fileToUint8Array(imageFile);
    }

    await addPart.mutateAsync({
      partNumber: form.partNumber.trim(),
      partName: form.partName.trim(),
      compatibleModel: form.compatibleModel.trim(),
      quantityInStock: BigInt(parseInt(form.quantityInStock) || 0),
      lowStockThreshold: BigInt(parseInt(form.lowStockThreshold) || 5),
      image: imageBytes,
    });
    handleClose();
  };

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <Dialog open={open} onOpenChange={open => !open && handleClose()}>
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

          {/* Image Upload */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Part Image (optional)</label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Part preview"
                  className="w-24 h-24 object-cover rounded-lg border border-border"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors w-full justify-center"
              >
                <Upload className="w-4 h-4" />
                Upload image (JPEG, PNG, WebP · max 2MB)
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
            {imageError && <p className="text-destructive text-xs mt-1">{imageError}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={addPart.isPending || !form.partNumber.trim() || !form.partName.trim()}
          >
            {addPart.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            {addPart.isPending ? 'Adding...' : 'Add Part'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
