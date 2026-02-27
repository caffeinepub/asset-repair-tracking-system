import React, { useState, useRef } from 'react';
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
import { Plus, Search, AlertTriangle, Loader2, Package, Upload, X, ImageOff, Pencil } from 'lucide-react';
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

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function uint8ArrayToDataUrl(bytes: Uint8Array): string {
  // Detect image type from magic bytes
  let mimeType = 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50) mimeType = 'image/png';
  else if (bytes[0] === 0x52 && bytes[1] === 0x49) mimeType = 'image/webp';

  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

// ── Part Thumbnail ────────────────────────────────────────────────────────────

function PartThumbnail({ image }: { image?: Uint8Array }) {
  if (image && image.length > 0) {
    const src = uint8ArrayToDataUrl(image);
    return (
      <img
        src={src}
        alt="Part"
        className="w-12 h-12 object-cover rounded-md border border-border shrink-0"
      />
    );
  }
  return (
    <div className="w-12 h-12 rounded-md border border-border bg-muted flex items-center justify-center shrink-0">
      <Package className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

// ── Image Upload Field ────────────────────────────────────────────────────────

interface ImageUploadFieldProps {
  currentImage?: Uint8Array;
  onImageChange: (bytes: Uint8Array | null) => void;
}

function ImageUploadField({ currentImage, onImageChange }: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [imageError, setImageError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setRemoved(false);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const bytes = await fileToUint8Array(file);
    onImageChange(bytes);
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setRemoved(true);
    setImageError('');
    onImageChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Determine what to show
  const showExisting = !removed && !previewUrl && currentImage && currentImage.length > 0;
  const showPreview = !!previewUrl;
  const showPlaceholder = !showExisting && !showPreview;

  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">Part Image (optional)</label>
      <div className="flex items-start gap-3">
        {(showExisting || showPreview) && (
          <div className="relative inline-block">
            <img
              src={showPreview ? previewUrl! : uint8ArrayToDataUrl(currentImage!)}
              alt="Part preview"
              className="w-20 h-20 object-cover rounded-lg border border-border"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center hover:opacity-90 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        {showPlaceholder && (
          <div className="w-20 h-20 rounded-lg border border-dashed border-border bg-muted flex items-center justify-center">
            <ImageOff className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex flex-col gap-2 justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            {showExisting || showPreview ? 'Replace image' : 'Upload image'}
          </button>
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP · max 2MB</p>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      {imageError && <p className="text-destructive text-xs mt-1">{imageError}</p>}
    </div>
  );
}

// ── Edit Part Dialog ──────────────────────────────────────────────────────────

interface EditPartDialogProps {
  part: Part;
  open: boolean;
  onClose: () => void;
}

function EditPartDialog({ part, open, onClose }: EditPartDialogProps) {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    partName: part.partName,
    compatibleModel: part.compatibleModel,
    quantityInStock: String(part.quantityInStock),
    lowStockThreshold: String(part.lowStockThreshold),
  });
  // null = remove image, undefined = keep existing, Uint8Array = new image
  const [newImage, setNewImage] = useState<Uint8Array | null | undefined>(undefined);

  const updateMutation = useMutation({
    mutationFn: async (updatedPart: Part) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addPart(updatedPart);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockParts'] });
      toast.success('Part updated successfully.');
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update part.'),
  });

  const handleImageChange = (bytes: Uint8Array | null) => {
    setNewImage(bytes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Determine final image value
    let finalImage: Uint8Array | undefined;
    if (newImage === null) {
      finalImage = undefined; // remove image
    } else if (newImage instanceof Uint8Array) {
      finalImage = newImage; // new image
    } else {
      finalImage = part.image; // keep existing
    }

    await updateMutation.mutateAsync({
      partNumber: part.partNumber,
      partName: form.partName.trim(),
      compatibleModel: form.compatibleModel.trim(),
      quantityInStock: BigInt(parseInt(form.quantityInStock) || 0),
      lowStockThreshold: BigInt(parseInt(form.lowStockThreshold) || 0),
      image: finalImage,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Part</DialogTitle>
          <DialogDescription>Update part details and image for {part.partNumber}.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Part Number</Label>
            <Input value={part.partNumber} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-part-name">Part Name</Label>
            <Input
              id="edit-part-name"
              value={form.partName}
              onChange={(e) => setForm({ ...form, partName: e.target.value })}
              placeholder="e.g. Display Screen"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-compatible-model">Compatible Model</Label>
            <Input
              id="edit-compatible-model"
              value={form.compatibleModel}
              onChange={(e) => setForm({ ...form, compatibleModel: e.target.value })}
              placeholder="e.g. VX680"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-qty">Qty in Stock</Label>
              <Input
                id="edit-qty"
                type="number"
                min="0"
                value={form.quantityInStock}
                onChange={(e) => setForm({ ...form, quantityInStock: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-threshold">Low Stock Threshold</Label>
              <Input
                id="edit-threshold"
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })}
              />
            </div>
          </div>

          <ImageUploadField
            currentImage={part.image}
            onImageChange={handleImageChange}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
              ) : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PartsInventoryPage() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [addPartOpen, setAddPartOpen] = useState(false);
  const [adjustPart, setAdjustPart] = useState<Part | null>(null);
  const [editPart, setEditPart] = useState<Part | null>(null);

  const [newPart, setNewPart] = useState({
    partNumber: '',
    partName: '',
    compatibleModel: '',
    quantityInStock: '',
    lowStockThreshold: '',
  });
  const [newPartImage, setNewPartImage] = useState<Uint8Array | null>(null);
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
      image: newPartImage ?? undefined,
    });
    setNewPart({ partNumber: '', partName: '', compatibleModel: '', quantityInStock: '', lowStockThreshold: '' });
    setNewPartImage(null);
    setAddPartOpen(false);
  };

  const colSpan = isAdmin ? 7 : 5;

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
                <TableHead className="w-16">Image</TableHead>
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
                  <TableCell colSpan={colSpan} className="text-center text-muted-foreground py-12">
                    No parts found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((part) => {
                  const isLow = part.quantityInStock <= part.lowStockThreshold;
                  return (
                    <TableRow key={part.partNumber}>
                      <TableCell>
                        <PartThumbnail image={part.image} />
                      </TableCell>
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
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditPart(part)}
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAdjustPart(part)}
                            >
                              Adjust Stock
                            </Button>
                          </div>
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
        <Dialog open={addPartOpen} onOpenChange={(open) => { if (!open) { setPartError(''); setNewPartImage(null); } setAddPartOpen(open); }}>
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

              <ImageUploadField
                onImageChange={(bytes) => setNewPartImage(bytes)}
              />

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

      {/* Edit Part Dialog */}
      {editPart && (
        <EditPartDialog
          part={editPart}
          open={!!editPart}
          onClose={() => setEditPart(null)}
        />
      )}

      {/* Stock Adjustment Modal */}
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
