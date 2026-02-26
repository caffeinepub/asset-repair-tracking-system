import React from 'react';
import { AssetStatus, RepairOutcome } from '@/backend';

interface StatusBadgeProps {
  status?: AssetStatus;
  outcome?: RepairOutcome;
}

const assetStatusConfig: Record<AssetStatus, { label: string; className: string }> = {
  [AssetStatus.inField]: {
    label: 'In Field',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  },
  [AssetStatus.inRepair]: {
    label: 'In Repair',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  },
  [AssetStatus.inProgramming]: {
    label: 'In Programming',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
  },
  [AssetStatus.deployed]: {
    label: 'Deployed',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  },
  [AssetStatus.scrapped]: {
    label: 'Scrapped',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  },
};

const repairOutcomeConfig: Record<RepairOutcome, { label: string; className: string }> = {
  [RepairOutcome.fixed]: {
    label: 'Fixed',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  },
  [RepairOutcome.replaced]: {
    label: 'Replaced',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  },
  [RepairOutcome.scrapped]: {
    label: 'Scrapped',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  },
  [RepairOutcome.pending]: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-200',
  },
};

export default function StatusBadge({ status, outcome }: StatusBadgeProps) {
  if (status !== undefined) {
    const config = assetStatusConfig[status];
    if (!config) return null;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  }

  if (outcome !== undefined) {
    const config = repairOutcomeConfig[outcome];
    if (!config) return null;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  }

  return null;
}
