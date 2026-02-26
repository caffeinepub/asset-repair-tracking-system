import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Asset } from '../backend';

interface ImportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (newSerials: string[]) => void;
  serialNumbers: string[];
  existingAssets: Asset[];
  isImporting: boolean;
}

export default function ImportPreviewModal({
  open,
  onClose,
  onConfirm,
  serialNumbers,
  existingAssets,
  isImporting,
}: ImportPreviewModalProps) {
  const existingSet = useMemo(() => {
    return new Set(existingAssets.map(a => a.serialNumber));
  }, [existingAssets]);

  const { newSerials, duplicateSerials } = useMemo(() => {
    const newSerials: string[] = [];
    const duplicateSerials: string[] = [];
    for (const sn of serialNumbers) {
      if (existingSet.has(sn)) {
        duplicateSerials.push(sn);
      } else {
        newSerials.push(sn);
      }
    }
    return { newSerials, duplicateSerials };
  }, [serialNumbers, existingSet]);

  const handleConfirm = () => {
    onConfirm(newSerials);
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v && !isImporting) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Preview</DialogTitle>
          <DialogDescription>
            Review the serial numbers before importing. Duplicates will be skipped.
          </DialogDescription>
        </DialogHeader>

        {/* Summary bar */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-success/10 text-success text-sm font-medium">
            <CheckCircle2 className="h-4 w-4" />
            {newSerials.length} new
          </div>
          {duplicateSerials.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-warning/10 text-warning text-sm font-medium">
              <AlertTriangle className="h-4 w-4" />
              {duplicateSerials.length} duplicate{duplicateSerials.length !== 1 ? 's' : ''} (will be skipped)
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-muted-foreground text-sm">
            {serialNumbers.length} total
          </div>
        </div>

        {/* Serial number list */}
        <ScrollArea className="h-64 rounded-md border border-border">
          <div className="p-2 space-y-1">
            {serialNumbers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No serial numbers found in file.</p>
            ) : (
              serialNumbers.map((sn, idx) => {
                const isDuplicate = existingSet.has(sn);
                return (
                  <div
                    key={`${sn}-${idx}`}
                    className={`flex items-center justify-between px-3 py-1.5 rounded text-sm font-mono ${
                      isDuplicate
                        ? 'bg-warning/10 border border-warning/30 text-warning'
                        : 'bg-muted/40 text-foreground'
                    }`}
                  >
                    <span>{sn}</span>
                    {isDuplicate && (
                      <span className="flex items-center gap-1 text-xs font-sans font-medium text-warning ml-2 shrink-0">
                        <AlertTriangle className="h-3 w-3" />
                        Duplicate
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {duplicateSerials.length > 0 && (
          <p className="text-xs text-warning flex items-start gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {duplicateSerials.length} serial number{duplicateSerials.length !== 1 ? 's' : ''} already exist in the system and will be skipped during import.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isImporting || newSerials.length === 0}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Importing...
              </>
            ) : (
              `Import ${newSerials.length} Serial${newSerials.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
