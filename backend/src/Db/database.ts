import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { DB_CONFIG, SCHEMA_SQL } from '../Constants/app-constants';

const DB_DIR = path.resolve(process.cwd(), DB_CONFIG.DIR_NAME);
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, DB_CONFIG.FILE_NAME);
export const db = new Database(DB_PATH);

db.pragma(DB_CONFIG.PRAGMA_FOREIGN_KEYS);
db.pragma(DB_CONFIG.PRAGMA_JOURNAL_MODE_WAL);

export function initDatabase() {
  db.exec(SCHEMA_SQL);
}

initDatabase();
