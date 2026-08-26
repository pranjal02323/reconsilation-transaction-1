import type { LoadedFileMeta } from '../../types';

export const getTradeCountLabel = (file: LoadedFileMeta) => `${file.count} trades`;
