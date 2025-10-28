import { DetailedError } from 'tus-js-client';

export type UploadJobStatus =
  | 'pending'
  | 'uploading'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused';

export type AcceptableFiles = FileList | File[];

export interface VideoTag {
  name: string;
}

export interface VideoFileObject {
  file: File;
  videoMetadata: Record<string, unknown> & {
    title?: string;
    tags?: VideoTag[];
  };
  useOverlayPreset?: boolean;
}

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

export type ServiceName = 'byteark.stream' | 'byteark.qoder';

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
  onVideosCreated?: (videoKeys: string[]) => void | Promise<void>;
}

export interface UploadManagerOptions extends UploadManagerCallbacks {
  serviceName: ServiceName;
  serviceEndpoint?: string;
  projectKey: string;
  formId: string;
  formSecret: string;
  headers?: KeyValuePair;
  maximumConcurrentJobs?: number;
  overlayPresetId?: string;
}

export interface StreamVideoObject {
  id: string;
  key: string;
  project: {
    key: string;
  };
  title: string;
  updatedAt: string;
  createdAt: string;
}

export interface QoderVideoObject {
  id: string;
  key: string;
  project: {
    key: string;
  };
  projectId: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  object: {
    source: {
      id: string;
    };
  };
}

export interface VideoObjectsCreatorProps {
  appId?: string;
  authorizationToken: string;
  files: VideoFileObject[] | AcceptableFiles;
  projectKey: string;
  serviceName: ServiceName;
  overlayPresetId?: string;
}

export type StreamRequestBody = {
  projectKey: string;
  videos: ({
    source: {
      type: string;
      size: number;
      fileName: string;
    };
  } & Record<string, unknown>)[];
  overlayPresetId?: string;
};

export type QoderRequestBody = {
  videos: {
    title: string;
    size: number;
    project: {
      id: string;
    };
  }[];
};
