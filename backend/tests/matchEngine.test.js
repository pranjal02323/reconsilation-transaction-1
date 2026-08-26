import { describe, expect, it } from 'vitest';
import { compareTransactions, reconcileTransactions } from '../src/domain/matchEngine.js';
import { parseFileContent, parseSide, parseTimestamp } from '../src/domain/parsers.js';
describe('Financial Reconciliation Engine (Pure Unit Tests)', () => {
    describe('Parser & Normalizer Tests', () => {
        it('normalizes side variations correctly', () => {
            expect(parseSide('BUY')).toBe('BUY');
            expect(parseSide('B')).toBe('BUY');
            expect(parseSide('PURCHASE')).toBe('BUY');
            expect(parseSide('SELL')).toBe('SELL');
            expect(parseSide('S')).toBe('SELL');
        });
        it('normalizes timestamp formats correctly', () => {
            const iso = parseTimestamp('2025-07-01T09:15:00Z');
            const sqlDate = parseTimestamp('2025-07-01 09:15:00');
            expect(iso).toBe(sqlDate);
        });
        it('parses sample assignment ledger CSV properly', () => {
            const csv = `trade_id,traded_at,instrument,side,quantity,price,gross_amount,state
T-1001,2025-07-01T09:15:00Z,BTC-USD,BUY,0.50,62000.00,31000.00,SETTLED
T-1018,2025-07-06T15:00:00Z,SOL-USD,BUY,100.00,149.00,14900.00,CANCELLED`;
            const records = parseFileContent(csv, 'INTERNAL');
            expect(records).toHaveLength(2);
            expect(records[0].externalRefId).toBe('T-1001');
            expect(records[0].side).toBe('BUY');
            expect(records[0].status).toBe('SETTLED');
            expect(records[1].status).toBe('CANCELLED');
        });
        it('parses sample assignment counterparty statement CSV properly', () => {
            const csv = `reference,executed_at,symbol,direction,qty,unit_price,total,status
T-1001,2025-07-01 09:15:00,BTC-USD,B,0.5,62000,31000.00,SETTLED
C-9001,2025-07-06 11:20:00,BTC-USD,B,0.15,63100,9465.00,SETTLED`;
            const records = parseFileContent(csv, 'EXTERNAL');
            expect(records).toHaveLength(2);
            expect(records[0].externalRefId).toBe('T-1001');
            expect(records[0].side).toBe('BUY');
            expect(records[1].externalRefId).toBe('C-9001');
        });
    });
    describe('Comparison Logic Tests', () => {
        const baseInternal = {
            id: 'int-1',
            source: 'INTERNAL',
            externalRefId: 'T-1001',
            tradedAt: '2025-07-01T09:15:00.000Z',
            instrument: 'BTC-USD',
            side: 'BUY',
            quantity: 0.5,
            unitPrice: 62000,
            grossAmount: 31000,
            status: 'SETTLED',
            isLatest: true,
        };
        it('flags identical transactions as EXACT_MATCH', () => {
            const external = { ...baseInternal, source: 'EXTERNAL', id: 'ext-1' };
            const result = compareTransactions(baseInternal, external);
            expect(result.status).toBe('EXACT_MATCH');
            expect(result.diffs).toHaveLength(0);
        });
        it('flags minor amount differences (e.g., $0.02 fee) as TOLERATED_MATCH', () => {
            const external = {
                ...baseInternal,
                source: 'EXTERNAL',
                id: 'ext-1',
                grossAmount: 31000.02,
            };
            const result = compareTransactions(baseInternal, external, { amountTolerance: 0.05, timestampToleranceSeconds: 3600 });
            expect(result.status).toBe('TOLERATED_MATCH');
            expect(result.diffs).toHaveLength(1);
            expect(result.diffs[0].field).toBe('grossAmount');
            expect(result.diffs[0].isWithinTolerance).toBe(true);
        });
        it('flags 25 minute timestamp drift as TOLERATED_MATCH', () => {
            const external = {
                ...baseInternal,
                source: 'EXTERNAL',
                id: 'ext-1',
                tradedAt: '2025-07-01T09:40:00.000Z', // +25 minutes
            };
            const result = compareTransactions(baseInternal, external, { amountTolerance: 0.05, timestampToleranceSeconds: 3600 });
            expect(result.status).toBe('TOLERATED_MATCH');
            expect(result.diffs).toHaveLength(1);
            expect(result.diffs[0].field).toBe('tradedAt');
        });
        it('flags significant price difference as DISCREPANCY', () => {
            const external = {
                ...baseInternal,
                source: 'EXTERNAL',
                id: 'ext-1',
                grossAmount: 34170.0, // Major difference
            };
            const result = compareTransactions(baseInternal, external, { amountTolerance: 0.05, timestampToleranceSeconds: 3600 });
            expect(result.status).toBe('DISCREPANCY');
            expect(result.diffs[0].isWithinTolerance).toBe(false);
        });
    });
    describe('Full Batch Reconciliation Tests', () => {
        it('correctly reconciles internal ledger vs counterparty statement', () => {
            const internalCSV = `trade_id,traded_at,instrument,side,quantity,price,gross_amount,state
T-1001,2025-07-01T09:15:00Z,BTC-USD,BUY,0.50,62000.00,31000.00,SETTLED
T-1011,2025-07-04T10:15:00Z,ETH-USD,BUY,10.00,3400.00,34000.00,SETTLED
T-1018,2025-07-06T15:00:00Z,SOL-USD,BUY,100.00,149.00,14900.00,CANCELLED`;
            const externalCSV = `reference,executed_at,symbol,direction,qty,unit_price,total,status
T-1001,2025-07-01 09:15:00,BTC-USD,B,0.5,62000,31000.00,SETTLED
T-1011,2025-07-04 10:15:00,ETH-USD,B,10,3417,34170.00,SETTLED
C-9001,2025-07-06 11:20:00,BTC-USD,B,0.15,63100,9465.00,SETTLED`;
            const internalRecords = parseFileContent(internalCSV, 'INTERNAL');
            const externalRecords = parseFileContent(externalCSV, 'EXTERNAL');
            const matches = reconcileTransactions(internalRecords, externalRecords);
            expect(matches).toHaveLength(4);
            // T-1001 -> Exact Match
            const match1001 = matches.find((m) => m.internalRecord?.externalRefId === 'T-1001');
            expect(match1001?.status).toBe('EXACT_MATCH');
            // T-1011 -> Discrepancy ($34,000 vs $34,170)
            const match1011 = matches.find((m) => m.internalRecord?.externalRefId === 'T-1011');
            expect(match1011?.status).toBe('DISCREPANCY');
            // T-1018 -> Cancelled
            const match1018 = matches.find((m) => m.internalRecord?.externalRefId === 'T-1018');
            expect(match1018?.status).toBe('IGNORED_CANCELLED');
            // C-9001 -> Unmatched External
            const matchC9001 = matches.find((m) => m.externalRecord?.externalRefId === 'C-9001');
            expect(matchC9001?.status).toBe('UNMATCHED_EXTERNAL');
        });
        it('persists manual resolutions over subsequent runs', () => {
            const internalRecords = [
                {
                    id: 'int-1',
                    source: 'INTERNAL',
                    externalRefId: 'T-9999',
                    tradedAt: '2025-07-01T09:15:00.000Z',
                    instrument: 'BTC-USD',
                    side: 'BUY',
                    quantity: 1,
                    unitPrice: 50000,
                    grossAmount: 50000,
                    status: 'SETTLED',
                    isLatest: true,
                },
            ];
            const externalRecords = [
                {
                    id: 'ext-1',
                    source: 'EXTERNAL',
                    externalRefId: 'EXT-8888',
                    tradedAt: '2025-07-01T09:15:00.000Z',
                    instrument: 'BTC-USD',
                    side: 'BUY',
                    quantity: 1,
                    unitPrice: 50000,
                    grossAmount: 50000,
                    status: 'SETTLED',
                    isLatest: true,
                },
            ];
            // Initially unmatched
            let matches = reconcileTransactions(internalRecords, externalRecords, []);
            expect(matches.some((m) => m.status === 'UNMATCHED_INTERNAL')).toBe(true);
            // Now apply manual resolution (Force Pair T-9999 with EXT-8888)
            const manualResolutions = [
                {
                    id: 'res-1',
                    internalRefId: 'T-9999',
                    externalRefId: 'EXT-8888',
                    resolutionType: 'FORCE_MATCH',
                    reason: 'Verified manually via phone call',
                    createdAt: new Date().toISOString(),
                },
            ];
            matches = reconcileTransactions(internalRecords, externalRecords, manualResolutions);
            const manualMatch = matches.find((m) => m.status === 'MANUALLY_RESOLVED');
            expect(manualMatch).toBeDefined();
            expect(manualMatch?.internalRecord?.externalRefId).toBe('T-9999');
            expect(manualMatch?.externalRecord?.externalRefId).toBe('EXT-8888');
        });
    });
});
