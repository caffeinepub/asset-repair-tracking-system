import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import type { PartReplaced, Part } from '../backend';

interface PartsReplacedEditorProps {
  parts: PartReplaced[];
  onChange: (parts: PartReplaced[]) => void;
  availableParts: Part[];
}

export function PartsReplacedEditor({ parts, onChange, availableParts }: PartsReplacedEditorProps) {
  const addLine = () => {
    onChange([...parts, { partNumber: '', partName: '', qty: BigInt(1) }]);
  };

  const removeLine = (index: number) => {
    onChange(parts.filter((_, i) => i !== index));
  };

  const updatePartNumber = (index: number, partNumber: string) => {
    const found = availableParts.find(ap => ap.partNumber === partNumber);
    const updated = parts.map((p, i) => {
      if (i !== index) return p;
      return { ...p, partNumber, partName: found?.partName ?? p.partName };
    });
    onChange(updated);
  };

  const updateQty = (index: number, value: string) => {
    const qty = BigInt(Math.max(1, parseInt(value) || 1));
    const updated = parts.map((p, i) => {
      if (i !== index) return p;
      return { ...p, qty };
    });
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Parts Replaced</span>
        <Button type="button" variant="ghost" size="sm" onClick={addLine} className="h-7 text-xs gap-1 text-amber hover:text-amber">
          <Plus className="w-3 h-3" /> Add Part
        </Button>
      </div>
      {parts.length === 0 && (
        <p className="text-xs text-muted-foreground py-2 text-center bg-secondary/30 rounded">No parts added</p>
      )}
      {parts.map((part, index) => (
        <div key={index} className="flex gap-2 items-center">
          <Select value={part.partNumber} onValueChange={v => updatePartNumber(index, v)}>
            <SelectTrigger className="bg-secondary border-border text-xs flex-1">
              <SelectValue placeholder="Select part" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {availableParts.map(p => (
                <SelectItem key={p.partNumber} value={p.partNumber}>
                  <span className="font-mono-id">{p.partNumber}</span> — {p.partName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            min={1}
            value={Number(part.qty)}
            onChange={e => updateQty(index, e.target.value)}
            className="bg-secondary border-border w-16 text-xs"
            placeholder="Qty"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeLine(index)}
            className="h-8 w-8 text-destructive hover:text-destructive flex-shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
}
