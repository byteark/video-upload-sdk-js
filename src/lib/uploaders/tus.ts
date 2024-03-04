import { DetailedError, Upload } from 'tus-js-client';

import {
  KeyValuePair,
  UploaderInterface,
  UploadJob,
  UploadManagerOptions,
} from '../types';
import { makeProgressPercent } from '../utils';

export class TusUploader implements UploaderInterface {
  defaultRetryDelays = [
    0, 5000, 5000, 10000, 10000, 15000, 15000, 20000, 20000, 30000, 30000,
  ];

  constructor(
    private job: UploadJob,
    private options: UploadManagerOptions,
  ) {}

  async start(): Promise<UploadJob> {
    return new Promise<UploadJob>((resolve, reject) => {
      const upload = new Upload(this.job.file, {
        storeFingerprintForResuming: false,
        endpoint: this.createEndpointUrl(),
        uploadUrl: this.createUploadUrl(),
        headers: this.createHeaders(),
        metadata: this.createMetadata(this.job),
        retryDelays: this.defaultRetryDelays,
        onBeforeRequest: (req) => {
          if (this.options.authorizationToken) {
            const xhr = req.getUnderlyingObject();
            xhr.withCredentials = true;
          }
        },
        onShouldRetry: (error) => this.onShouldRetry(error),
        onProgress: (...args) => this.onProgress(...args),
        onSuccess: (...args) => {
          this.onSuccess(...args);
          resolve(this.job);
        },
        onError: (error: Error | DetailedError) => {
          this.onError(error);
          reject(error);
        },
      });

      upload.start();
      this.job.status = 'uploading';
    });
  }

  createEndpointUrl(): string {
    switch (this.options.serviceName) {
      case 'byteark.stream':
        return `${this.options.serviceEndpoint}/api/upload/v1/tus/videos`;
      case 'byteark.qoder':
        return null;
      case 'tus':
      default:
        return this.options.serviceEndpoint;
    }
  }

  createUploadUrl(): string {
    switch (this.options.serviceName) {
      case 'byteark.qoder':
        return `${this.options.serviceEndpoint}/video-source-file/${this.job.uploadId}`;
      case 'tus':
      default:
        return null;
    }
  }

  createHeaders(): KeyValuePair {
    if (!this.options.authorizationToken && !this.options.headers) {
      return {};
    }

    if (this.options.authorizationToken) {
      return {
        ...(this.options.headers || {}),
        Authorization: `Bearer ${this.options.authorizationToken}`,
      };
    }

    return {
      ...(this.options.headers || {}),
    };
  }

  createMetadata(job: UploadJob): KeyValuePair {
    if (this.options.serviceName == 'byteark.stream') {
      return {
        filename: job.file.name,
        filetype: job.file.type,
        videoKey: `${job.uploadId}`,
      };
    }

    return {
      filename: job.file.name,
      filetype: job.file.type,
    };
  }

  onProgress(bytesUploaded: number, bytesTotal: number): void {
    this.job.status = 'uploading';
    this.job.progress = {
      bytesUploaded,
      bytesTotal,
      percent: makeProgressPercent(bytesUploaded, bytesTotal),
    };

    if (!this.options.onUploadProgress) {
      return;
    }

    this.triggerCallback(() =>
      this.options.onUploadProgress(this.job, this.job.progress),
    );
  }

  onSuccess(): void {
    this.job.status = 'completed';

    if (!this.options.onUploadCompleted) {
      return;
    }

    this.triggerCallback(() => this.options.onUploadCompleted(this.job));
  }

  onError(error: Error | DetailedError): void {
    this.job.status = 'failed';

    if (this.options.onUploadFailed) {
      return;
    }

    this.triggerCallback(() => this.options.onUploadFailed(this.job, error));
  }

  onShouldRetry(error: Error | DetailedError): boolean {
    console.error('Error when uploading', error);

    // if (error instanceof Error) {
    //   return true;
    // }

    if (error instanceof DetailedError) {
      const responseStatus = error.originalResponse
        ? error.originalResponse.getStatus()
        : 0;
      if (responseStatus === 403) {
        return false;
      }
    }

    return true;
  }

  triggerCallback(callback: () => void): void {
    try {
      callback.call(this);
    } catch (callbackError: unknown) {
      console.warn(
        '[ByteArkStreamVideoUploadSDKJS] Error occurs when trigger callback',
        callbackError,
      );
    }
  }
}

export function createTusUploader(
  job: UploadJob,
  options: UploadManagerOptions,
): TusUploader {
  return new TusUploader(job, options);
}
