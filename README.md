# ByteArk Stream Video Upload SDK

Uploading video files directly from user's browser to ByteArk Stream
and ByteArk Qoder service.

## Installation

For Yarn:

```yarn add @byteark/byteark-stream-video-upload-sdk```

For npm:

```npm install --save @byteark/byteark-stream-video-upload-sdk```

## Usage

### Usage for ByteArk Qoder

The following variables should be replaced:

* serviceEndpoint
  * For frontend uploading: should be `https://qoder.byteark.com/apps/<appId>/ajax`,
    replacing appId with the application id.
* accessToken
  * Use token that generated from JWT.
* videoSourceFileId
  * Field `video.source.id` that got when creating video.

```ts
import { VideoUploadManager } from '@byteark/video-upload-sdk';

async function main() {
  const uploadManager = new VideoUploadManager({
    serviceType: 'byteark.qoder',
    serviceEndpoint: 'https://qoder.byteark.com/apps/<appIdHere>/ajax',
    authorizationToken: '<accessToken>',
    onUploadProgress: (job: UploadJob, progress: UploadProgress) => {
      // Called when video uploading has a progress.
    },
    onUploadCompleted: (job: UploadJob) => {
      // Called when a video has uploaded.
    },
    onUploadFailed: (job: UploadJob, error: Error | DetailedError) => {
      // Called when video uploading failed (cannot retry).
    }
  });

  uploadManager.addUploadJob('<videoSourceFileId>', file1);
  uploadManager.addUploadJob('<videoSourceFileId>', file2);
  uploadManager.addUploadJob('<videoSourceFileId>', file3);
  await uploadManager.start();
}

main();
```

## Example Applications

We have an example applications in

* React: [./examples/video-upload-react/src/App.js](/examples/video-upload-react).
