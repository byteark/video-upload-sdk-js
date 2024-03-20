import { getStreamAccessToken, videoObjectsCreator } from './services';
import {
  CreateUploader,
  UploaderInterface,
  UploadJob,
  UploadManagerOptions,
} from './types';
import { createTusUploader } from './uploaders';
import { signJWTToken, transformVideoObjectsToJobList } from './utils';
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
  private jobQueue: UploadJob[] = [];

  private jobsByUploadId: Map<UploadId, UploadJob>;

  private activeUploaderList: Map<UploadId, UploaderInterface> = new Map();

  private pausedUploaderList: Map<UploadId, UploaderInterface> = new Map();

  private currentJobIndex = -1;

  private currentUploader: UploaderInterface;

  private readonly createUploader: CreateUploader;

  private started: boolean;

  private maximumConcurrentJobs: number;

  private authorizationToken: string;

  /**
   *
   * @param options Uploading options
   * @param createUploader Optional parameter to custom how uploader is created. Usually use for testing only.
   */
  constructor(
    private options: UploadManagerOptions,
    createUploader?: CreateUploader,
  ) {
    if (options === undefined || options === null) {
      throw new Error("VideoUploadManager requires an 'options' parameter.");
    }

    if (typeof options !== 'object') {
      throw new Error("An 'options' parameter needs to be an object.");
    }

    const requiredOptionFields = ['serviceName', 'serviceEndpoint'];
    const missingRequiredOptions = requiredOptionFields.filter(
      (option) => !options[option],
    );

    if (missingRequiredOptions.length > 0) {
      throw new Error(
        `${missingRequiredOptions.join(' and ')} ${missingRequiredOptions.length > 1 ? 'are' : 'is'} required in the option parameter.`,
      );
    }

    this.createUploader = createUploader || createTusUploader;
    this.jobQueue = new Array<UploadJob>();
    this.jobsByUploadId = new Map<UploadId, UploadJob>();
    this.started = false;
    this.maximumConcurrentJobs = options.maximumConcurrentJobs || 3;
    this.getAuthorizationToken();
  }

  async getAuthorizationToken(validPeriodInHour?: number) {
    if (!this.options.formSecret) {
      return;
    }

    const jwtToken = await signJWTToken(
      this.options.formSecret,
      validPeriodInHour,
    );

    if (this.options.serviceName === 'byteark.stream') {
      this.authorizationToken = await getStreamAccessToken(
        this.options.formId,
        jwtToken,
      );
    } else {
      this.authorizationToken = jwtToken;
    }
  }

  /**
   * Replace the options with the new one.
   * @param newOptions New options.
   */
  setOptions(newOptions: UploadManagerOptions) {
    if (this.started) {
      throw new Error('Cannot set new options after uploading has started.');
    }

    this.options = newOptions;
    this.maximumConcurrentJobs = newOptions.maximumConcurrentJobs || 3;
    this.getAuthorizationToken();
  }

  async addUploadJobs(files: FileList): Promise<void> {
    const filesArray: File[] = Array.from(files);

    const videoKeys: string[] = await videoObjectsCreator({
      appId: this.options.formId,
      files: filesArray,
      projectKey: this.options.projectKey,
      authorizationToken: this.authorizationToken,
      serviceName: this.options.serviceName,
    });

    if (typeof this.options.onVideosCreated === 'function') {
      this.options.onVideosCreated(videoKeys);
    }

    const jobList = transformVideoObjectsToJobList(filesArray, videoKeys);

    jobList.forEach((job) => {
      this.jobsByUploadId.set(job.uploadId, job);
    });
    this.jobQueue = [...this.jobQueue, ...jobList];
  }

  /**
   * Add an upload job to the queue.
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

  getJobQueue(): UploadJob[] {
    return this.jobQueue;
  }

  /**
   * Get existing job by upload id.
   *
   * @param uploadId Upload ID. It'll be "video key" for ByteArk Stream, or "video source id" for ByteArk Qoder.
   * @returns Detail of the upload job
   */
  getJobByUploadId(uploadId: string | number): UploadJob | undefined {
    return this.jobsByUploadId.get(uploadId);
  }

  getIsUploadStarted(): boolean {
    return this.started;
  }

  getIsAllUploadCancelled(): boolean {
    return this.jobQueue.every((queue) => queue.status === 'cancelled');
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

    this.currentUploader = this.createUploader(
      currentJob,
      this.options,
      this.authorizationToken,
    );

    this.activeUploaderList.set(currentJob.uploadId, this.currentUploader);

    await this.currentUploader.start();
    // Clear out finished job.
    this.activeUploaderList.delete(currentJob.uploadId);
    this.uploadNextJob();
  }

  pauseUploadById(uploadId: UploadId): Promise<UploadJob> {
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

  resumeUploadById(uploadId: UploadId): Promise<UploadJob> {
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

  cancelUploadById(
    uploadId: UploadId,
    shouldUploadNextJob = true,
  ): Promise<UploadJob> {
    let uploaderType = 'active';
    let uploader = this.activeUploaderList.get(uploadId);

    if (!uploader) {
      uploader = this.pausedUploaderList.get(uploadId);
      uploaderType = 'pause';
    }

    if (!uploader) {
      throw new Error(`A video with the uploader ID ${uploadId} is not found.`);
    }

    if (uploaderType === 'pause') {
      this.pausedUploaderList.delete(uploadId);
    } else {
      this.activeUploaderList.delete(uploadId);
    }

    if (shouldUploadNextJob) {
      this.uploadNextJob();
    }

    return uploader.abort(true);
  }

  async cancelAll(): Promise<void> {
    const pausedUploadIds = Array.from(this.pausedUploaderList.keys());
    const activeUploadIds = Array.from(this.activeUploaderList.keys());

    const cancelledUploadsPromises = [
      ...pausedUploadIds.map((uploadId) =>
        this.cancelUploadById(uploadId, false),
      ),
      ...activeUploadIds.map((uploadId) =>
        this.cancelUploadById(uploadId, false),
      ),
    ];

    await Promise.all(cancelledUploadsPromises);

    this.pausedUploaderList.clear();
    this.activeUploaderList.clear();

    this.jobQueue = this.jobQueue.map((queue) => ({
      ...queue,
      status: 'cancelled',
    }));

    this.started = false;
  }
}
