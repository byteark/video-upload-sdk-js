import { DetailedError, Upload } from 'tus-js-client';

import {
  AcceptableFileInfo,
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

  defaultChunkSize = 100 * 1000 * 1000;

  private currentUploader: Upload;

  constructor(
    private job: UploadJob,
    private options: UploadManagerOptions,
    private authorizationToken: string,
    private fileResolver: (file: unknown) => Promise<AcceptableFileInfo>,
  ) {}

  async start(): Promise<UploadJob> {
    let isUploadStarted = false;

    return new Promise<UploadJob>(async (resolve, reject) => {
      const fileContext = await this.fileResolver(this.job.file);
      this.currentUploader = new Upload(fileContext.file, {
        storeFingerprintForResuming: false,
        endpoint: this.createEndpointUrl(),
        uploadUrl: this.createUploadUrl(),
        headers: this.createHeaders(),
        metadata: this.createMetadata(this.job, fileContext),
        retryDelays: this.defaultRetryDelays,
        chunkSize: this.defaultChunkSize,
        onBeforeRequest: (req) => {
          if (this.authorizationToken) {
            const xhr = req.getUnderlyingObject();
            xhr.withCredentials = true;
          }

          if (!isUploadStarted) {
            isUploadStarted = true;

            if (typeof this.options.onUploadStarted === 'function') {
              this.options.onUploadStarted(this.job);
            }
          }
        },
        onShouldRetry: (error) => this.onShouldRetry(error),
        onProgress: (...args) => this.onProgress(...args),
        onSuccess: () => {
          this.onSuccess();
          resolve(this.job);
        },
        onError: (error: Error | DetailedError) => {
          this.onError(error);
          reject(error);
        },
      });

      this.currentUploader.start();
      this.job.status = 'uploading';
    });
  }

  /**
   * @param shouldTerminate true when allow resuming upload later, false when cancelling upload.
   */
  async abort(shouldTerminate = false): Promise<UploadJob> {
    return new Promise<UploadJob>((resolve) => {
      this.currentUploader.abort(shouldTerminate);
      this.job.status = shouldTerminate ? 'cancelled' : 'paused';
      resolve(this.job);
    });
  }

  async pause(): Promise<UploadJob> {
    return new Promise<UploadJob>(() => {
      return this.abort(false);
    });
  }

  async resume(): Promise<UploadJob> {
    return new Promise<UploadJob>((resolve) => {
      this.currentUploader.start();
      this.job.status = 'uploading';
      resolve(this.job);
    });
  }

  createEndpointUrl(): string {
    switch (this.options.serviceName) {
      case 'byteark.stream':
        return `${this.options.serviceEndpoint}/api/upload/v1/tus/videos`;
      case 'byteark.qoder':
        return null;
      default:
        return this.options.serviceEndpoint;
    }
  }

  createUploadUrl(): string {
    switch (this.options.serviceName) {
      case 'byteark.qoder':
        return `${this.options.serviceEndpoint}/video-source-file/${this.job.uploadId}`;
      default:
        return null;
    }
  }

  createHeaders(): KeyValuePair {
    if (!this.authorizationToken && !this.options.headers) {
      return {};
    }

    if (this.authorizationToken) {
      return {
        ...(this.options.headers || {}),
        Authorization: `Bearer ${this.authorizationToken}`,
      };
    }

    return {
      ...(this.options.headers || {}),
    };
  }

  createMetadata(job: UploadJob, fileInfo: AcceptableFileInfo): KeyValuePair {
    if (this.options.serviceName == 'byteark.stream') {
      return {
        filename: fileInfo.fileName,
        filetype: fileInfo.fileType,
        videoKey: `${job.uploadId}`,
      };
    }

    return {
      filename: fileInfo.fileName,
      filetype: fileInfo.fileType,
    };
  }

  onProgress(bytesUploaded: number, bytesTotal: number): void {
    this.job.status = 'uploading';

    const progress = Object.freeze({
      bytesUploaded,
      bytesTotal,
      percent: makeProgressPercent(bytesUploaded, bytesTotal),
    });

    const job = Object.freeze({
      ...this.job,
      progress,
    });

    this.job.progress = progress;

    if (!this.options.onUploadProgress) {
      return;
    }

    this.triggerCallback(() => this.options.onUploadProgress(job, progress));
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
    if (error instanceof DetailedError) {
      const responseStatus = error.originalResponse
        ? error.originalResponse.getStatus()
        : 0;

      // TUS will automatically retry terminating upload if the responseStatus is 423
      if (responseStatus !== 423) {
        console.error('Error when uploading', error);
      }

      if (responseStatus === 403) {
        return false;
      }

      /**
       * This error will be thrown after aborting and terminating upload.
       * Allow TUS to retry until the server returns 204 No Content.
       */
      if (responseStatus === 423) {
        return true;
      }
    }

    console.error('Error when uploading', error);
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
