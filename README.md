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

- serviceName: byteark.qoder
- serviceEndpoint
  - For frontend uploading: should be `https://qoder.byteark.com/apps/<appId>/ajax`,
    replacing appId with the application id.
- FormId
  - Ask ByteArk admin for appId.
- FormSecret
  - Ask ByteArk admin for appSecret.
- projectKey
  - Project id that you want to upload.

### Usage for ByteArk Stream

The following variables should be replaced:

- serviceName: byteark.stream
- serviceEndpoint
  - For frontend uploading: should be 'https://stream.byteark.com'.
- FormId
  - Get formId from https://stream.byteark.com/<namespace>/manage/forms/<formId>.
- FormSecret
  - Get formSecret from https://stream.byteark.com/<namespace>/manage/forms/<formId>.
- projectKey
  - Project key that you want to upload.

### Example Code

```ts
import { VideoUploadManager } from '@byteark/video-upload-sdk';

async function main() {
  const uploadManager = new VideoUploadManager({
    serviceName: 'byteark.qoder | byteark.stream',
    serviceEndpoint:
      'https://qoder.byteark.com/apps/<appIdHere>/ajax' |
      'https://stream.byteark.com',
    formId: '<AppId(Qoder)>' | '<FormId(Stream)>',
    formSecret: '<FormSecret>',
    projectKey: '<projectId(Qoder)>' | '<projectKey(Stream)>',
    onUploadProgress: (job: UploadJob, progress: UploadProgress) => {
      // Called when video uploading has a progress.
    },
    onUploadCompleted: (job: UploadJob) => {
      // Called when a video has uploaded.
    },
    onUploadFailed: (job: UploadJob, error: Error | DetailedError) => {
      // Called when video uploading failed (cannot retry).
    },
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
| ----------------------- | ---------------------- | -------------------------------------------------------- |
| getJobQueue             | UploadJob[]            | Returns a job queue array.                               |
| getJobByUploadId        | UploadJob \| undefined | Returns a job that matches the provided uploadId.        |
| getIsUploadStarted      | boolean                | Returns true if any upload job has started.              |
| getIsAllUploadCancelled | boolean                | Returns true if all jobs in a queue have been cancelled. |

## Methods

### addUploadJobs(file: File[]): `Promise<void>`

Add files to enable the SDK to create a video object and set up a job for uploading.

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

- React: [./examples/video-upload-react/src/App.js](/examples/video-upload-react).
