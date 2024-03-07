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

| Name                    | Returns                | Description                                              |
|-------------------------|------------------------|----------------------------------------------------------|
| getJobQueue             | UploadJob[]            | Returns a job queue array.                               |
| getJobByUploadId        | UploadJob \| undefined | Returns a job that matches the provided uploadId.        |
| getIsUploadStarted      | boolean                | Returns true if any upload job has started.              |
| getIsAllUploadCancelled | boolean                | Returns true if all jobs in a queue have been cancelled. |

## Methods

### addUploadJob(): `void`
Add an upload job to a job queue.

### setOptions(newOptions: UploadManagerOptions): `void`
Set a new options to VideoUploadManager. This operation cannot be done when any upload job has already started.

### start(): `Promise<void>`
Start uploading from a job queue.

### pauseUploadById(uploadId: UploadId): `Promise<UploadJob>`
Pause a job by the provided uploadId.

This method throws an error when a job with the provided uploadId cannot be found.

### resumeUploadById(uploadId: UploadId): `Promise<UploadJob>`
Resume a job by the provided uploadId.

This method throws an error when a job with the provided uploadId cannot be found.

### cancelUploadById(uploadId: UploadId): `Promise<UploadJob>`
Cancel a job by the provided uploadId.

This method throws an error when a job with the provided uploadId cannot be found.

### cancelAll(): `Promise<void>`
Cancel all jobs in a job queue.

## Example Application

We have an example application in

* React: [./examples/video-upload-react/src/App.js](/examples/video-upload-react).
