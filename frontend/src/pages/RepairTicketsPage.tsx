import { useState } from 'react';
import { useListAllRepairs, useGetClients } from '../hooks/useQueries';
import StatusBadge from '../components/StatusBadge';
import { NewRepairTicketForm } from '../components/NewRepairTicketForm';
import { RepairTicketDetailModal } from '../components/RepairTicketDetailModal';
import { RepairTicket } from '../backend';
import { Search, Plus, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function exportRepairsToCSV(repairs: RepairTicket[]) {
  const headers = ['Ticket ID', 'Serial Number', 'Date Received', 'Technician', 'Fault Description', 'Outcome'];
  const rows = repairs.map(r => [
    r.ticketId,
    r.serialNumber,
    new Date(Number(r.dateReceived) / 1_000_000).toLocaleDateString(),
    r.technicianName,
    r.faultDescription,
    r.outcome,
  ]);
  const csv = [headers, ...rows].map(row => row.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'repair-tickets.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function RepairTicketsPage() {
  const { data: repairs = [], isLoading } = useListAllRepairs();
  const { data: clients = [] } = useGetClients();

  const [search, setSearch] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [viewTicket, setViewTicket] = useState<RepairTicket | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = repairs.filter(r => {
    const matchSearch =
      !search ||
      r.ticketId.toLowerCase().includes(search.toLowerCase()) ||
      r.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.technicianName.toLowerCase().includes(search.toLowerCase()) ||
      r.faultDescription.toLowerCase().includes(search.toLowerCase());
    const matchOutcome = !filterOutcome || r.outcome === filterOutcome;
    return matchSearch && matchOutcome;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Repair Tickets</h2>
          <p className="text-sm text-muted-foreground">Track and manage all repair jobs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportRepairsToCSV(filtered)}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search ticket ID, serial, technician..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm bg-background"
          />
        </div>
        <select
          value={filterOutcome}
          onChange={e => setFilterOutcome(e.target.value)}
          className="h-8 px-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Outcomes</option>
          <option value="pending">Pending</option>
          <option value="fixed">Fixed</option>
          <option value="replaced">Replaced</option>
          <option value="scrapped">Scrapped</option>
        </select>
        <select
          value={filterClient}
          onChange={e => setFilterClient(e.target.value)}
          className="h-8 px-2 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="">All Clients</option>
          {clients.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ticket ID</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Serial #</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Date Received</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Technician</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fault</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Outcome</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No repair tickets found
                  </td>
                </tr>
              ) : (
                filtered.map(ticket => (
                  <tr key={ticket.ticketId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">{ticket.ticketId}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">{ticket.serialNumber}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">
                      {new Date(Number(ticket.dateReceived) / 1_000_000).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-foreground">{ticket.technicianName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground max-w-xs truncate">{ticket.faultDescription}</td>
                    <td className="px-4 py-2.5"><StatusBadge outcome={ticket.outcome} /></td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setViewTicket(ticket)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''} shown</p>
        </div>
      </div>

      {showAdd && <NewRepairTicketForm open={showAdd} onClose={() => setShowAdd(false)} />}
      {viewTicket && (
        <RepairTicketDetailModal
          ticket={viewTicket}
          open={!!viewTicket}
          onClose={() => setViewTicket(null)}
          canEdit={true}
        />
      )}
    </div>
  );
}
