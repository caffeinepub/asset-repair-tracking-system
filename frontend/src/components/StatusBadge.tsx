import { AssetStatus, RepairOutcome } from '../backend';

interface StatusBadgeProps {
  status?: AssetStatus;
  outcome?: RepairOutcome;
}

const statusConfig: Record<AssetStatus, { label: string; classes: string }> = {
  [AssetStatus.inField]: {
    label: 'In Field',
    classes: 'bg-success/15 text-success border border-success/30',
  },
  [AssetStatus.inRepair]: {
    label: 'In Repair',
    classes: 'bg-warning/15 text-warning border border-warning/30',
  },
  [AssetStatus.inProgramming]: {
    label: 'In Programming',
    classes: 'bg-primary/15 text-primary border border-primary/30',
  },
  [AssetStatus.deployed]: {
    label: 'Deployed',
    classes: 'bg-success/15 text-success border border-success/30',
  },
  [AssetStatus.scrapped]: {
    label: 'Scrapped',
    classes: 'bg-destructive/15 text-destructive border border-destructive/30',
  },
};

const outcomeConfig: Record<RepairOutcome, { label: string; classes: string }> = {
  [RepairOutcome.fixed]: {
    label: 'Fixed',
    classes: 'bg-success/15 text-success border border-success/30',
  },
  [RepairOutcome.replaced]: {
    label: 'Replaced',
    classes: 'bg-primary/15 text-primary border border-primary/30',
  },
  [RepairOutcome.scrapped]: {
    label: 'Scrapped',
    classes: 'bg-destructive/15 text-destructive border border-destructive/30',
  },
  [RepairOutcome.pending]: {
    label: 'Pending',
    classes: 'bg-muted text-muted-foreground border border-border',
  },
};

export default function StatusBadge({ status, outcome }: StatusBadgeProps) {
  if (status !== undefined) {
    const config = statusConfig[status];
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.classes}`}>
        {config.label}
      </span>
    );
  }

  if (outcome !== undefined) {
    const config = outcomeConfig[outcome];
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.classes}`}>
        {config.label}
      </span>
    );
  }

  return null;
}
