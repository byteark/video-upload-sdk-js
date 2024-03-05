import {
  CreateUploader,
  UploaderInterface,
  UploadJob,
  UploadManagerOptions,
} from './types';
import { createTusUploader } from './uploaders/tus';
// import { delay } from './utils';

type UploadId = string | number;

/**
 * VideoUploadManager will manage video uploading process,
 * to queue and retry the videos to upload, for better experience.
 *
 * To use this manager:
 * 1. Create a new instance of VideoUploadManager
 * 2. Call `addUploadJob` method to add a video into the queue.
 * 3. After adding all videos to upload, call `start` method.
 */
export class VideoUploadManager {
  public readonly uploadIds: UploadId[];

  private jobQueue: UploadJob[];

  private jobsByUploadId: Map<UploadId, UploadJob>;

  private activeUploaderList: Map<UploadId, UploaderInterface> = new Map();

  private pausedUploaderList: Map<UploadId, UploaderInterface> = new Map();

  private currentJobIndex = -1;

  private currentUploader: UploaderInterface;

  private createUploader: CreateUploader;

  private started: boolean;

  private maximumConcurrentJobs: number;

  /**
   *
   * @param options Uploading options
   * @param createUploader Optional parameter to custom how uploader is created. Usually use for testing only.
   */
  constructor(
    private options: UploadManagerOptions,
    createUploader?: CreateUploader,
  ) {
    this.createUploader = createUploader || createTusUploader;
    this.jobQueue = new Array<UploadJob>();
    this.jobsByUploadId = new Map<UploadId, UploadJob>();
    this.maximumConcurrentJobs = options.maximumConcurrentJobs || 3;
  }

  /**
   * Replace the options with the new one.
   * @param newOptions New options.
   */
  setOptions(newOptions: UploadManagerOptions) {
    if (this.started) {
      throw new Error('Cannot set new options when upload manager is running.');
    }

    this.options = newOptions;
  }

  /**
   * Add a upload job to the queue.
   * Use this function to upload a file to existing video resource on ByteArk Stream or Qoder.
   *
   * @param uploadId Upload ID. Use "video.object.source_id" for ByteArk Qoder.
   * @param file File instance to upload
   */
  addUploadJob(uploadId: string | number, file: File): void {
    const job: UploadJob = {
      uploadId,
      file,
      name: file.name,
      status: 'pending',
    };

    this.jobsByUploadId.set(job.uploadId, job);
    this.jobQueue.push(job);
  }

  /**
   * Get existing job by upload id.
   *
   * @param uploadId Upload ID. It'll be "video key" for ByteArk Stream, or "video source id" for ByteArk Qoder.
   * @returns Detail of the upload job
   */
  getJobByUploadId(uploadId: string | number): UploadJob {
    return this.jobsByUploadId.get(uploadId);
  }

  /**
   * Start uploading.
   *
   * @returns Promise that will resolve after uploading has done.
   */
  async start() {
    if (this.started) {
      return;
    }

    this.started = true;

    if (this.started) {
      for (
        let index = 0;
        index <
        (this.jobQueue.length <= this.maximumConcurrentJobs
          ? this.jobQueue.length
          : this.maximumConcurrentJobs);
        index++
      ) {
        this.startUploadJob();
      }
    }
  }

  /**
   * Execute the upload job and remove it from the active list upon completion.
   */
  async startUploadJob(): Promise<void> {
    this.currentJobIndex += 1;
    const currentJob = this.jobQueue[this.currentJobIndex];

    this.currentUploader = this.createUploader(currentJob, this.options);

    this.activeUploaderList.set(currentJob.uploadId, this.currentUploader);

    await this.currentUploader.start();
    // Clear out finished job.
    this.activeUploaderList.delete(currentJob.uploadId);
    this.uploadNextJob();
  }

  async pauseUploadById(uploadId: UploadId): Promise<UploadJob> {
    const jobData = this.jobsByUploadId.get(uploadId);
    const uploader = this.activeUploaderList.get(uploadId);

    if (!jobData) {
      throw new Error(
        `A video with the ID ${uploadId} is not found in job queue.`,
      );
    }
    if (!uploader) {
      throw new Error(`A video with the ID ${uploadId} is not uploading.`);
    }

    // Clear out paused job.
    this.pausedUploaderList.set(uploadId, uploader);
    this.activeUploaderList.delete(uploadId);
    this.uploadNextJob();
    return uploader.pause();
  }

  async resumeUploadById(uploadId: UploadId): Promise<UploadJob> {
    const jobData = this.jobsByUploadId.get(uploadId);
    const uploader = this.pausedUploaderList.get(uploadId);

    if (!jobData) {
      throw new Error(
        `A video with the ID ${uploadId} is not found in job queue.`,
      );
    }
    if (!uploader) {
      throw new Error(`A video with the ID ${uploadId} is not paused.`);
    }

    // Clear out paused job.
    this.activeUploaderList.set(uploadId, uploader);
    this.pausedUploaderList.delete(uploadId);
    return uploader.resume();
  }

  /**
   * Check whether we can run the next upload job and execute it if possible.
   */
  uploadNextJob(): void {
    if (
      this.activeUploaderList.size < this.maximumConcurrentJobs &&
      this.currentJobIndex < this.jobQueue.length - 1
    ) {
      this.startUploadJob();
    }
  }

  async cancelUploadById(uploadId: UploadId): Promise<UploadJob> {
    const uploader = this.activeUploaderList.get(uploadId);
    this.activeUploaderList.delete(uploadId);
    this.uploadNextJob();
    return uploader.abort(true);
  }
}
