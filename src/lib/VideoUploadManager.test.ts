import { VideoUploadManager } from './VideoUploadManager';

describe('VideoUploadManager', () => {
  test("requires an 'options' parameter", () => {
    // @ts-expect-error An argument for options was not provided.
    expect(() => new VideoUploadManager()).toThrow(
      "VideoUploadManager requires an 'options' parameter.",
    );
  });
});

describe('VideoUploadManager UseCase', () => {
  let uploadManager: VideoUploadManager;
  const fakeVideoFile = new File([''], 'filename');

  beforeEach(() => {
    uploadManager = new VideoUploadManager({
      serviceName: 'byteark.stream',
      serviceEndpoint: 'https://stream.byteark.com',
    });
  });

  test('can add an upload job to jobQueue', () => {
    uploadManager.addUploadJob('1234', fakeVideoFile);
    expect(uploadManager.getJobQueue()).toStrictEqual([
      {
        file: fakeVideoFile,
        name: 'filename',
        status: 'pending',
        uploadId: '1234',
      },
    ]);
  });

  test('can start uploading from a job queue', async () => {
    uploadManager.addUploadJob('1234', fakeVideoFile);
    await uploadManager.start();

    // TODO: Recheck these after using a mock API. They should work.
    expect(uploadManager.getIsUploadStarted()).toBe(true);
    expect(uploadManager.getJobByUploadId('1234')).toMatchObject({
      status: 'uploading',
    });
  });

  test('can cancel uploading by uploadId', async () => {
    uploadManager.addUploadJob('1234', fakeVideoFile);
    await uploadManager.start();
    await uploadManager.cancelUploadById('1234');

    // TODO: Recheck this after using a mock API. It should work.
    expect(uploadManager.getJobByUploadId('1234')).toMatchObject({
      status: 'cancelled',
    });
  });

  test('can cancel all jobs', async () => {
    uploadManager.addUploadJob('1234', fakeVideoFile);
    uploadManager.addUploadJob('5678', fakeVideoFile);

    await uploadManager.start();
    await uploadManager.cancelAll();
    expect(uploadManager.getIsAllUploadCancelled()).toBe(true);
  });
});

describe('VideoUploadManager.options', () => {
  test('has a correct type', () => {
    // @ts-expect-error An argument for options was not provided.
    expect(() => new VideoUploadManager('hello!')).toThrow(
      "An 'options' parameter needs to be an object.",
    );

    // @ts-expect-error Missing serviceName and serviceEndpoint
    expect(() => new VideoUploadManager({
      maximumConcurrentJobs: 10,
    })).toThrow(
      'serviceName and serviceEndpoint are required in the option parameter.'
    );

    // @ts-expect-error Missing serviceEndpoint
    expect(() => new VideoUploadManager({
      serviceName: 'byteark.stream',
    })).toThrow(
      'serviceEndpoint is required in the option parameter.'
    );

    // @ts-expect-error Missing serviceName
    expect(() => new VideoUploadManager({
      serviceEndpoint: 'https://stream.byteark.com',
    })).toThrow(
      'serviceName is required in the option parameter.'
    );

    expect(() => new VideoUploadManager({
      serviceName: 'byteark.stream',
      serviceEndpoint: 'https://stream.byteark.com',
    })).toBeTruthy();
  })
});
