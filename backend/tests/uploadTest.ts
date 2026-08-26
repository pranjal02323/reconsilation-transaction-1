import fs from 'fs';
import path from 'path';
import { ingestFile, resetDatabase, runReconciliation } from '../src/services/reconciliationService';

console.log('--- RESETTING DATABASE ---');
resetDatabase();

const ledgerPath = path.resolve('../sample_data/ledger_day1.csv');
const statementPath = path.resolve('../sample_data/statement_day1.csv');

const ledgerContent = fs.readFileSync(ledgerPath, 'utf-8');
const statementContent = fs.readFileSync(statementPath, 'utf-8');

console.log('1. Ingesting Internal Ledger file...');
ingestFile('ledger_day1.csv', ledgerContent, 'INTERNAL');

console.log('2. Ingesting External Statement file...');
ingestFile('statement_day1.csv', statementContent, 'EXTERNAL');

console.log('3. Running Reconciliation Engine...');
const report = runReconciliation();

console.log('\n✅ FILE INGESTION SUCCESS SUMMARY:');
console.log('Loaded Files:', JSON.stringify(report.files, null, 2));
console.log('Reconciliation Counts:', {
  exact: report.summary.exactMatchesCount,
  tolerated: report.summary.toleratedMatchesCount,
  discrepancy: report.summary.discrepanciesCount,
  unmatchedInt: report.summary.unmatchedInternalCount,
  unmatchedExt: report.summary.unmatchedExternalCount,
  cancelledIgnored: report.summary.cancelledIgnoredCount,
});
