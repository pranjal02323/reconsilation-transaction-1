import { ToleranceConfig } from '../Types/reconciliation-types';

export const SERVER_CONFIG = {
  DEFAULT_PORT: 4000,
  API_PREFIX: '/api/reconciliation',
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
};

export const RECONCILIATION_ROUTES = {
  SEED: '/seed',
  RESET: '/reset',
  UPLOAD: '/upload',
  RUN: '/run',
  RESOLVE: '/resolve',
  LATEST: '/latest',
};

export const DB_CONFIG = {
  DIR_NAME: 'data',
  FILE_NAME: 'reconciliation.db',
  PRAGMA_FOREIGN_KEYS: 'foreign_keys = ON',
  PRAGMA_JOURNAL_MODE_WAL: 'journal_mode = WAL',
};

export const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS raw_files (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    source_type TEXT NOT NULL,
    uploaded_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    file_id TEXT,
    external_ref_id TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    source TEXT NOT NULL,
    traded_at TEXT NOT NULL,
    instrument TEXT NOT NULL,
    side TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    gross_amount REAL NOT NULL,
    status TEXT NOT NULL,
    is_latest INTEGER DEFAULT 1,
    FOREIGN KEY (file_id) REFERENCES raw_files(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_trans_ref ON transactions(external_ref_id);
  CREATE INDEX IF NOT EXISTS idx_trans_latest ON transactions(is_latest);

  CREATE TABLE IF NOT EXISTS reconciliation_runs (
    id TEXT PRIMARY KEY,
    run_at TEXT NOT NULL,
    status TEXT NOT NULL,
    summary_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reconciliation_matches (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    internal_trans_id TEXT,
    external_trans_id TEXT,
    match_status TEXT NOT NULL,
    diffs_json TEXT,
    summary_note TEXT,
    FOREIGN KEY (run_id) REFERENCES reconciliation_runs(id) ON DELETE CASCADE,
    FOREIGN KEY (internal_trans_id) REFERENCES transactions(id) ON DELETE SET NULL,
    FOREIGN KEY (external_trans_id) REFERENCES transactions(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS manual_resolutions (
    id TEXT PRIMARY KEY,
    internal_ref_id TEXT,
    external_ref_id TEXT,
    resolution_type TEXT NOT NULL,
    reason TEXT NOT NULL,
    resolved_at TEXT NOT NULL
  );
`;

export const DEFAULT_TOLERANCE_CONFIG: ToleranceConfig = {
  amountTolerance: 0.05,
  timestampToleranceSeconds: 3600,
};

export const COMPARISON_EPSILON = 0.0001;

export const TRANSACTION_SIDE = {
  BUY: 'BUY' as const,
  SELL: 'SELL' as const,
};

export const TRANSACTION_STATUS = {
  SETTLED: 'SETTLED' as const,
  CANCELLED: 'CANCELLED' as const,
  PENDING: 'PENDING' as const,
};

export const SOURCE_TYPE = {
  INTERNAL: 'INTERNAL' as const,
  EXTERNAL: 'EXTERNAL' as const,
};

export const MATCH_STATUS = {
  EXACT_MATCH: 'EXACT_MATCH' as const,
  TOLERATED_MATCH: 'TOLERATED_MATCH' as const,
  DISCREPANCY: 'DISCREPANCY' as const,
  UNMATCHED_INTERNAL: 'UNMATCHED_INTERNAL' as const,
  UNMATCHED_EXTERNAL: 'UNMATCHED_EXTERNAL' as const,
  MANUALLY_RESOLVED: 'MANUALLY_RESOLVED' as const,
  IGNORED_CANCELLED: 'IGNORED_CANCELLED' as const,
};

export const MANUAL_RESOLUTION_TYPE = {
  FORCE_MATCH: 'FORCE_MATCH' as const,
  ACCEPT_UNMATCHED: 'ACCEPT_UNMATCHED' as const,
  IGNORE: 'IGNORE' as const,
};

export const MATCH_FIELDS = {
  INSTRUMENT: 'instrument',
  SIDE: 'side',
  GROSS_AMOUNT: 'grossAmount',
  QUANTITY: 'quantity',
  TRADED_AT: 'tradedAt',
};

export const SUMMARY_NOTES = {
  EXACT_MATCH: 'Exact match across all fields',
  TOLERATED_MATCH: 'Match with minor variances within allowed tolerance threshold',
  DISCREPANCY: 'Discrepancy detected in key transaction fields',
  CANCELLED_IGNORED: 'Cancelled transaction ignored from active reconciliation',
  CANCELLED_COUNTERPARTY: 'Counterparty record status is CANCELLED',
  CANCELLED_EXTERNAL: 'External transaction is CANCELLED',
  UNMATCHED_INTERNAL: 'No matching transaction reference found in external statement',
  UNMATCHED_EXTERNAL: 'Transaction present in external statement but missing in internal ledger',
  ACCEPTED_STANDALONE: 'Accepted standalone transaction by operator',
  ACCEPTED_STANDALONE_EXTERNAL: 'Accepted standalone external transaction by operator',
};

export const BUY_KEYWORDS = ['BUY', 'B', 'PURCHASE', 'LONG'];
export const SELL_KEYWORDS = ['SELL', 'S', 'SALE', 'SHORT'];

export const SETTLED_KEYWORDS = ['SETTLED', 'EXECUTED', 'DONE', 'FILLED', 'SUCCESS'];
export const CANCELLED_KEYWORDS = ['CANCELLED', 'CANCELED', 'VOID', 'REJECTED'];
export const PENDING_KEYWORDS = ['PENDING', 'OPEN', 'NEW'];

export const REF_HEADERS = ['trade_id', 'reference', 'ref', 'id', 'transaction_id'];
export const DATE_HEADERS = ['traded_at', 'executed_at', 'timestamp', 'date'];
export const INSTRUMENT_HEADERS = ['instrument', 'symbol', 'asset', 'pair'];
export const SIDE_HEADERS = ['side', 'direction', 'type'];
export const QTY_HEADERS = ['quantity', 'qty'];
export const PRICE_HEADERS = ['price', 'unit_price'];
export const GROSS_HEADERS = ['gross_amount', 'total', 'amount'];
export const STATUS_HEADERS = ['state', 'status'];

export const DEFAULT_FALLBACKS = {
  INSTRUMENT: 'UNKNOWN',
  SIDE: 'BUY' as const,
  STATUS: 'SETTLED' as const,
};

export const SAMPLE_FILES = {
  INTERNAL_LEDGER: 'internal_ledger_sample.csv',
  EXTERNAL_STATEMENT: 'external_statement_sample.csv',
};

export const LEDGER_SAMPLE_CSV = `trade_id,traded_at,instrument,side,quantity,price,gross_amount,state
T-1001,2025-07-01T09:15:00Z,BTC-USD,BUY,0.50,62000.00,31000.00,SETTLED
T-1011,2025-07-04T10:15:00Z,ETH-USD,BUY,10.00,3400.00,34000.00,SETTLED
T-1015,2025-07-05T10:00:00Z,SOL-USD,SELL,300.00,146.00,43800.00,SETTLED
T-1016,2025-07-06T09:00:00Z,BTC-USD,BUY,0.20,63200.00,12640.00,SETTLED
T-1018,2025-07-06T15:00:00Z,SOL-USD,BUY,100.00,149.00,14900.00,CANCELLED`;

export const STATEMENT_SAMPLE_CSV = `reference,executed_at,symbol,direction,qty,unit_price,total,status
T-1001,2025-07-01 09:15:00,BTC-USD,B,0.5,62000,31000.00,SETTLED
T-1011,2025-07-04 10:15:00,ETH-USD,B,10,3417,34170.00,SETTLED
T-1015,2025-07-05 10:40:00,SOL-USD,S,300,146,43800.00,SETTLED
C-9001,2025-07-06 11:20:00,BTC-USD,B,0.15,63100,9465.00,SETTLED`;

export const CONTROLLER_MESSAGES = {
  NO_FILE_UPLOADED: 'No CSV file uploaded',
  INVALID_SOURCE: 'Invalid source type. Must be INTERNAL or EXTERNAL.',
  UPLOAD_FAILED: 'Failed to process file upload',
  SEED_FAILED: 'Failed to seed sample data',
  RESET_SUCCESS: 'Database reset successfully',
  RESET_FAILED: 'Failed to reset database',
  RUN_FAILED: 'Failed to run reconciliation',
  RESOLVE_PARAMS_REQUIRED: 'resolutionType and reason are required',
  RESOLVE_FAILED: 'Failed to save manual resolution',
  FETCH_LATEST_FAILED: 'Failed to fetch latest report',
};

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};
