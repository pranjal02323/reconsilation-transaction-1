import {
  BUY_KEYWORDS,
  CANCELLED_KEYWORDS,
  DATE_HEADERS,
  DEFAULT_FALLBACKS,
  GROSS_HEADERS,
  INSTRUMENT_HEADERS,
  PENDING_KEYWORDS,
  PRICE_HEADERS,
  QTY_HEADERS,
  REF_HEADERS,
  SELL_KEYWORDS,
  SETTLED_KEYWORDS,
  SIDE_HEADERS,
  STATUS_HEADERS,
  TRANSACTION_SIDE,
  TRANSACTION_STATUS,
} from '../Constants/app-constants';
import {
  NormalizedTransaction,
  SourceType,
  TransactionSide,
  TransactionStatus,
} from '../Types/reconciliation-types';

export function parseSide(value: string): TransactionSide {
  const normalized = value ? value.trim().toUpperCase() : '';
  if (BUY_KEYWORDS.includes(normalized)) {
    return TRANSACTION_SIDE.BUY;
  }
  if (SELL_KEYWORDS.includes(normalized)) {
    return TRANSACTION_SIDE.SELL;
  }
  throw new Error(`Unknown transaction side/direction: "${value}"`);
}

export function parseStatus(value: string): TransactionStatus {
  const normalized = value ? value.trim().toUpperCase() : '';
  if (SETTLED_KEYWORDS.includes(normalized)) {
    return TRANSACTION_STATUS.SETTLED;
  }
  if (CANCELLED_KEYWORDS.includes(normalized)) {
    return TRANSACTION_STATUS.CANCELLED;
  }
  if (PENDING_KEYWORDS.includes(normalized)) {
    return TRANSACTION_STATUS.PENDING;
  }
  return DEFAULT_FALLBACKS.STATUS;
}

export function parseTimestamp(value: string): string {
  if (!value) return new Date().toISOString();
  let str = value.trim();
  if (str.includes(' ') && !str.includes('T')) {
    str = str.replace(' ', 'T') + 'Z';
  }
  const date = new Date(str);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: "${value}"`);
  }
  return date.toISOString();
}

export function parseCsvRows(csvContent: string): Record<string, string>[] {
  const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ? values[index].trim() : '';
    });
    rows.push(row);
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function findValueByKeys(row: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    if (row[key] !== undefined) {
      return row[key];
    }
  }
  return undefined;
}

export function normalizeRawRow(
  row: Record<string, string>,
  source: SourceType,
  fileId?: string,
  index: number = 0
): NormalizedTransaction {
  const refId = findValueByKeys(row, REF_HEADERS) || `GEN-${source}-${index}`;
  const rawDate = findValueByKeys(row, DATE_HEADERS) || '';
  const tradedAt = parseTimestamp(rawDate);
  const instrument = findValueByKeys(row, INSTRUMENT_HEADERS) || DEFAULT_FALLBACKS.INSTRUMENT;
  const rawSide = findValueByKeys(row, SIDE_HEADERS) || DEFAULT_FALLBACKS.SIDE;
  const side = parseSide(rawSide);
  const quantity = parseFloat(findValueByKeys(row, QTY_HEADERS) || '0');
  const unitPrice = parseFloat(findValueByKeys(row, PRICE_HEADERS) || '0');
  const grossAmount = parseFloat(
    findValueByKeys(row, GROSS_HEADERS) || (quantity * unitPrice).toString()
  );
  const rawStatus = findValueByKeys(row, STATUS_HEADERS) || DEFAULT_FALLBACKS.STATUS;
  const status = parseStatus(rawStatus);

  return {
    id: `${source.toLowerCase()}-${refId}`,
    fileId,
    source,
    externalRefId: refId.toUpperCase().trim(),
    tradedAt,
    instrument: instrument.toUpperCase().trim(),
    side,
    quantity,
    unitPrice,
    grossAmount,
    status,
  };
}

export function parseFileContent(
  fileContent: string,
  source: SourceType,
  fileId?: string
): NormalizedTransaction[] {
  const rawRows = parseCsvRows(fileContent);
  return rawRows.map((row, idx) => normalizeRawRow(row, source, fileId, idx));
}
