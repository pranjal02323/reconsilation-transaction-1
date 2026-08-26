import type { UploadSource } from './interfaces';

export const isInternalSource = (source: UploadSource) => source === 'INTERNAL';
