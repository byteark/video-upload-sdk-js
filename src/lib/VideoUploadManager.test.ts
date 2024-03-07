import { VideoUploadManager } from './VideoUploadManager';

describe('VideoUploadManager', () => {
  test('requires an \'options\' parameter', () => {
    // @ts-expect-error An argument for options was not provided.
    expect(() => new VideoUploadManager()).toThrowError('VideoUploadManager requires an \'options\' parameter.');
  })
});

describe('VideoUploadManager UseCase', () => {
  let uploadManager: VideoUploadManager;
  const fakeVideoFile = new File([''], 'filename');

  beforeEach(() => {
    uploadManager = new VideoUploadManager({
      serviceName: 'byteark.stream',
      serviceEndpoint: 'https://stream.byteark.com',
    });

    uploadManager.start = jest.fn();
    uploadManager.cancelUploadById = jest.fn();
  });

  test('can add an upload job', () => {
    uploadManager.addUploadJob = jest.fn();
    uploadManager.addUploadJob('1234', fakeVideoFile);
    expect(uploadManager.addUploadJob).toHaveBeenCalledWith('1234', fakeVideoFile);
  })

  test('can return a job queue', () => {
    expect(uploadManager.getJobQueue()).toStrictEqual([]);

    uploadManager.addUploadJob('1234', fakeVideoFile);
    expect(uploadManager.getJobQueue()).toStrictEqual([
      {
        "file": fakeVideoFile,
        "name": "filename",
        "status": "pending",
        "uploadId": "1234"
      }
    ]);
  });

  test('can start uploading from a job queue', () => {
    uploadManager.addUploadJob('1234', fakeVideoFile);
    uploadManager.start();
    expect(uploadManager.start).toHaveBeenCalled();
    // TODO: uploadManager.getIsUploadStarted() still returns false. Likely caused by 'uploadManager.start = jest.fn()' line.
    expect(uploadManager.getIsUploadStarted()).toBe(true);
  });

  test('can cancel uploading by uploadId', () => {
    uploadManager.addUploadJob('1234', fakeVideoFile);
    uploadManager.start();
    expect(uploadManager.start).toHaveBeenCalled();

    uploadManager.cancelUploadById('1234');
    expect(uploadManager.cancelUploadById).toHaveBeenCalledWith('1234');
    // TODO: The job status is still 'pending'. Likely caused by 'uploadManager.cancelUploadById = jest.fn()' line.
    expect(uploadManager.getJobByUploadId('1234')).toMatchObject({ status: 'cancelled' });
  });

  test('can cancel all jobs', async () => {
    uploadManager.addUploadJob('1234', fakeVideoFile);
    uploadManager.addUploadJob('5678', fakeVideoFile);

    uploadManager.start();
    expect(uploadManager.start).toHaveBeenCalled();

    await uploadManager.cancelAll();
    expect(uploadManager.getIsAllUploadCancelled()).toBe(true);
  });
});

describe('VideoUploadManager.options', () => {
  test('has a correct type', () => {
    // @ts-expect-error An argument for options was not provided.
    expect(() => new VideoUploadManager('hello!')).toThrowError('An \'options\' parameter needs to be an object.');

    // @ts-expect-error Missing serviceName and serviceEndpoint
    expect(() => new VideoUploadManager({
      maximumConcurrentJobs: 10,
    })).toThrowError('serviceName and serviceEndpoint are required in the option parameter.');

    // @ts-expect-error Missing serviceEndpoint
    expect(() => new VideoUploadManager({
      serviceName: 'byteark.stream',
    })).toThrowError('serviceEndpoint is required in the option parameter.');

    // @ts-expect-error Missing serviceName
    expect(() => new VideoUploadManager({
      serviceEndpoint: 'https://stream.byteark.com',
    })).toThrowError('serviceName is required in the option parameter.');

    expect(() => new VideoUploadManager({
      serviceName: 'byteark.stream',
      serviceEndpoint: 'https://stream.byteark.com',
    })).toBeTruthy();
  })
});
