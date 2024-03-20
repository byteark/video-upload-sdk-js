// import nock from 'nock';

import { VideoUploadManager } from './VideoUploadManager';

jest.mock('tus-js-client', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    abort: jest.fn(),
  })),
}));

// nock('https://stream.byteark.com')
//   .persist()
//   .defaultReplyHeaders({
//     location: 'https://stream.byteark.com/api/upload/v1/tus/videos/videoId',
//   })
//   .post('/api/upload/v1/tus/videos')
//   .reply(201, undefined, {
//     'Tus-Resumable': '1.0.0',
//   });

// nock('https://stream.byteark.com')
//   .persist()
//   .patch(/\/api\/upload\/v1\/tus\/videos\/\w+/)
//   .reply(204, undefined, {
//     'Tus-Resumable': '1.0.0',
//     'Upload-Offset': '11815175',
//   });

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
      formId: '',
      formSecret: '',
      projectKey: '',
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

    expect(uploadManager.getIsUploadStarted()).toBe(true);
    expect(uploadManager.getJobByUploadId('1234')).toMatchObject({
      status: 'uploading',
    });
  });

  test('options is not allowed to be set after uploading has started', async () => {
    uploadManager.addUploadJob('1234', fakeVideoFile);
    await uploadManager.start();

    expect(() =>
      uploadManager.setOptions({
        serviceName: 'byteark.stream',
        serviceEndpoint: 'https://stream.byteark.com',
        formId: '',
        formSecret: '',
        projectKey: '',
      }),
    ).toThrow('Cannot set new options after uploading has started.');
  });

  test('can pause uploading by uploadId', async () => {
    uploadManager.addUploadJob('1234', fakeVideoFile);
    await uploadManager.start();
    uploadManager.pauseUploadById('1234');

    expect(uploadManager.getJobByUploadId('1234')).toMatchObject({
      status: 'paused',
    });
  });

  test('can resume uploading by uploadId', async () => {
    uploadManager.addUploadJob('1234', fakeVideoFile);
    await uploadManager.start();
    uploadManager.pauseUploadById('1234');

    expect(uploadManager.getJobByUploadId('1234')).toMatchObject({
      status: 'paused',
    });

    uploadManager.resumeUploadById('1234');

    expect(uploadManager.getJobByUploadId('1234')).toMatchObject({
      status: 'uploading',
    });
  });

  test('can cancel uploading by uploadId', async () => {
    uploadManager.addUploadJob('1234', fakeVideoFile);
    uploadManager.addUploadJob('234', fakeVideoFile);
    await uploadManager.start();
    uploadManager.cancelUploadById('1234');

    expect(uploadManager.getJobByUploadId('1234')).toMatchObject({
      status: 'cancelled',
    });
  });

  test('should upload a pending job after the previous job was cancelled', async () => {
    uploadManager.setOptions({
      serviceName: 'byteark.stream',
      serviceEndpoint: 'https://stream.byteark.com',
      maximumConcurrentJobs: 1,
      formId: '',
      formSecret: '',
      projectKey: '',
    });
    uploadManager.addUploadJob('1', fakeVideoFile);
    uploadManager.addUploadJob('2', fakeVideoFile);

    await uploadManager.start();

    expect(uploadManager.getJobByUploadId('2')).toMatchObject({
      status: 'pending',
    });

    await uploadManager.cancelUploadById('1');

    expect(uploadManager.getJobByUploadId('2')).toMatchObject({
      status: 'uploading',
    });
  });

  test('can cancel all jobs', async () => {
    uploadManager.addUploadJob('1234', fakeVideoFile);
    uploadManager.addUploadJob('5678', fakeVideoFile);

    await uploadManager.start();
    await uploadManager.cancelAll();
    expect(uploadManager.getIsAllUploadCancelled()).toBe(true);
  });

  test('can set maximum concurrent jobs', async () => {
    uploadManager.setOptions({
      serviceName: 'byteark.stream',
      serviceEndpoint: 'https://stream.byteark.com',
      maximumConcurrentJobs: 4,
      formId: '',
      formSecret: '',
      projectKey: '',
    });

    uploadManager.addUploadJob('1', fakeVideoFile);
    uploadManager.addUploadJob('2', fakeVideoFile);
    uploadManager.addUploadJob('3', fakeVideoFile);
    uploadManager.addUploadJob('4', fakeVideoFile);

    await uploadManager.start();

    expect(uploadManager.getJobByUploadId('1')).toMatchObject({
      status: 'uploading',
    });
    expect(uploadManager.getJobByUploadId('2')).toMatchObject({
      status: 'uploading',
    });
    expect(uploadManager.getJobByUploadId('3')).toMatchObject({
      status: 'uploading',
    });
    expect(uploadManager.getJobByUploadId('4')).toMatchObject({
      status: 'uploading',
    });
  });
});

describe('VideoUploadManager.options', () => {
  test('has a correct type', () => {
    // @ts-expect-error An argument for options was not provided.
    expect(() => new VideoUploadManager('hello!')).toThrow(
      "An 'options' parameter needs to be an object.",
    );

    // @ts-expect-error Missing serviceName and serviceEndpoint
    expect(() => new VideoUploadManager({ maximumConcurrentJobs: 10 })).toThrow(
      'serviceName and serviceEndpoint are required in the option parameter.',
    );

    expect(
      // @ts-expect-error Missing serviceEndpoint
      () => new VideoUploadManager({ serviceName: 'byteark.stream' }),
    ).toThrow('serviceEndpoint is required in the option parameter.');

    expect(
      () =>
        // @ts-expect-error Missing serviceName
        new VideoUploadManager({
          serviceEndpoint: 'https://stream.byteark.com',
        }),
    ).toThrow('serviceName is required in the option parameter.');

    expect(
      () =>
        new VideoUploadManager({
          serviceName: 'byteark.stream',
          serviceEndpoint: 'https://stream.byteark.com',
          formId: '',
          formSecret: '',
          projectKey: '',
        }),
    ).toBeTruthy();
  });
});
