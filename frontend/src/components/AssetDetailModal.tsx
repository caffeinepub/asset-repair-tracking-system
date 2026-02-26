import React from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Asset } from '../backend';
import StatusBadge from './StatusBadge';
import { useGetRepairsBySerial } from '../hooks/useQueries';
import { formatTimestamp } from '../utils/formatters';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssetDetailModalProps {
  open: boolean;
  onClose: () => void;
  asset: Asset | null;
}

export function AssetDetailModal({ open, onClose, asset }: AssetDetailModalProps) {
  const { data: repairs, isLoading } = useGetRepairsBySerial(asset?.serialNumber || '');

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            Asset Detail —
            <span className="font-mono text-xs text-primary">{asset.serialNumber}</span>
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 overflow-auto">
          <div className="space-y-5 pr-2">
            {/* Asset Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Model', value: asset.model },
                { label: 'Client', value: asset.client },
                { label: 'Condition', value: asset.condition },
                { label: 'Status', value: <StatusBadge status={asset.status} /> },
                { label: 'Registered', value: formatTimestamp(asset.dateFirstRegistered) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted rounded-md p-3">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <div className="text-sm font-medium text-foreground">{value}</div>
                </div>
              ))}
            </div>

            {/* Repair History */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Repair History</h3>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : !repairs || repairs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 bg-muted/30 rounded">
                  No repair history for this asset
                </p>
              ) : (
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-xs">Ticket ID</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Technician</TableHead>
                        <TableHead className="text-xs">Fault</TableHead>
                        <TableHead className="text-xs">Outcome</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {repairs.map(repair => (
                        <TableRow key={repair.ticketId} className="border-border">
                          <TableCell className="font-mono text-xs text-primary">{repair.ticketId}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{formatTimestamp(repair.dateReceived)}</TableCell>
                          <TableCell className="text-sm">{repair.technicianName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{repair.faultDescription}</TableCell>
                          <TableCell><StatusBadge outcome={repair.outcome} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default AssetDetailModal;
