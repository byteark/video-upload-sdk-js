import { RequestInfo, UploadJob, UploadManagerOptions } from '../types';

export function qoderUploadRequestInfoBuilder(job: UploadJob, options: UploadManagerOptions): RequestInfo {
  return {
    url: `${options.serviceEndpoint}/video-source-files/${job.uploadId}`,
  };
}

export function tusdUploadRequestInfoBuilder(_: UploadJob, options: UploadManagerOptions): RequestInfo {
  return {
    url: options.serviceEndpoint,
  };
}
