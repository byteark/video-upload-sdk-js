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

### Example Code

```ts
import { VideoUploadManager } from '@byteark/video-upload-sdk';

async function main() {
  // Initialize the SDK
  const uploadManager = new VideoUploadManager({
    // SDK Options
    serviceName: 'byteark.stream' | 'byteark.qoder',
    serviceEndpoint:
      'https://stream.byteark.com' | 'https://qoder.byteark.com/apps/<appId>/ajax',
    formId: '<formId(Stream)>' | '<appId(Qoder)>',
    formSecret: '<formSecret>',
    projectKey: '<projectKey(Stream)>' | '<projectId(Qoder)>',

    // Callback Functions
    onUploadProgress: (job: UploadJob, progress: UploadProgress) => {
      // Called when video uploading has a progress.
    },
    onUploadCompleted: (job: UploadJob) => {
      // Called when a video has uploaded.
    },
    onUploadFailed: (job: UploadJob, error: Error | DetailedError) => {
      // Called when video uploading failed (cannot retry).
    },
    onVideosCreated: (videoKeys: string[]) => {
      // Called after all videos are created on our service.
    },
  });

  // An example use case
  uploadManager.addUploadJobs(fileList);
  await uploadManager.start();
}

main();
```

## SDK Options

### For ByteArk Stream

You are required to [create a form upload](https://docs.byteark.com/th/stream/developer-forms.html#%E0%B8%82%E0%B8%B1%E0%B9%89%E0%B8%99%E0%B8%95%E0%B8%AD%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%88-1-%E0%B8%AA%E0%B8%A3%E0%B9%89%E0%B8%B2%E0%B8%87%E0%B9%81%E0%B8%9A%E0%B8%9A%E0%B8%9F%E0%B8%AD%E0%B8%A3%E0%B9%8C%E0%B8%A1%E0%B8%AD%E0%B8%B1%E0%B8%9B%E0%B9%82%E0%B8%AB%E0%B8%A5%E0%B8%94%E0%B8%82%E0%B8%AD%E0%B8%87%E0%B8%84%E0%B8%B8%E0%B8%93%E0%B9%83%E0%B8%99-byteark-stream) to use this SDK. You will obtain `formId` and `formSecret` after creating the form.

- **serviceName**: Please use `byteark.stream`
- **serviceEndpoint**: An optional field, you can customize an endpoint here. A default value is `https://stream.byteark.com`
- **formId**: Please use your form upload's `formId`
- **formSecret**: Please use your form upload's `formSecret`
- **projectKey**: Please use the `projectKey` that you want to upload videos into. Please refer to this [documentation](https://docs.byteark.com/th/stream/project-management-overview.html#%E0%B8%A7%E0%B8%B4%E0%B8%98%E0%B8%B5%E0%B8%99%E0%B9%8D%E0%B8%B2%E0%B8%84%E0%B8%B5%E0%B8%A2%E0%B9%8C%E0%B8%82%E0%B8%AD%E0%B8%87%E0%B9%82%E0%B8%9B%E0%B8%A3%E0%B9%80%E0%B8%88%E0%B8%81%E0%B8%95%E0%B9%8C%E0%B9%84%E0%B8%9B%E0%B9%83%E0%B8%8A%E0%B9%89%E0%B8%87%E0%B8%B2%E0%B8%99) to get your project key.

### For ByteArk Qoder (Legacy)

ByteArk Qoder is our legacy service. Please contact ByteArk admin for Qoder's `appId` and `appSecret`.

- **serviceName**: Please use `byteark.qoder`
- **serviceEndpoint**: An optional field, you can customize an endpoint here. A default value is `https://qoder.byteark.com/apps/<appId>/ajax`
- **formId**: Please use `appId`
- **formSecret**: Please use `appSecret`
- **projectKey**: Please use the project's ID that you want to upload videos into.

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
