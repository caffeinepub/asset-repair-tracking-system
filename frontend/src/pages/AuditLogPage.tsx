import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useGetAuditTrail } from '@/hooks/useQueries';

const PAGE_SIZE = 20;

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: auditEntries, isLoading } = useGetAuditTrail(null, null, null);

  const filtered = (auditEntries ?? [])
    .filter((entry) => {
      if (!search) return true;
      return (
        entry.entityId.toLowerCase().includes(search.toLowerCase()) ||
        entry.entityType.toLowerCase().includes(search.toLowerCase()) ||
        entry.changedBy.toLowerCase().includes(search.toLowerCase()) ||
        entry.changeDescription.toLowerCase().includes(search.toLowerCase())
      );
    })
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatTimestamp = (ts: bigint) => {
    return new Date(Number(ts) / 1_000_000).toLocaleString();
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">Track all changes and actions in the system</p>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="pt-4 pb-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by entity, user, or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-background text-foreground placeholder:text-muted-foreground border-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-card-foreground">
            {isLoading ? 'Loading...' : `${filtered.length} Entr${filtered.length !== 1 ? 'ies' : 'y'}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : paginated.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">No audit entries found.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">Timestamp</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Entity Type</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Entity ID</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Changed By</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((entry) => (
                    <TableRow key={entry.entryId} className="border-border hover:bg-muted/50">
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                          {entry.entityType}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground max-w-32 truncate">
                        {entry.entityId}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-foreground max-w-32 truncate">
                        {entry.changedBy}
                      </TableCell>
                      <TableCell className="text-xs text-foreground max-w-64 truncate">
                        {entry.changeDescription}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Page {page} of {totalPages} ({filtered.length} entries)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="text-xs border-border text-foreground hover:bg-accent"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="text-xs border-border text-foreground hover:bg-accent"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
