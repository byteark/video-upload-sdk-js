# ByteArk Stream Video Upload SDK

Uploading video files directly from user's browser to ByteArk Stream
and ByteArk Qoder service.

⚠️ For users who are using Video Upload SDK v1.2.3 and earlier, please refer the [Migration Guide](#v13-migration-guide) for migrating to v1.3.0 and newer. ⚠️

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
  - For front-end uploading: should be `https://qoder.byteark.com/apps/<appId>/ajax`,
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
  - For front-end uploading: should be `https://stream.byteark.com`.
- FormId
  - Get formId from `https://stream.byteark.com/<namespace>/manage/forms/<formId>`.
- FormSecret
  - Get formSecret from `https://stream.byteark.com/<namespace>/manage/forms/<formId>`.
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

### addUploadJobs(files: FileList): `Promise<void>`

Add videos that you want to upload. The SDK will create videos from the inputted files, trigger "onVideosCreated" callback, and add them to a job queue.

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

## Callbacks

### onVideosCreated(videoKeys: string[])

Triggers after all videos are created on our service, which will happen after calling `addUploadJobs(files)` method.

### onUploadStarted(job: UploadJob)

Triggers after the first upload job started uploading.

### onUploadProgress(job: UploadJob, progress: UploadProgress)

Triggers periodically when upload job(s) are being uploaded.

### onUploadCompleted(job: UploadJob)

Triggers after all upload jobs finished uploading.

### onUploadFailed(job: UploadJob, error: Error | DetailedError)

Triggers when something happened while uploading and halted the uploader.

## Example Application

We have an example application in

- React: [./examples/video-upload-react/src/App.js](/examples/video-upload-react).

## v1.3 Migration Guide

This guide details the changes and how to change your code to migrate to Video Upload SDK version 1.3.

### ByteArk Stream Service
To upload videos to ByteArk Stream, you are now required to [create a form upload](https://docs.byteark.com/th/stream/developer-forms.html#%E0%B8%82%E0%B8%B1%E0%B9%89%E0%B8%99%E0%B8%95%E0%B8%AD%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%88-1-%E0%B8%AA%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%87%E0%B9%81%E0%B8%9A%E0%B8%9A%E0%B8%9F%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%A1%E0%B8%AD%E0%B8%B1%E0%B8%9B%E0%B9%82%E0%B8%AB%E0%B8%A5%E0%B8%94%E0%B8%82%E0%B8%AD%E0%B8%87%E0%B8%84%E0%B8%B8%E0%B8%93%E0%B9%83%E0%B8%99-byteark-stream). You will obtain formId and formSecret after creating the form. And you are now required to initialize the SDK using these form ID and form secret. [Click here for an example code](#example-code).

### Removal of authorizationToken
authorizationToken was removed from the SDK options. Please remove it from either ByteArk Qoder or ByteArk Stream service.

### Method Changes
addUploadJob method was removed. Please use [addUploadJobs](#methods) instead. You can now add multiple videos using this new method.

### Built-in Video Object Creator
The SDK will now create videos when adding upload jobs. After videos are created, the SDK will also trigger [onVideosCreated](#callbacks) callback.
