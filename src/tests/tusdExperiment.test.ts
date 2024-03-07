import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.post('https://stream.byteark.com/api/upload/v1/tus/videos', () => {
    return new HttpResponse(null, {
      status: 201,
    });
  }),
  http.patch(
    'https://stream.byteark.com/api/upload/v1/tus/videos/:videoId',
    () => {
      return new HttpResponse(null, {
        status: 204,
      });
    },
  ),
);

// let videoUploadManager = null;
beforeAll(() => {
  server.listen();
});

describe('TUSd Integration Tests', () => {
  test('Upload video file using TUS protocol', async () => {
    const tusdServerUrl = 'https://stream.byteark.com/api/upload/v1/tus/videos';

    // Mock video file data
    const videoData = new Uint8Array([0x01, 0x02, 0x03]); // Example video data

    try {
      // Step 1: Initiate upload
      await fetch(tusdServerUrl, {
        method: 'POST',
      });
      const uploadLocation =
        'https://stream.byteark.com/api/upload/v1/tus/videos/xxxx';

      // Step 2: Upload video file data
      const uploadResponse = await fetch(uploadLocation, {
        method: 'PATCH',
        body: videoData,
      });

      // // Verify successful upload
      expect(uploadResponse.status).toBe(204); // Status 204 means No Content
    } catch (error) {
      console.error('Error occurred during video file upload:', error);
      throw error; // Fail the test if an error occurs
    }
  });
});
