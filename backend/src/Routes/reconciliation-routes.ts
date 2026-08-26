import { Router } from 'express';
import multer from 'multer';
import {
  RECONCILIATION_ROUTES,
  SERVER_CONFIG,
} from '../Constants/app-constants';
import {
  getLatestReportHandler,
  resetDatabaseHandler,
  resolveHandler,
  runReconciliationHandler,
  seedDataHandler,
  uploadFileHandler,
} from '../Controllers/reconciliation-controller';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: SERVER_CONFIG.MAX_FILE_SIZE_BYTES },
});

router.post(RECONCILIATION_ROUTES.SEED, seedDataHandler);
router.post(RECONCILIATION_ROUTES.RESET, resetDatabaseHandler);
router.post(RECONCILIATION_ROUTES.UPLOAD, upload.single('file'), uploadFileHandler);
router.post(RECONCILIATION_ROUTES.RUN, runReconciliationHandler);
router.post(RECONCILIATION_ROUTES.RESOLVE, resolveHandler);
router.get(RECONCILIATION_ROUTES.LATEST, getLatestReportHandler);

export default router;
