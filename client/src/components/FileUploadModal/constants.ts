import type { UploadSource } from './interfaces';

export const UPLOAD_SOURCE_COPY: Record<UploadSource, { title: string; description: string; target: string }> = {
  INTERNAL: {
    title: 'Upload Internal Ledger (System A)',
    description: 'Ingest your company ledger CSV (trade_id, price, amount, state)',
    target: 'Target: Internal Ledger',
  },
  EXTERNAL: {
    title: 'Upload External Statement (System B)',
    description: 'Ingest counterparty broker CSV (reference, unit_price, total, status)',
    target: 'Target: Counterparty Statement',
  },
};
