import { DetailedError } from 'tus-js-client';

export type UploadJobStatus =
  | 'pending'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

export interface UploadJob {
  uploadId: string | number;
  file: File;
  name: string;
  status: UploadJobStatus;
  progress?: UploadProgress;
}

export interface UploadProgress {
  bytesUploaded: number;
  bytesTotal: number;
  percent: number;
}

export interface RequestInfo {
  url: string;
}

export interface UploaderInterface {
  start(): Promise<UploadJob>;
  abort(): Promise<UploadJob>;
  pause(): Promise<UploadJob>;
  resume(): Promise<UploadJob>;
}

export type ServiceName = 'byteark.stream' | 'byteark.qoder' | 'tus';

export type CreateUploader = (
  job: UploadJob,
  options: UploadManagerOptions,
) => UploaderInterface;

export interface KeyValuePair {
  [key: string]: string;
}

export interface UploadManagerCallbacks {
  onUploadStarted?: (job: UploadJob) => void;
  onUploadProgress?: (job: UploadJob, progress: UploadProgress) => void;
  onUploadCompleted?: (job: UploadJob) => void;
  onUploadFailed?: (job: UploadJob, error: Error | DetailedError) => void;
}

export interface UploadManagerOptions extends UploadManagerCallbacks {
  serviceName: ServiceName;
  serviceEndpoint: string;
  authorizationToken?: string;
  headers?: KeyValuePair;
  maximumConcurrentJobs?: number;
}
