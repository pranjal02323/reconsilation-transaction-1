import {
  COMPARISON_EPSILON,
  DEFAULT_TOLERANCE_CONFIG,
  MANUAL_RESOLUTION_TYPE,
  MATCH_FIELDS,
  MATCH_STATUS,
  SUMMARY_NOTES,
  TRANSACTION_STATUS,
} from '../Constants/app-constants';
import {
  FieldDiff,
  ManualResolution,
  MatchResultStatus,
  NormalizedTransaction,
  ReconciliationMatch,
  ToleranceConfig,
} from '../Types/reconciliation-types';

export function compareTransactions(
  internalRecord: NormalizedTransaction,
  externalRecord: NormalizedTransaction,
  config: ToleranceConfig = DEFAULT_TOLERANCE_CONFIG
): { status: MatchResultStatus; diffs: FieldDiff[]; summaryNote: string } {
  const diffs: FieldDiff[] = [];
  let isExact = true;
  let isTolerated = true;

  if (internalRecord.instrument !== externalRecord.instrument) {
    diffs.push({
      field: MATCH_FIELDS.INSTRUMENT,
      internalValue: internalRecord.instrument,
      externalValue: externalRecord.instrument,
      isWithinTolerance: false,
      message: `Instrument mismatch: ${internalRecord.instrument} vs ${externalRecord.instrument}`,
    });
    isExact = false;
    isTolerated = false;
  }

  if (internalRecord.side !== externalRecord.side) {
    diffs.push({
      field: MATCH_FIELDS.SIDE,
      internalValue: internalRecord.side,
      externalValue: externalRecord.side,
      isWithinTolerance: false,
      message: `Side mismatch: ${internalRecord.side} vs ${externalRecord.side}`,
    });
    isExact = false;
    isTolerated = false;
  }

  const amountDelta = Math.abs(internalRecord.grossAmount - externalRecord.grossAmount);
  if (amountDelta > COMPARISON_EPSILON) {
    isExact = false;
    const withinTolerance = amountDelta <= config.amountTolerance;
    if (!withinTolerance) {
      isTolerated = false;
    }
    diffs.push({
      field: MATCH_FIELDS.GROSS_AMOUNT,
      internalValue: internalRecord.grossAmount,
      externalValue: externalRecord.grossAmount,
      delta: Math.round(amountDelta * 100) / 100,
      isWithinTolerance: withinTolerance,
      message: withinTolerance
        ? `Minor amount variance of $${amountDelta.toFixed(2)} (within tolerance)`
        : `Gross amount discrepancy of $${amountDelta.toFixed(2)}`,
    });
  }

  const qtyDelta = Math.abs(internalRecord.quantity - externalRecord.quantity);
  if (qtyDelta > COMPARISON_EPSILON) {
    isExact = false;
    isTolerated = false;
    diffs.push({
      field: MATCH_FIELDS.QUANTITY,
      internalValue: internalRecord.quantity,
      externalValue: externalRecord.quantity,
      delta: qtyDelta,
      isWithinTolerance: false,
      message: `Quantity mismatch: ${internalRecord.quantity} vs ${externalRecord.quantity}`,
    });
  }

  const internalTime = new Date(internalRecord.tradedAt).getTime();
  const externalTime = new Date(externalRecord.tradedAt).getTime();
  const timeDeltaSeconds = Math.abs(internalTime - externalTime) / 1000;

  if (timeDeltaSeconds > 0) {
    isExact = false;
    const withinTolerance = timeDeltaSeconds <= config.timestampToleranceSeconds;
    if (!withinTolerance) {
      isTolerated = false;
    }
    diffs.push({
      field: MATCH_FIELDS.TRADED_AT,
      internalValue: internalRecord.tradedAt,
      externalValue: externalRecord.tradedAt,
      delta: Math.round(timeDeltaSeconds),
      isWithinTolerance: withinTolerance,
      message: withinTolerance
        ? `Timestamp drift of ${Math.round(timeDeltaSeconds / 60)} minutes (within tolerance)`
        : `Timestamp discrepancy of ${Math.round(timeDeltaSeconds / 60)} minutes`,
    });
  }

  let status: MatchResultStatus = MATCH_STATUS.EXACT_MATCH;
  let summaryNote = SUMMARY_NOTES.EXACT_MATCH;

  if (!isExact && isTolerated) {
    status = MATCH_STATUS.TOLERATED_MATCH;
    summaryNote = SUMMARY_NOTES.TOLERATED_MATCH;
  } else if (!isTolerated) {
    status = MATCH_STATUS.DISCREPANCY;
    summaryNote = SUMMARY_NOTES.DISCREPANCY;
  }

  return { status, diffs, summaryNote };
}

export function reconcileTransactions(
  internalRecords: NormalizedTransaction[],
  externalRecords: NormalizedTransaction[],
  manualResolutions: ManualResolution[] = [],
  config: ToleranceConfig = DEFAULT_TOLERANCE_CONFIG
): ReconciliationMatch[] {
  const results: ReconciliationMatch[] = [];

  const forceMatchMap = new Map<string, ManualResolution>();
  const acceptedUnmatchedSet = new Set<string>();
  const ignoredSet = new Set<string>();

  for (const res of manualResolutions) {
    if (res.resolutionType === MANUAL_RESOLUTION_TYPE.FORCE_MATCH && res.internalRefId && res.externalRefId) {
      forceMatchMap.set(res.internalRefId, res);
      forceMatchMap.set(res.externalRefId, res);
    } else if (res.resolutionType === MANUAL_RESOLUTION_TYPE.ACCEPT_UNMATCHED) {
      if (res.internalRefId) acceptedUnmatchedSet.add(res.internalRefId);
      if (res.externalRefId) acceptedUnmatchedSet.add(res.externalRefId);
    } else if (res.resolutionType === MANUAL_RESOLUTION_TYPE.IGNORE) {
      if (res.internalRefId) ignoredSet.add(res.internalRefId);
      if (res.externalRefId) ignoredSet.add(res.externalRefId);
    }
  }

  const activeInternal = internalRecords.filter((r) => r.isLatest !== false);
  const activeExternal = externalRecords.filter((r) => r.isLatest !== false);

  const externalByRef = new Map<string, NormalizedTransaction>();
  for (const ext of activeExternal) {
    externalByRef.set(ext.externalRefId, ext);
  }

  const processedExternalRefs = new Set<string>();

  for (const intRecord of activeInternal) {
    if (intRecord.status === TRANSACTION_STATUS.CANCELLED || ignoredSet.has(intRecord.externalRefId)) {
      results.push({
        id: `match-cancelled-${intRecord.id}`,
        internalRecord: intRecord,
        status: MATCH_STATUS.IGNORED_CANCELLED,
        diffs: [],
        summaryNote: SUMMARY_NOTES.CANCELLED_IGNORED,
      });
      continue;
    }

    const forceMatch = forceMatchMap.get(intRecord.externalRefId);
    if (forceMatch && forceMatch.externalRefId) {
      const extRecord = externalByRef.get(forceMatch.externalRefId);
      if (extRecord) {
        processedExternalRefs.add(extRecord.externalRefId);
        results.push({
          id: `match-manual-${intRecord.id}-${extRecord.id}`,
          internalRecord: intRecord,
          externalRecord: extRecord,
          status: MATCH_STATUS.MANUALLY_RESOLVED,
          diffs: [],
          summaryNote: `Manually matched by operator: ${forceMatch.reason}`,
          manualResolutionDetails: {
            resolutionType: forceMatch.resolutionType,
            reason: forceMatch.reason,
          },
        });
        continue;
      }
    }

    if (acceptedUnmatchedSet.has(intRecord.externalRefId)) {
      results.push({
        id: `match-accepted-${intRecord.id}`,
        internalRecord: intRecord,
        status: MATCH_STATUS.MANUALLY_RESOLVED,
        diffs: [],
        summaryNote: SUMMARY_NOTES.ACCEPTED_STANDALONE,
        manualResolutionDetails: {
          resolutionType: MANUAL_RESOLUTION_TYPE.ACCEPT_UNMATCHED,
          reason: 'Accepted as valid standalone entry',
        },
      });
      continue;
    }

    const extRecord = externalByRef.get(intRecord.externalRefId);

    if (extRecord) {
      processedExternalRefs.add(extRecord.externalRefId);

      if (extRecord.status === TRANSACTION_STATUS.CANCELLED) {
        results.push({
          id: `match-cancelled-ext-${extRecord.id}`,
          internalRecord: intRecord,
          externalRecord: extRecord,
          status: MATCH_STATUS.IGNORED_CANCELLED,
          diffs: [],
          summaryNote: SUMMARY_NOTES.CANCELLED_COUNTERPARTY,
        });
        continue;
      }

      const comparison = compareTransactions(intRecord, extRecord, config);
      results.push({
        id: `match-${intRecord.id}-${extRecord.id}`,
        internalRecord: intRecord,
        externalRecord: extRecord,
        status: comparison.status,
        diffs: comparison.diffs,
        summaryNote: comparison.summaryNote,
      });
    } else {
      results.push({
        id: `unmatched-int-${intRecord.id}`,
        internalRecord: intRecord,
        status: MATCH_STATUS.UNMATCHED_INTERNAL,
        diffs: [],
        summaryNote: SUMMARY_NOTES.UNMATCHED_INTERNAL,
      });
    }
  }

  for (const extRecord of activeExternal) {
    if (processedExternalRefs.has(extRecord.externalRefId)) {
      continue;
    }

    if (extRecord.status === TRANSACTION_STATUS.CANCELLED || ignoredSet.has(extRecord.externalRefId)) {
      results.push({
        id: `match-cancelled-${extRecord.id}`,
        externalRecord: extRecord,
        status: MATCH_STATUS.IGNORED_CANCELLED,
        diffs: [],
        summaryNote: SUMMARY_NOTES.CANCELLED_EXTERNAL,
      });
      continue;
    }

    if (acceptedUnmatchedSet.has(extRecord.externalRefId)) {
      results.push({
        id: `match-accepted-${extRecord.id}`,
        externalRecord: extRecord,
        status: MATCH_STATUS.MANUALLY_RESOLVED,
        diffs: [],
        summaryNote: SUMMARY_NOTES.ACCEPTED_STANDALONE_EXTERNAL,
        manualResolutionDetails: {
          resolutionType: MANUAL_RESOLUTION_TYPE.ACCEPT_UNMATCHED,
          reason: 'Accepted as valid standalone entry',
        },
      });
      continue;
    }

    results.push({
      id: `unmatched-ext-${extRecord.id}`,
      externalRecord: extRecord,
      status: MATCH_STATUS.UNMATCHED_EXTERNAL,
      diffs: [],
      summaryNote: SUMMARY_NOTES.UNMATCHED_EXTERNAL,
    });
  }

  return results;
}
