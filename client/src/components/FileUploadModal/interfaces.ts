export type UploadSource = 'INTERNAL' | 'EXTERNAL';

export interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, source: UploadSource) => void;
  isUploading: boolean;
  source: UploadSource;
}
