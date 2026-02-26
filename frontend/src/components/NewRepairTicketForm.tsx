import React, { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCreateRepairTicket, useListAssets, useListParts } from '../hooks/useQueries';
import { RepairOutcome, PartReplaced } from '../backend';
import { repairOutcomeLabel } from '../utils/formatters';
import { PartsReplacedEditor } from './PartsReplacedEditor';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface NewRepairTicketFormProps {
  open: boolean;
  onClose: () => void;
}

export function NewRepairTicketForm({ open, onClose }: NewRepairTicketFormProps) {
  const { data: assets = [] } = useListAssets();
  const { data: availableParts = [] } = useListParts();
  const createTicket = useCreateRepairTicket();

  const [serialNumber, setSerialNumber] = useState('');
  const [timeReceived, setTimeReceived] = useState('09:00');
  const [faultDescription, setFaultDescription] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [outcome, setOutcome] = useState<RepairOutcome>(RepairOutcome.pending);
  const [partsReplaced, setPartsReplaced] = useState<PartReplaced[]>([]);

  const generateTicketId = () => {
    return `TKT-${Date.now().toString(36).toUpperCase()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber || !faultDescription || !technicianName) return;
    const now = BigInt(Date.now()) * BigInt(1_000_000);
    try {
      await createTicket.mutateAsync({
        ticketId: generateTicketId(),
        serialNumber,
        dateReceived: now,
        timeReceived,
        currentStage: 'Received',
        faultDescription,
        diagnosis,
        partsReplaced,
        technicianName,
        repairStartDate: now,
        repairCompletionDate: undefined,
        sentToProgrammingDate: undefined,
        dateDeployedToField: undefined,
        outcome,
      });
      toast.success('Repair ticket created');
      setSerialNumber(''); setFaultDescription(''); setDiagnosis('');
      setTechnicianName(''); setPartsReplaced([]); setOutcome(RepairOutcome.pending);
      onClose();
    } catch {
      toast.error('Failed to create repair ticket');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground">New Repair Ticket</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1">
          <form id="new-ticket-form" onSubmit={handleSubmit} className="space-y-4 pr-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-sm text-foreground">Asset Serial Number</Label>
                <Select value={serialNumber} onValueChange={setSerialNumber} required>
                  <SelectTrigger className="bg-muted border-border font-mono">
                    <SelectValue placeholder="Select asset" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {assets.map(a => (
                      <SelectItem key={a.serialNumber} value={a.serialNumber}>
                        <span className="font-mono text-xs">{a.serialNumber}</span> — {a.model} ({a.client})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Technician</Label>
                <Input value={technicianName} onChange={e => setTechnicianName(e.target.value)}
                  placeholder="Technician name" className="bg-muted border-border" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Time Received</Label>
                <Input type="time" value={timeReceived} onChange={e => setTimeReceived(e.target.value)}
                  className="bg-muted border-border" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Fault Description</Label>
              <Textarea value={faultDescription} onChange={e => setFaultDescription(e.target.value)}
                placeholder="Describe the fault..." className="bg-muted border-border resize-none" rows={2} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Diagnosis</Label>
              <Textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)}
                placeholder="Technical diagnosis..." className="bg-muted border-border resize-none" rows={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Outcome</Label>
              <Select value={outcome} onValueChange={v => setOutcome(v as RepairOutcome)}>
                <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {Object.values(RepairOutcome).map(o => <SelectItem key={o} value={o}>{repairOutcomeLabel(o)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <PartsReplacedEditor parts={partsReplaced} onChange={setPartsReplaced} availableParts={availableParts} />
          </form>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button form="new-ticket-form" type="submit"
            disabled={createTicket.isPending || !serialNumber || !faultDescription || !technicianName}>
            {createTicket.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : 'Create Ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NewRepairTicketForm;
