import fs from 'fs';

import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { VideoUploadManager } from '../lib/VideoUploadManager';

const handlers = [
  http.post('https://stream.byteark.com/api/upload/v1/tus/videos', () => {
    console.log('post video intercept');
    return new HttpResponse(null, {
      status: 201,
    });
  }),
  http.patch(
    'https://stream.byteark.com/api/upload/v1/tus/videos/:videoId',
    () => {
      console.log('patch video intercept');
      return new HttpResponse(null, {
        status: 204,
      });
    },
  ),
];

const server = setupServer(...handlers);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultUploadManagerOptions: any = {
  serviceName: 'byteark.stream',
  serviceEndpoint: 'https://stream.byteark.com',
  authorizationToken: '',
  maximumConcurrentJobs: 2,
  onUploadProgress: () => {
    console.log('Example: onUploadProgress');
  },
  onUploadCompleted: () => {
    console.log('Example: onUploadCompleted');
  },
  onUploadFailed: () => {
    console.log('Example: onUploadFailed');
  },
};

beforeAll(() => {
  server.listen();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function readMP4File() {
  return new Promise((resolve, reject) => {
    fs.readFile('./src/tests/Road.mp4', (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
}

describe('TUSd Integration Tests', () => {
  test('Upload video file using TUS protocol', async () => {
    let videoUploadManager = null;
    videoUploadManager = new VideoUploadManager(defaultUploadManagerOptions);
    const tusdServerUrl = 'https://stream.byteark.com/api/upload/v1/tus/videos';
    const file = await readMP4File();

    try {
      videoUploadManager.addUploadJob('videoId', file);
      await videoUploadManager.start();
      // Step 1: Initiate upload
      const postResponse = await fetch(tusdServerUrl, {
        method: 'POST',
      });
      expect(postResponse.status).toBe(201);
      const uploadLocation =
        'https://stream.byteark.com/api/upload/v1/tus/videos/videoId';

      // Step 2: Upload video file data
      const patchResponse = await fetch(uploadLocation, {
        method: 'PATCH',
        body: '',
      });

      // // Verify successful upload
      expect(patchResponse.status).toBe(204);
    } catch (error) {
      // console.error('Error occurred during video file upload:', error);
    }
  });
});
