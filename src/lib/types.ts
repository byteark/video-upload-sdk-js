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
  abort(shouldTerminate?: boolean): Promise<UploadJob>;
  pause(): Promise<UploadJob>;
  resume(): Promise<UploadJob>;
}

export type ServiceName = 'byteark.stream' | 'byteark.qoder' | 'tus';

export type CreateUploader = (
  job: UploadJob,
  options: UploadManagerOptions,
  authorizationToken: string,
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
  projectKey: string;
  formId: string;
  formSecret: string;
  headers?: KeyValuePair;
  maximumConcurrentJobs?: number;
}

export interface StreamVideoObject {
  id: string;
  key: string;
  project: {
    key: string;
  };
  projectId: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

export interface VideoObjectsCreatorParams {
  files: File[];
  projectKey: string;
  authorizationToken: string;
}
