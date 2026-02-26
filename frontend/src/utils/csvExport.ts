import type { Asset, RepairTicket } from '../backend';
import { formatTimestamp, assetStatusLabel, repairOutcomeLabel } from './formatters';

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string | number | undefined | null): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportAssetsToCSV(assets: Asset[]) {
  const headers = ['Serial Number', 'Model', 'Client', 'Status', 'Condition', 'Date Registered'];
  const rows = assets.map(a => [
    escapeCSV(a.serialNumber),
    escapeCSV(a.model),
    escapeCSV(a.client),
    escapeCSV(assetStatusLabel(a.status)),
    escapeCSV(a.condition),
    escapeCSV(formatTimestamp(a.dateFirstRegistered)),
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const date = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `assets_export_${date}.csv`);
}

export function exportRepairsToCSV(repairs: RepairTicket[]) {
  const headers = [
    'Ticket ID', 'Serial Number', 'Technician', 'Date Received', 'Time Received',
    'Fault Description', 'Diagnosis', 'Outcome', 'Repair Start', 'Repair Completion',
    'Sent to Programming', 'Date Deployed'
  ];
  const rows = repairs.map(t => [
    escapeCSV(t.ticketId),
    escapeCSV(t.serialNumber),
    escapeCSV(t.technicianName),
    escapeCSV(formatTimestamp(t.dateReceived)),
    escapeCSV(t.timeReceived),
    escapeCSV(t.faultDescription),
    escapeCSV(t.diagnosis),
    escapeCSV(repairOutcomeLabel(t.outcome)),
    escapeCSV(formatTimestamp(t.repairStartDate)),
    escapeCSV(t.repairCompletionDate ? formatTimestamp(t.repairCompletionDate) : ''),
    escapeCSV(t.sentToProgrammingDate ? formatTimestamp(t.sentToProgrammingDate) : ''),
    escapeCSV(t.dateDeployedToField ? formatTimestamp(t.dateDeployedToField) : ''),
  ]);

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const date = new Date().toISOString().split('T')[0];
  downloadCSV(csv, `repairs_export_${date}.csv`);
}
