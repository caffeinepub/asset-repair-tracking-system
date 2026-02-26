/**
 * File parser utility for batch serial number import.
 * Supports .xlsx, .csv, and .txt file formats.
 * For Excel/CSV: always uses the first column.
 * For TXT: one serial number per line.
 */

export interface ParseResult {
  serialNumbers: string[];
  error?: string;
}

// Dynamically load SheetJS from CDN for XLSX parsing
function loadSheetJS(): Promise<void> {
  return new Promise((resolve, reject) => {
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
}

function isLikelyHeader(value: string): boolean {
  const lower = value.toLowerCase().trim();
  const headerKeywords = [
    'serial', 'serial number', 'serialnumber', 'serial_number',
    'sn', 's/n', 'number', 'no', 'no.', 'id', 'asset', 'device',
    'header', 'col', 'column', 'field', 'name', 'value',
  ];
  return headerKeywords.includes(lower);
}

async function parseXLSX(file: File): Promise<ParseResult> {
  try {
    await loadSheetJS();
    const XLSX = (window as any).XLSX;

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return { serialNumbers: [], error: 'No sheets found in the Excel file.' };
    }

    const worksheet = workbook.Sheets[firstSheetName];
    // Get all rows as arrays (first column only)
    const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (rows.length === 0) {
      return { serialNumbers: [] };
    }

    const serials: string[] = [];
    let startIndex = 0;

    // Check if first row looks like a header
    const firstCell = String(rows[0][0] ?? '').trim();
    if (firstCell && isLikelyHeader(firstCell)) {
      startIndex = 1;
    }

    for (let i = startIndex; i < rows.length; i++) {
      const cell = String(rows[i][0] ?? '').trim();
      if (cell) {
        serials.push(cell);
      }
    }

    return { serialNumbers: serials };
  } catch (err: any) {
    return { serialNumbers: [], error: err.message || 'Failed to parse Excel file.' };
  }
}

function parseCSV(content: string): ParseResult {
  const lines = content.split(/\r?\n/);
  if (lines.length === 0) return { serialNumbers: [] };

  const serials: string[] = [];
  let startIndex = 0;

  // Check if first non-empty line looks like a header
  const firstLine = lines[0];
  const firstCell = firstLine.split(',')[0].replace(/^["']|["']$/g, '').trim();
  if (firstCell && isLikelyHeader(firstCell)) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Extract first column (handle quoted values)
    let cell: string;
    if (line.startsWith('"')) {
      const endQuote = line.indexOf('"', 1);
      cell = endQuote > 0 ? line.substring(1, endQuote) : line.replace(/^"|"$/g, '');
    } else {
      cell = line.split(',')[0].trim();
    }
    if (cell) {
      serials.push(cell);
    }
  }

  return { serialNumbers: serials };
}

function parseTXT(content: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const serials: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      serials.push(trimmed);
    }
  }
  return { serialNumbers: serials };
}

export async function parseFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return parseXLSX(file);
  }

  if (name.endsWith('.csv')) {
    const content = await file.text();
    return parseCSV(content);
  }

  if (name.endsWith('.txt')) {
    const content = await file.text();
    return parseTXT(content);
  }

  return { serialNumbers: [], error: 'Unsupported file format. Please use .xlsx, .csv, or .txt files.' };
}
