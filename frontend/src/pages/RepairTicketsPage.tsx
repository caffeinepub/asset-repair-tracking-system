import React, { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/StatusBadge';
import NewRepairTicketForm from '@/components/NewRepairTicketForm';
import RepairTicketDetailModal from '@/components/RepairTicketDetailModal';
import { useListAllRepairs } from '@/hooks/useQueries';
import { RepairTicket, RepairOutcome } from '@/backend';

const STAGES = [
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

export default function RepairTicketsPage() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);

  const { data: repairs, isLoading } = useListAllRepairs();

  const filtered = (repairs ?? []).filter((ticket) => {
    const matchesSearch =
      !search ||
      ticket.ticketId.toLowerCase().includes(search.toLowerCase()) ||
      ticket.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      ticket.technicianName.toLowerCase().includes(search.toLowerCase()) ||
      ticket.faultDescription.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === 'all' || ticket.currentStage === stageFilter;
    const matchesOutcome = outcomeFilter === 'all' || ticket.outcome === outcomeFilter;
    return matchesSearch && matchesStage && matchesOutcome;
  });

  const sorted = [...filtered].sort(
    (a, b) => Number(b.dateReceived) - Number(a.dateReceived)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Repair Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage repair jobs</p>
        </div>
        <Button onClick={() => setShowNewForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Ticket
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ticket ID, serial, technician..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background text-foreground placeholder:text-muted-foreground border-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter:</span>
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-40 bg-background text-foreground border-input">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="all">All Stages</SelectItem>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
              <SelectTrigger className="w-36 bg-background text-foreground border-input">
                <SelectValue placeholder="Outcome" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value={RepairOutcome.pending}>Pending</SelectItem>
                <SelectItem value={RepairOutcome.fixed}>Fixed</SelectItem>
                <SelectItem value={RepairOutcome.replaced}>Replaced</SelectItem>
                <SelectItem value={RepairOutcome.scrapped}>Scrapped</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-card-foreground">
            {isLoading ? 'Loading...' : `${sorted.length} Ticket${sorted.length !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">No repair tickets found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Ticket ID</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Serial</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Technician</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Stage</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Outcome</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Date Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((ticket) => (
                  <TableRow
                    key={ticket.ticketId}
                    className="border-border hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <TableCell className="font-mono text-xs text-foreground">
                      {ticket.ticketId.slice(0, 16)}...
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{ticket.serialNumber}</TableCell>
                    <TableCell className="text-sm text-foreground">{ticket.technicianName}</TableCell>
                    <TableCell className="text-sm text-foreground">{ticket.currentStage}</TableCell>
                    <TableCell>
                      <StatusBadge outcome={ticket.outcome} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(Number(ticket.dateReceived) / 1_000_000).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showNewForm && (
        <NewRepairTicketForm open={showNewForm} onClose={() => setShowNewForm(false)} />
      )}
      {selectedTicket && (
        <RepairTicketDetailModal
          ticket={selectedTicket}
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}
