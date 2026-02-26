import { AssetStatus, RepairOutcome, AppUserRole } from '../backend';

export function formatTimestamp(ts: bigint | number | undefined | null): string {
  if (ts === null || ts === undefined) return '—';
  const ms = typeof ts === 'bigint' ? Number(ts) / 1_000_000 : ts;
  if (isNaN(ms) || ms <= 0) return '—';
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function formatTimestampFull(ts: bigint | number | undefined | null): string {
  if (ts === null || ts === undefined) return '—';
  const ms = typeof ts === 'bigint' ? Number(ts) / 1_000_000 : ts;
  if (isNaN(ms) || ms <= 0) return '—';
  return new Date(ms).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function assetStatusLabel(status: AssetStatus): string {
  switch (status) {
    case AssetStatus.inField: return 'In Field';
    case AssetStatus.inRepair: return 'In Repair';
    case AssetStatus.inProgramming: return 'In Programming';
    case AssetStatus.deployed: return 'Deployed';
    case AssetStatus.scrapped: return 'Scrapped';
    default: return String(status);
  }
}

export function assetStatusClass(status: AssetStatus): string {
  switch (status) {
    case AssetStatus.inField: return 'status-infield';
    case AssetStatus.inRepair: return 'status-inrepair';
    case AssetStatus.inProgramming: return 'status-inprogramming';
    case AssetStatus.deployed: return 'status-deployed';
    case AssetStatus.scrapped: return 'status-scrapped';
    default: return 'status-scrapped';
  }
}

export function repairOutcomeLabel(outcome: RepairOutcome): string {
  switch (outcome) {
    case RepairOutcome.fixed: return 'Fixed';
    case RepairOutcome.replaced: return 'Replaced';
    case RepairOutcome.scrapped: return 'Scrapped';
    case RepairOutcome.pending: return 'Pending';
    default: return String(outcome);
  }
}

export function repairOutcomeClass(outcome: RepairOutcome): string {
  switch (outcome) {
    case RepairOutcome.fixed: return 'outcome-fixed';
    case RepairOutcome.replaced: return 'outcome-replaced';
    case RepairOutcome.scrapped: return 'outcome-scrapped';
    case RepairOutcome.pending: return 'outcome-pending';
    default: return 'outcome-pending';
  }
}

export function appUserRoleLabel(role: AppUserRole): string {
  switch (role) {
    case AppUserRole.technician: return 'Technician';
    case AppUserRole.supervisor: return 'Supervisor';
    case AppUserRole.admin: return 'Admin';
    default: return String(role);
  }
}

export function dateToNanoseconds(date: Date): bigint {
  return BigInt(date.getTime()) * BigInt(1_000_000);
}

export function nanosecondsToDate(ns: bigint): Date {
  return new Date(Number(ns) / 1_000_000);
}

export const MODELS = ['V240m', 'VX520', 'V400m', 'VX680', 'P400'];
export const CLIENTS = ['JAA', 'JN Bank', 'NCB', 'Scotia Bank', 'CIBC'];
export const ASSET_STATUSES = Object.values(AssetStatus);
export const REPAIR_OUTCOMES = Object.values(RepairOutcome);
export const USER_ROLES = Object.values(AppUserRole);
