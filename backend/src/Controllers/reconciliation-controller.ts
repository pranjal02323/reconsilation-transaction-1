import { Request, Response } from 'express';
import {
  CONTROLLER_MESSAGES,
  HTTP_STATUS,
  SOURCE_TYPE,
} from '../Constants/app-constants';
import {
  getLatestRunReport,
  ingestFile,
  resetDatabase,
  runReconciliation,
  saveManualResolution,
  seedAssignmentSampleData,
} from '../Services/reconciliation-service';

export const seedDataHandler = (req: Request, res: Response) => {
  try {
    const report = seedAssignmentSampleData();
    return res.status(HTTP_STATUS.OK).json(report);
  } catch (error: any) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message || CONTROLLER_MESSAGES.SEED_FAILED,
    });
  }
};

export const resetDatabaseHandler = (req: Request, res: Response) => {
  try {
    resetDatabase();
    return res.status(HTTP_STATUS.OK).json({ message: CONTROLLER_MESSAGES.RESET_SUCCESS });
  } catch (error: any) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message || CONTROLLER_MESSAGES.RESET_FAILED,
    });
  }
};

export const uploadFileHandler = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: CONTROLLER_MESSAGES.NO_FILE_UPLOADED });
    }

    const source = (req.body.source || SOURCE_TYPE.INTERNAL).toUpperCase();
    if (source !== SOURCE_TYPE.INTERNAL && source !== SOURCE_TYPE.EXTERNAL) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: CONTROLLER_MESSAGES.INVALID_SOURCE });
    }

    const content = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname;

    const ingestResult = ingestFile(filename, content, source);
    const runResult = runReconciliation();

    return res.status(HTTP_STATUS.OK).json({
      ingestResult,
      report: runResult,
    });
  } catch (error: any) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message || CONTROLLER_MESSAGES.UPLOAD_FAILED,
    });
  }
};

export const runReconciliationHandler = (req: Request, res: Response) => {
  try {
    const runResult = runReconciliation();
    return res.status(HTTP_STATUS.OK).json(runResult);
  } catch (error: any) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message || CONTROLLER_MESSAGES.RUN_FAILED,
    });
  }
};

export const resolveHandler = (req: Request, res: Response) => {
  try {
    const { internalRefId, externalRefId, resolutionType, reason } = req.body;

    if (!resolutionType || !reason) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        error: CONTROLLER_MESSAGES.RESOLVE_PARAMS_REQUIRED,
      });
    }

    saveManualResolution(internalRefId, externalRefId, resolutionType, reason);
    const runResult = runReconciliation();

    return res.status(HTTP_STATUS.OK).json(runResult);
  } catch (error: any) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message || CONTROLLER_MESSAGES.RESOLVE_FAILED,
    });
  }
};

export const getLatestReportHandler = (req: Request, res: Response) => {
  try {
    const report = getLatestRunReport();
    if (!report) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({ empty: true });
    }
    return res.status(HTTP_STATUS.OK).json(report);
  } catch (error: any) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: error.message || CONTROLLER_MESSAGES.FETCH_LATEST_FAILED,
    });
  }
};
