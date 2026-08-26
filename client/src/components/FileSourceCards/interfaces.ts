import type { LoadedFileMeta } from '../../types';

export type UploadSource = 'INTERNAL' | 'EXTERNAL';

export interface FileSourceCardsProps {
  internalFile?: LoadedFileMeta | null;
  externalFile?: LoadedFileMeta | null;
  onUploadSource: (source: UploadSource) => void;
}
