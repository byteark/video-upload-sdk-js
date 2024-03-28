import fetchMock from 'jest-fetch-mock';

import { VideoUploadManager } from './VideoUploadManager';

jest.mock('tus-js-client', () => ({
  Upload: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    abort: jest.fn(),
  })),
}));

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('token')
  }))
}));

// const createFileList = (files: File[]): FileList => {
//   const fileList = { length: files.length } as FileList;
//   files.forEach((file, index) => {
//     fileList[index] = file;
//   });
//   fileList.item = (index: number) => fileList[index];
//   return fileList;
// };

// Example usage
const files = [
  new File([''], 'filename'),
  new File([''], 'filename2'),
  new File([''], 'filename3')
];

const fakeFileList = files;

fetchMock.mockResponse(async (req) => {
  if (req.url === 'https://stream.byteark.com/api/v1/videos') {
    return JSON.stringify([
      {
        id: 'video-id',
        key: 'video-key-1',
        project: {
          key: 'project-key',
        },
        title: 'video-title',
        updatedAt: '2024-03-14T07:28:09.032Z',
        createdAt: '2024-03-14T07:28:09.032Z',
      },
      {
        id: 'video-id',
        key: 'video-key-2',
        project: {
          key: 'project-key',
        },
        title: 'video-title',
        updatedAt: '2024-03-14T07:28:09.032Z',
        createdAt: '2024-03-14T07:28:09.032Z',
      },
      {
        id: 'video-id',
        key: 'video-key-3',
        project: {
          key: 'project-key',
        },
        title: 'video-title',
        updatedAt: '2024-03-14T07:28:09.032Z',
        createdAt: '2024-03-14T07:28:09.032Z',
      }
    ])
  }
  if (req.url === 'https://stream.byteark.com/api/auth/v1/public/apps/form-id/access-tokens') {
    return JSON.stringify({ accessToken: 'fake-token' })
  }
  return Promise.reject(new Error('bad url'))
})

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

  beforeEach(() => {
    uploadManager = new VideoUploadManager({
      serviceName: 'byteark.stream',
      serviceEndpoint: 'https://stream.byteark.com',
      formId: 'form-id',
      formSecret: 'form-secret',
      projectKey: 'project-key',
    });
  });

  test('can add an upload job to jobQueue', async () => {
    await uploadManager.addUploadJobs(fakeFileList);

    expect(uploadManager.getJobQueue()).toStrictEqual([
      {
        file: fakeFileList[0],
        name: 'filename',
        status: 'pending',
        uploadId: 'video-key-1',
      },
      {
        file: fakeFileList[1],
        name: 'filename2',
        status: 'pending',
        uploadId: 'video-key-2',
      },
      {
        file: fakeFileList[2],
        name: 'filename3',
        status: 'pending',
        uploadId: 'video-key-3',
      },
    ]);
  });

  test('onVideosCreated callback function return corrected video keys', async () => {
    let videoKeys = [];

    uploadManager.setOptions({
      serviceName: 'byteark.stream',
      serviceEndpoint: 'https://stream.byteark.com',
      formId: 'form-id',
      formSecret: 'form-secret',
      projectKey: 'project-key',
      onVideosCreated: (keys) => {
        videoKeys = keys
      }
    });
    await uploadManager.addUploadJobs(fakeFileList);

    expect(videoKeys).toStrictEqual(['video-key-1', 'video-key-2', 'video-key-3']);
  });

  test('can start uploading from a job queue', async () => {
    await uploadManager.addUploadJobs(fakeFileList);
    await uploadManager.start();

    expect(uploadManager.getIsUploadStarted()).toBe(true);
    expect(uploadManager.getJobByUploadId('video-key-1')).toMatchObject({
      status: 'uploading',
    });
  });

  test('options is not allowed to be set after uploading has started', async () => {
    await uploadManager.addUploadJobs(fakeFileList);
    await uploadManager.start();

    expect(() =>
      uploadManager.setOptions({
        serviceName: 'byteark.stream',
        serviceEndpoint: 'https://stream.byteark.com',
        formId: 'form-id',
        formSecret: 'form-secret',
        projectKey: 'project-key',
      }),
    ).toThrow('Cannot set new options after uploading has started.');
  });

  test('can pause uploading by uploadId', async () => {
    await uploadManager.addUploadJobs(fakeFileList);
    await uploadManager.start();
    uploadManager.pauseUploadById('video-key-1');

    expect(uploadManager.getJobByUploadId('video-key-1')).toMatchObject({
      status: 'paused',
    });
  });

  test('can resume uploading by uploadId', async () => {
    await uploadManager.addUploadJobs(fakeFileList);
    await uploadManager.start();
    uploadManager.pauseUploadById('video-key-1');

    expect(uploadManager.getJobByUploadId('video-key-1')).toMatchObject({
      status: 'paused',
    });

    uploadManager.resumeUploadById('video-key-1');

    expect(uploadManager.getJobByUploadId('video-key-1')).toMatchObject({
      status: 'uploading',
    });
  });

  test('can cancel uploading by uploadId', async () => {
    await uploadManager.addUploadJobs(fakeFileList);
    await uploadManager.start();
    uploadManager.cancelUploadById('video-key-1');

    expect(uploadManager.getJobByUploadId('video-key-1')).toMatchObject({
      status: 'cancelled',
    });
  });

  test('should upload a pending job after the previous job was cancelled', async () => {
    await uploadManager.addUploadJobs(fakeFileList);

    uploadManager.setOptions({
      serviceName: 'byteark.stream',
      serviceEndpoint: 'https://stream.byteark.com',
      maximumConcurrentJobs: 2,
      formId: 'form-id',
      formSecret: 'form-secret',
      projectKey: 'project-key',
    });

    await uploadManager.start();

    expect(uploadManager.getJobByUploadId('video-key-3')).toMatchObject({
      status: 'pending',
    });

    await uploadManager.cancelUploadById('video-key-1');

    expect(uploadManager.getJobByUploadId('video-key-3')).toMatchObject({
      status: 'uploading',
    });
  });

  test('can cancel all jobs', async () => {
    await uploadManager.addUploadJobs(fakeFileList);

    await uploadManager.start();
    await uploadManager.cancelAll();
    expect(uploadManager.getIsAllUploadCancelled()).toBe(true);
  });

  test('can set maximum concurrent jobs', async () => {
    await uploadManager.addUploadJobs(fakeFileList);

    uploadManager.setOptions({
      serviceName: 'byteark.stream',
      serviceEndpoint: 'https://stream.byteark.com',
      maximumConcurrentJobs: 2,
      formId: 'form-id',
      formSecret: 'form-secret',
      projectKey: 'project-key',
    });

    await uploadManager.start();

    expect(uploadManager.getJobByUploadId('video-key-1')).toMatchObject({
      status: 'uploading',
    });
    expect(uploadManager.getJobByUploadId('video-key-2')).toMatchObject({
      status: 'uploading',
    });
    expect(uploadManager.getJobByUploadId('video-key-3')).toMatchObject({
      status: 'pending',
    });
  });
});

describe('VideoUploadManager.options', () => {
  test('has a correct type', () => {
    // @ts-expect-error An argument for options was not provided.
    expect(() => new VideoUploadManager('hello!')).toThrow(
      "An 'options' parameter needs to be an object.",
    );
  });

  test('has all required options', () => {
    // @ts-expect-error Missing serviceName and serviceEndpoint
    expect(() => new VideoUploadManager({ maximumConcurrentJobs: 10 })).toThrow(
      'serviceName, formId, formSecret, projectKey are required in the option parameter.',
    );

    expect(
      // @ts-expect-error Missing serviceEndpoint
      () => new VideoUploadManager({ serviceName: 'byteark.stream' }),
    ).toThrow('formId, formSecret, projectKey are required in the option parameter.');

    expect(
      () =>
        new VideoUploadManager({
          serviceName: 'byteark.stream',
          serviceEndpoint: 'https://stream.byteark.com',
          formId: '1234',
          formSecret: '',
          projectKey: 'abc',
        }),
    ).toThrow('formSecret is required in the option parameter.');

    expect(
      () =>
        new VideoUploadManager({
          serviceName: 'byteark.stream',
          serviceEndpoint: 'https://stream.byteark.com',
          formId: '1234',
          formSecret: '5678',
          projectKey: 'abc',
        }),
    ).not.toThrow();

    expect(
      () =>
        new VideoUploadManager({
          serviceName: 'byteark.stream',
          formId: '1234',
          formSecret: '5678',
          projectKey: 'abc',
        }),
    ).not.toThrow();
  })
});
