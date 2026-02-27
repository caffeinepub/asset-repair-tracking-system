import type { Asset, RepairTicket } from '../backend';
import { formatTimestamp, assetStatusLabel, repairOutcomeLabel } from './formatters';

function downloadCSVFile(content: string, filename: string) {
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

function formatDateYMD(ts: bigint | number | undefined | null): string {
  if (ts === null || ts === undefined) return '';
  const ms = typeof ts === 'bigint' ? Number(ts) / 1_000_000 : ts;
  if (isNaN(ms) || ms <= 0) return '';
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ── Asset Export (standard columns) ──────────────────────────────────────────

const ASSET_EXPORT_HEADERS = [
  'Serial Number',
  'Asset Name',
  'Category',
  'Status',
  'Date Added',
  'Assigned User',
];

function assetToExportRow(a: Asset): string[] {
  return [
    a.serialNumber,
    a.model,
    a.client,
    assetStatusLabel(a.status),
    formatDateYMD(a.dateFirstRegistered),
    a.condition,
  ];
}

export function exportAssetsAsCSV(assets: Asset[]) {
  const rows = assets.map(assetToExportRow);
  const csv = [
    ASSET_EXPORT_HEADERS.map(escapeCSV).join(','),
    ...rows.map((r) => r.map(escapeCSV).join(',')),
  ].join('\n');
  const date = new Date().toISOString().split('T')[0];
  downloadCSVFile(csv, `assets_export_${date}.csv`);
}

export async function exportAssetsAsExcel(assets: Asset[]) {
  // Dynamically load SheetJS (same CDN used by fileParser.ts)
  await new Promise<void>((resolve, reject) => {
    if ((window as any).XLSX) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load SheetJS library'));
    document.head.appendChild(script);
  });

  const XLSX = (window as any).XLSX;

  const worksheetData = [
    ASSET_EXPORT_HEADERS,
    ...assets.map(assetToExportRow),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for readability
  worksheet['!cols'] = [
    { wch: 20 }, // Serial Number
    { wch: 20 }, // Asset Name
    { wch: 20 }, // Category
    { wch: 16 }, // Status
    { wch: 14 }, // Date Added
    { wch: 20 }, // Assigned User
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');

  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `assets_export_${date}.xlsx`);
}

// ── Legacy exports (kept for backward compatibility) ─────────────────────────

export function exportAssetsToCSV(assets: Asset[]) {
  const headers = ['Serial Number', 'Model', 'Client', 'Status', 'Condition', 'Date Registered'];
  const rows = assets.map((a) => [
    escapeCSV(a.serialNumber),
    escapeCSV(a.model),
    escapeCSV(a.client),
    escapeCSV(assetStatusLabel(a.status)),
    escapeCSV(a.condition),
    escapeCSV(formatTimestamp(a.dateFirstRegistered)),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const date = new Date().toISOString().split('T')[0];
  downloadCSVFile(csv, `assets_export_${date}.csv`);
}

export function exportRepairsToCSV(repairs: RepairTicket[]) {
  const headers = [
    'Ticket ID',
    'Serial Number',
    'Technician',
    'Date Received',
    'Time Received',
    'Fault Description',
    'Diagnosis',
    'Outcome',
    'Repair Start',
    'Repair Completion',
    'Sent to Programming',
    'Date Deployed',
  ];
  const rows = repairs.map((t) => [
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

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const date = new Date().toISOString().split('T')[0];
  downloadCSVFile(csv, `repairs_export_${date}.csv`);
}
