import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { BatchImportResult } from '../backend';

interface ImportSummaryModalProps {
  open: boolean;
  onClose: () => void;
  result: BatchImportResult;
}

export default function ImportSummaryModal({
  open,
  onClose,
  result,
}: ImportSummaryModalProps) {
  const imported = Number(result.importedCount);
  const existing = Number(result.existingCount);
  const errors = Number(result.errorCount);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Import Complete</DialogTitle>
          <DialogDescription>
            Here's a summary of the batch import results.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Successfully imported */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <div>
              <p className="text-sm font-semibold text-success">
                {imported} serial number{imported !== 1 ? 's' : ''} imported
              </p>
              <p className="text-xs text-success/80">Successfully added to the system</p>
            </div>
          </div>

          {/* Skipped duplicates */}
          {existing > 0 && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
              <div>
                <p className="text-sm font-semibold text-warning">
                  {existing} duplicate{existing !== 1 ? 's' : ''} skipped
                </p>
                <p className="text-xs text-warning/80">Already exist in the system</p>
              </div>
            </div>
          )}

          {/* Errors */}
          {errors > 0 && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  {errors} error{errors !== 1 ? 's' : ''}
                </p>
                {result.errors.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {result.errors.slice(0, 5).map((e, i) => (
                      <li key={i} className="text-xs text-destructive/80">{e}</li>
                    ))}
                    {result.errors.length > 5 && (
                      <li className="text-xs text-destructive/80">...and {result.errors.length - 5} more</li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
