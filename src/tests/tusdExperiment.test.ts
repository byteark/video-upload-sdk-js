import fs from 'fs';

import nock from 'nock';
// import { setupWorker } from 'msw/browser';

import { VideoUploadManager } from '../lib/VideoUploadManager';

nock('https://stream.byteark.com')
  .persist()
  .defaultReplyHeaders({
    location:
      'https://stream.byteark.com/api/upload/v1/tus/videos/e719bc4019689f564422ca88469bbe1a+2~ZhUXad_XyZh_jF7ylszVhrhLQdUM303',
  })
  .post('/api/upload/v1/tus/videos')
  .reply(201, { 'Upload-Length': 1024 });
nock('https://stream.byteark.com')
  .persist()
  .patch('/api/upload/v1/tus/videos/:videoId')
  .reply(204, { 'Upload-Offset': 512 });
nock('https://stream.byteark.com')
  .persist()
  .patch('/api/upload/v1/tus/videos/:videoId')
  .reply(204, null);

// const server = setupWorker(...handlers);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultUploadManagerOptions: any = {
  serviceName: 'byteark.stream',
  serviceEndpoint: 'https://stream.byteark.com',
  authorizationToken: '',
  maximumConcurrentJobs: 2,
  // onUploadProgress: () => {
  //   console.log('Example: onUploadProgress');
  // },
  // onUploadCompleted: () => {
  //   console.log('Example: onUploadCompleted');
  // },
  // onUploadFailed: () => {
  //   console.log('Example: onUploadFailed');
  // },
};

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
