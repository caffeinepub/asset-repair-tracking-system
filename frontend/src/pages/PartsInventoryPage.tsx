import { useState } from 'react';
import { useListParts, useGetLowStockParts } from '../hooks/useQueries';
import StatusBadge from '../components/StatusBadge';
import AddPartForm from '../components/AddPartForm';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal';
import { Part } from '../backend';
import { AlertTriangle, Plus, Package, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PartsInventoryPage() {
  const { data: parts = [], isLoading } = useListParts();
  const { data: lowStockParts = [] } = useGetLowStockParts();

  const [showAdd, setShowAdd] = useState(false);
  const [adjustPart, setAdjustPart] = useState<Part | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground">Parts Inventory</h2>
          <p className="text-sm text-muted-foreground">Manage spare parts and stock levels</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Part
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockParts.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">
              {lowStockParts.length} Part{lowStockParts.length !== 1 ? 's' : ''} Low on Stock
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockParts.map(part => (
              <span
                key={part.partNumber}
                className="inline-flex items-center gap-1 px-2 py-1 bg-card border border-destructive/30 rounded text-xs text-foreground"
              >
                <Package className="h-3 w-3 text-destructive" />
                {part.partName} ({Number(part.quantityInStock)} left)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Parts Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Part #</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Compatible Model</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">In Stock</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Threshold</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
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
              ) : parts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No parts in inventory
                  </td>
                </tr>
              ) : (
                parts.map(part => {
                  const isLow = Number(part.quantityInStock) <= Number(part.lowStockThreshold);
                  return (
                    <tr key={part.partNumber} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs text-foreground">{part.partNumber}</td>
                      <td className="px-4 py-2.5 text-foreground">{part.partName}</td>
                      <td className="px-4 py-2.5 text-muted-foreground">{part.compatibleModel}</td>
                      <td className={`px-4 py-2.5 font-semibold ${isLow ? 'text-destructive' : 'text-foreground'}`}>
                        {Number(part.quantityInStock)}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{Number(part.lowStockThreshold)}</td>
                      <td className="px-4 py-2.5">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-destructive/15 text-destructive border border-destructive/30">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/15 text-success border border-success/30">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => setAdjustPart(part)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">{parts.length} part{parts.length !== 1 ? 's' : ''} in inventory</p>
        </div>
      </div>

      {showAdd && <AddPartForm open={showAdd} onClose={() => setShowAdd(false)} />}
      {adjustPart && (
        <StockAdjustmentModal
          part={adjustPart}
          open={!!adjustPart}
          onClose={() => setAdjustPart(null)}
        />
      )}
    </div>
  );
}
