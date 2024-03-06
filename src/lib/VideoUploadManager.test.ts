import { VideoUploadManager } from './VideoUploadManager';

describe('VideoUploadManager', () => {
  test('requires an \'options\' parameter', () => {
    // @ts-expect-error An argument for options was not provided.
    expect(() => new VideoUploadManager()).toThrowError('VideoUploadManager requires an \'options\' parameter.');
  })
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
