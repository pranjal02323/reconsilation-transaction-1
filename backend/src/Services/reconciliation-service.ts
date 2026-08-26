import crypto from 'crypto';
import {
  LEDGER_SAMPLE_CSV,
  MATCH_STATUS,
  SAMPLE_FILES,
  SOURCE_TYPE,
  STATEMENT_SAMPLE_CSV,
} from '../Constants/app-constants';
import { db } from '../Db/database';
import { parseFileContent } from '../Engine/csv-parser';
import { reconcileTransactions } from '../Engine/match-engine';
import {
  ManualResolution,
  ManualResolutionType,
  NormalizedTransaction,
  ReconciliationMatch,
  ReconciliationSummary,
  SourceType,
} from '../Types/reconciliation-types';

export function calculateFileHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function ingestFile(filename: string, content: string, source: SourceType) {
  const fileHash = calculateFileHash(content);

  const existingFile = db
    .prepare('SELECT id FROM raw_files WHERE file_hash = ? AND source_type = ?')
    .get(fileHash, source) as { id: string } | undefined;

  if (existingFile) {
    return { fileId: existingFile.id, isDuplicate: true, message: 'File already ingested (Idempotent)' };
  }

  const fileId = `file-${crypto.randomUUID()}`;
  const uploadedAt = new Date().toISOString();

  const normalizedRecords = parseFileContent(content, source, fileId);

  const insertFileStmt = db.prepare(
    'INSERT INTO raw_files (id, filename, file_hash, source_type, uploaded_at) VALUES (?, ?, ?, ?, ?)'
  );

  const deactivateAllForSourceStmt = db.prepare(
    'UPDATE transactions SET is_latest = 0 WHERE source = ?'
  );

  const getMaxVersionStmt = db.prepare(
    'SELECT MAX(version) as max_version FROM transactions WHERE external_ref_id = ? AND source = ?'
  );

  const insertTransStmt = db.prepare(`
    INSERT INTO transactions (
      id, file_id, external_ref_id, version, source, traded_at, instrument, side, quantity, unit_price, gross_amount, status, is_latest
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  const runTransaction = db.transaction(() => {
    insertFileStmt.run(fileId, filename, fileHash, source, uploadedAt);
    deactivateAllForSourceStmt.run(source);

    for (const record of normalizedRecords) {
      const row = getMaxVersionStmt.get(record.externalRefId, source) as
        | { max_version: number | null }
        | undefined;
      const version = (row?.max_version ?? 0) + 1;

      const transId = `${source.toLowerCase()}-${record.externalRefId}-v${version}`;
      insertTransStmt.run(
        transId,
        fileId,
        record.externalRefId,
        version,
        source,
        record.tradedAt,
        record.instrument,
        record.side,
        record.quantity,
        record.unitPrice,
        record.grossAmount,
        record.status
      );
    }
  });

  runTransaction();

  return { fileId, isDuplicate: false, recordsIngested: normalizedRecords.length };
}

export function getLatestTransactions(source?: SourceType): NormalizedTransaction[] {
  let query = 'SELECT * FROM transactions WHERE is_latest = 1';
  const params: any[] = [];

  if (source) {
    query += ' AND source = ?';
    params.push(source);
  }

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map((r) => ({
    id: r.id,
    fileId: r.file_id,
    source: r.source,
    externalRefId: r.external_ref_id,
    tradedAt: r.traded_at,
    instrument: r.instrument,
    side: r.side,
    quantity: r.quantity,
    unitPrice: r.unit_price,
    grossAmount: r.gross_amount,
    status: r.status,
    version: r.version,
    isLatest: Boolean(r.is_latest),
  }));
}

export function getLoadedFiles() {
  const internalFile = db
    .prepare("SELECT * FROM raw_files WHERE source_type = 'INTERNAL' ORDER BY uploaded_at DESC LIMIT 1")
    .get() as any;

  const externalFile = db
    .prepare("SELECT * FROM raw_files WHERE source_type = 'EXTERNAL' ORDER BY uploaded_at DESC LIMIT 1")
    .get() as any;

  const internalCount = db
    .prepare("SELECT COUNT(*) as count FROM transactions WHERE source = 'INTERNAL' AND is_latest = 1")
    .get() as any;

  const externalCount = db
    .prepare("SELECT COUNT(*) as count FROM transactions WHERE source = 'EXTERNAL' AND is_latest = 1")
    .get() as any;

  return {
    internal: internalFile
      ? { filename: internalFile.filename, uploadedAt: internalFile.uploaded_at, count: internalCount?.count || 0 }
      : null,
    external: externalFile
      ? { filename: externalFile.filename, uploadedAt: externalFile.uploaded_at, count: externalCount?.count || 0 }
      : null,
  };
}

export function resetDatabase() {
  db.exec(`
    DELETE FROM reconciliation_matches;
    DELETE FROM reconciliation_runs;
    DELETE FROM transactions;
    DELETE FROM raw_files;
    DELETE FROM manual_resolutions;
  `);
  return { message: 'Database reset successfully' };
}

export function getManualResolutions(): ManualResolution[] {
  const rows = db.prepare('SELECT * FROM manual_resolutions ORDER BY resolved_at DESC').all() as any[];
  return rows.map((r) => ({
    id: r.id,
    internalRefId: r.internal_ref_id,
    externalRefId: r.external_ref_id,
    resolutionType: r.resolution_type,
    reason: r.reason,
    createdAt: r.resolved_at,
  }));
}

export function saveManualResolution(
  internalRefId: string | undefined,
  externalRefId: string | undefined,
  resolutionType: ManualResolutionType,
  reason: string
) {
  const id = `res-${crypto.randomUUID()}`;
  const resolvedAt = new Date().toISOString();

  db.prepare(`
    INSERT INTO manual_resolutions (id, internal_ref_id, external_ref_id, resolution_type, reason, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, internalRefId || null, externalRefId || null, resolutionType, reason, resolvedAt);

  return { id, resolvedAt };
}

export function runReconciliation() {
  const internalRecords = getLatestTransactions(SOURCE_TYPE.INTERNAL);
  const externalRecords = getLatestTransactions(SOURCE_TYPE.EXTERNAL);
  const resolutions = getManualResolutions();

  const matches = reconcileTransactions(internalRecords, externalRecords, resolutions);

  const runId = `run-${crypto.randomUUID()}`;
  const runAt = new Date().toISOString();

  const summary: ReconciliationSummary = {
    runId,
    totalInternalRecords: internalRecords.length,
    totalExternalRecords: externalRecords.length,
    exactMatchesCount: matches.filter((m) => m.status === MATCH_STATUS.EXACT_MATCH).length,
    toleratedMatchesCount: matches.filter((m) => m.status === MATCH_STATUS.TOLERATED_MATCH).length,
    discrepanciesCount: matches.filter((m) => m.status === MATCH_STATUS.DISCREPANCY).length,
    unmatchedInternalCount: matches.filter((m) => m.status === MATCH_STATUS.UNMATCHED_INTERNAL).length,
    unmatchedExternalCount: matches.filter((m) => m.status === MATCH_STATUS.UNMATCHED_EXTERNAL).length,
    manuallyResolvedCount: matches.filter((m) => m.status === MATCH_STATUS.MANUALLY_RESOLVED).length,
    cancelledIgnoredCount: matches.filter((m) => m.status === MATCH_STATUS.IGNORED_CANCELLED).length,
    runAt,
  };

  const insertRunStmt = db.prepare(`
    INSERT INTO reconciliation_runs (id, run_at, status, summary_json)
    VALUES (?, ?, ?, ?)
  `);

  const insertMatchStmt = db.prepare(`
    INSERT INTO reconciliation_matches (id, run_id, internal_trans_id, external_trans_id, match_status, diffs_json, summary_note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const runTransaction = db.transaction(() => {
    insertRunStmt.run(runId, runAt, 'COMPLETED', JSON.stringify(summary));

    let idx = 0;
    for (const match of matches) {
      idx++;
      const matchDbId = `match-${runId}-${idx}`;
      insertMatchStmt.run(
        matchDbId,
        runId,
        match.internalRecord?.id || null,
        match.externalRecord?.id || null,
        match.status,
        JSON.stringify(match.diffs),
        match.summaryNote
      );
    }
  });

  runTransaction();

  return { runId, summary, matches, files: getLoadedFiles() };
}

export function getTransactionHistory(refId: string) {
  const rows = db
    .prepare(`
      SELECT t.*, f.filename, f.uploaded_at
      FROM transactions t
      LEFT JOIN raw_files f ON t.file_id = f.id
      WHERE t.external_ref_id = ?
      ORDER BY t.version DESC
    `)
    .all(refId) as any[];

  return rows.map((r) => ({
    id: r.id,
    externalRefId: r.external_ref_id,
    version: r.version,
    source: r.source,
    tradedAt: r.traded_at,
    instrument: r.instrument,
    side: r.side,
    quantity: r.quantity,
    unitPrice: r.unit_price,
    grossAmount: r.gross_amount,
    status: r.status,
    isLatest: Boolean(r.is_latest),
    filename: r.filename,
    uploadedAt: r.uploaded_at,
  }));
}

export function getLatestRunReport() {
  const latestRun = db
    .prepare('SELECT * FROM reconciliation_runs ORDER BY run_at DESC LIMIT 1')
    .get() as any;

  if (!latestRun) {
    return null;
  }

  const matchesRows = db
    .prepare(`
      SELECT m.*, 
             t_int.external_ref_id as int_ref, t_int.traded_at as int_time, t_int.instrument as int_inst, t_int.side as int_side, t_int.quantity as int_qty, t_int.unit_price as int_price, t_int.gross_amount as int_gross, t_int.status as int_status, t_int.version as int_version,
             t_ext.external_ref_id as ext_ref, t_ext.traded_at as ext_time, t_ext.instrument as ext_inst, t_ext.side as ext_side, t_ext.quantity as ext_qty, t_ext.unit_price as ext_price, t_ext.gross_amount as ext_gross, t_ext.status as ext_status, t_ext.version as ext_version
      FROM reconciliation_matches m
      LEFT JOIN transactions t_int ON m.internal_trans_id = t_int.id
      LEFT JOIN transactions t_ext ON m.external_trans_id = t_ext.id
      WHERE m.run_id = ?
    `)
    .all(latestRun.id) as any[];

  const matches: ReconciliationMatch[] = matchesRows.map((r) => ({
    id: r.id,
    status: r.match_status,
    diffs: JSON.parse(r.diffs_json || '[]'),
    summaryNote: r.summary_note,
    internalRecord: r.internal_trans_id
      ? {
          id: r.internal_trans_id,
          source: SOURCE_TYPE.INTERNAL,
          externalRefId: r.int_ref,
          tradedAt: r.int_time,
          instrument: r.int_inst,
          side: r.int_side,
          quantity: r.int_qty,
          unitPrice: r.int_price,
          grossAmount: r.int_gross,
          status: r.int_status,
          version: r.int_version || 1,
        }
      : undefined,
    externalRecord: r.external_trans_id
      ? {
          id: r.external_trans_id,
          source: SOURCE_TYPE.EXTERNAL,
          externalRefId: r.ext_ref,
          tradedAt: r.ext_time,
          instrument: r.ext_inst,
          side: r.ext_side,
          quantity: r.ext_qty,
          unitPrice: r.ext_price,
          grossAmount: r.ext_gross,
          status: r.ext_status,
          version: r.ext_version || 1,
        }
      : undefined,
  }));

  return {
    summary: JSON.parse(latestRun.summary_json),
    matches,
    files: getLoadedFiles(),
  };
}

export function seedAssignmentSampleData() {
  ingestFile(SAMPLE_FILES.INTERNAL_LEDGER, LEDGER_SAMPLE_CSV, SOURCE_TYPE.INTERNAL);
  ingestFile(SAMPLE_FILES.EXTERNAL_STATEMENT, STATEMENT_SAMPLE_CSV, SOURCE_TYPE.EXTERNAL);

  return runReconciliation();
}
