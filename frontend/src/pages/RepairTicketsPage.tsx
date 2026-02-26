import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import { RepairTicket, RepairOutcome } from '../backend';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Pencil, Loader2 } from 'lucide-react';
import { NewRepairTicketForm } from '../components/NewRepairTicketForm';
import { RepairTicketDetailModal } from '../components/RepairTicketDetailModal';

const STAGES = [
  'All Stages',
  'Received',
  'Diagnosing',
  'Awaiting Parts',
  'Repairing',
  'QA Testing',
  'Programming',
  'Ready Deploy',
  'Deployed',
  'Closed',
];

function outcomeLabel(outcome: RepairOutcome): string {
  switch (outcome) {
    case RepairOutcome.fixed: return 'Fixed';
    case RepairOutcome.replaced: return 'Replaced';
    case RepairOutcome.scrapped: return 'Scrapped';
    case RepairOutcome.pending: return 'Pending';
    default: return String(outcome);
  }
}

function outcomeVariant(outcome: RepairOutcome): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (outcome) {
    case RepairOutcome.fixed: return 'default';
    case RepairOutcome.replaced: return 'secondary';
    case RepairOutcome.scrapped: return 'destructive';
    default: return 'outline';
  }
}

export default function RepairTicketsPage() {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAdmin } = useAuth();

  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('All Stages');
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [viewTicket, setViewTicket] = useState<RepairTicket | null>(null);
  const [editTicket, setEditTicket] = useState<RepairTicket | null>(null);

  const { data: tickets = [], isLoading } = useQuery<RepairTicket[]>({
    queryKey: ['repairTickets'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllRepairs();
    },
    enabled: !!actor && !actorFetching,
  });

  const filtered = tickets.filter((t) => {
    const matchSearch =
      !search ||
      t.ticketId.toLowerCase().includes(search.toLowerCase()) ||
      t.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.technicianName.toLowerCase().includes(search.toLowerCase()) ||
      t.faultDescription.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'All Stages' || t.currentStage === stageFilter;
    return matchSearch && matchStage;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Repair Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage repair workflows</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setNewTicketOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <TableHead>Ticket ID</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No repair tickets found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((ticket) => (
                  <TableRow key={ticket.ticketId}>
                    <TableCell className="font-mono text-xs">{ticket.ticketId}</TableCell>
                    <TableCell className="font-mono text-sm">{ticket.serialNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.currentStage}</Badge>
                    </TableCell>
                    <TableCell>{ticket.technicianName}</TableCell>
                    <TableCell>
                      <Badge variant={outcomeVariant(ticket.outcome)}>
                        {outcomeLabel(ticket.outcome)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => setViewTicket(ticket)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => setEditTicket(ticket)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modals */}
      {isAdmin && (
        <NewRepairTicketForm
          open={newTicketOpen}
          onClose={() => setNewTicketOpen(false)}
        />
      )}

      {viewTicket && (
        <RepairTicketDetailModal
          open={!!viewTicket}
          onClose={() => setViewTicket(null)}
          ticket={viewTicket}
          canEdit={false}
        />
      )}

      {editTicket && isAdmin && (
        <RepairTicketDetailModal
          open={!!editTicket}
          onClose={() => setEditTicket(null)}
          ticket={editTicket}
          canEdit={true}
        />
      )}
    </div>
  );
}
