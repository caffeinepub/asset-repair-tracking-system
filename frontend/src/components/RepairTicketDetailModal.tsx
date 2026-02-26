import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useUpdateRepairTicket, useListParts } from '../hooks/useQueries';
import { RepairTicket, RepairOutcome, PartReplaced } from '../backend';
import StatusBadge from './StatusBadge';
import { PartsReplacedEditor } from './PartsReplacedEditor';
import { formatTimestamp, repairOutcomeLabel } from '../utils/formatters';
import { Pencil, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RepairTicketDetailModalProps {
  open: boolean;
  onClose: () => void;
  ticket: RepairTicket | null;
  canEdit?: boolean;
}

export function RepairTicketDetailModal({ open, onClose, ticket, canEdit = false }: RepairTicketDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [diagnosis, setDiagnosis] = useState('');
  const [outcome, setOutcome] = useState<RepairOutcome>(RepairOutcome.pending);
  const [partsReplaced, setPartsReplaced] = useState<PartReplaced[]>([]);
  const { data: availableParts = [] } = useListParts();
  const updateTicket = useUpdateRepairTicket();

  useEffect(() => {
    if (ticket) {
      setDiagnosis(ticket.diagnosis);
      setOutcome(ticket.outcome);
      setPartsReplaced(ticket.partsReplaced);
      setEditing(false);
    }
  }, [ticket]);

  if (!ticket) return null;

  const handleSave = async () => {
    try {
      await updateTicket.mutateAsync({
        ticketId: ticket.ticketId,
        ticket: { ...ticket, diagnosis, outcome, partsReplaced },
      });
      toast.success('Ticket updated');
      setEditing(false);
    } catch {
      toast.error('Failed to update ticket');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-foreground flex items-center gap-2">
              Ticket — <span className="font-mono text-xs text-primary">{ticket.ticketId}</span>
            </DialogTitle>
            {canEdit && !editing && (
              <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-1.5 text-xs">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </Button>
            )}
          </div>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-2">
            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Serial Number', value: <span className="font-mono text-xs text-primary">{ticket.serialNumber}</span> },
                { label: 'Technician', value: ticket.technicianName },
                { label: 'Date Received', value: formatTimestamp(ticket.dateReceived) },
                { label: 'Time Received', value: ticket.timeReceived },
                { label: 'Repair Start', value: formatTimestamp(ticket.repairStartDate) },
                { label: 'Repair Complete', value: ticket.repairCompletionDate ? formatTimestamp(ticket.repairCompletionDate) : '—' },
                { label: 'Sent to Programming', value: ticket.sentToProgrammingDate ? formatTimestamp(ticket.sentToProgrammingDate) : '—' },
                { label: 'Deployed to Field', value: ticket.dateDeployedToField ? formatTimestamp(ticket.dateDeployedToField) : '—' },
                { label: 'Outcome', value: <StatusBadge outcome={ticket.outcome} /> },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted rounded-md p-2.5">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <div className="text-sm font-medium text-foreground">{value}</div>
                </div>
              ))}
            </div>

            {/* Fault Description */}
            <div className="bg-muted rounded-md p-3">
              <p className="text-xs text-muted-foreground mb-1">Fault Description</p>
              <p className="text-sm text-foreground">{ticket.faultDescription}</p>
            </div>

            {/* Diagnosis */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Diagnosis</Label>
              {editing ? (
                <Textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
                  className="bg-muted border-border resize-none" rows={2} />
              ) : (
                <div className="bg-muted rounded-md p-3">
                  <p className="text-sm text-foreground">{ticket.diagnosis || '—'}</p>
                </div>
              )}
            </div>

            {/* Outcome */}
            {editing && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Outcome</Label>
                <Select value={outcome} onValueChange={v => setOutcome(v as RepairOutcome)}>
                  <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {Object.values(RepairOutcome).map(o => <SelectItem key={o} value={o}>{repairOutcomeLabel(o)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Parts Replaced */}
            {editing ? (
              <PartsReplacedEditor parts={partsReplaced} onChange={setPartsReplaced} availableParts={availableParts} />
            ) : (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Parts Replaced</p>
                {ticket.partsReplaced.length > 0 ? (
                  <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="text-xs">Part Number</TableHead>
                          <TableHead className="text-xs">Part Name</TableHead>
                          <TableHead className="text-xs text-right">Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ticket.partsReplaced.map((p, i) => (
                          <TableRow key={i} className="border-border">
                            <TableCell className="font-mono text-xs text-primary">{p.partNumber}</TableCell>
                            <TableCell className="text-sm">{p.partName}</TableCell>
                            <TableCell className="text-sm text-right">{Number(p.qty)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2 text-center bg-muted/30 rounded">No parts replaced</p>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
        {editing && (
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateTicket.isPending}>
              {updateTicket.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default RepairTicketDetailModal;
