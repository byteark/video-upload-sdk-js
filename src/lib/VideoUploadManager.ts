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

  private activeJobList: Map<number, Promise<void>> = new Map();

  private currentJobIndex = -1;

  private currentUploader: UploaderInterface;

  private createUploader: CreateUploader;

  private started: boolean;

  private maximumConcurentJobs: number;

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
    this.maximumConcurentJobs = options.maximumConcurrentJobs || 3;
  }

  /**
   * Replace the options with the new one.
   * @param newOptions New opptions.
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
   * @returns Promise that will resolved after uploading has done.
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
        (this.jobQueue.length <= this.maximumConcurentJobs
          ? this.jobQueue.length
          : this.maximumConcurentJobs);
        index++
      ) {
        this.activeJobList.set(index, this.startUploadJob());
      }
    }
  }

  /**
   * Execute the upload job and remove it from the active list upon completion.
   */
  async startUploadJob(): Promise<void> {
    this.currentJobIndex += 1;

    this.currentUploader = this.createUploader(
      this.jobQueue[this.currentJobIndex],
      this.options,
    );
    await this.currentUploader.start();
    // Clear out finished job.
    this.activeJobList.delete(this.currentJobIndex);
    this.uploadNextJob();
  }

  /**
   * Check whether we can run the next upload job and execute it if possible.
   */
  uploadNextJob(): void {
    if (
      this.activeJobList.size < this.maximumConcurentJobs &&
      this.currentJobIndex < this.jobQueue.length - 1
    ) {
      this.startUploadJob();
    }
  }

  async abort(): Promise<UploadJob> {
    return this.currentUploader.abort();
  }
}
