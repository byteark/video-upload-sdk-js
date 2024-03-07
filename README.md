# ByteArk Stream Video Upload SDK

Uploading video files directly from user's browser to ByteArk Stream
and ByteArk Qoder service.

## Installation

For Yarn:

```
yarn add @byteark/video-upload-sdk
```

For npm:

```
npm install --save @byteark/video-upload-sdk
```

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

## Getters

| Name        | Returns     | Description                                       |
|-------------|-------------|---------------------------------------------------|
| getJobQueue | UploadJob[] | An array of job queue.                            |
| getJobByUploadId  | UploadJob   | A job by the provided uploadId.                   |
| getIsUploadStarted            | boolean     | Returns true if any upload job has started.       |
| getIsAllUploadCancelled            | boolean     | Returns true if all job queue has been cancelled. |

## Methods

### addUploadJob()
Add an upload job to a job queue. The method returns `void`.

### setOptions(newOptions: UploadManagerOptions)
Add an upload job to a job queue. The method returns `void`.

### start()
Start uploading from a job queue. The method returns `Promise<void>`.

### pauseUploadById(uploadId: UploadId)
Pause a job by the provided uploadId. This method throws an error when a job with the provided uploadId cannot be found, otherwise returns `Promise<UploadJob>`.

### resumeUploadById(uploadId: UploadId)
Pause a job by the provided uploadId. This method throws an error when a job with the provided uploadId cannot be found, otherwise returns `Promise<UploadJob>`.

### pauseUploadById(uploadId: UploadId)
Resume a job by the provided uploadId. This method throws an error when a job with the provided uploadId cannot be found, otherwise returns `Promise<UploadJob>`.

### cancelUploadById(uploadId: UploadId)
Cancel a job by the provided uploadId. This method throws an error when a job with the provided uploadId cannot be found, otherwise returns `Promise<UploadJob>`.

### cancelAll()
Cancel all jobs in a job queue. The method returns `Promise<void>`.

## Example Application

We have an example application in

* React: [./examples/video-upload-react/src/App.js](/examples/video-upload-react).
