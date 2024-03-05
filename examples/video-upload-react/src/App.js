import React, { useCallback, useEffect, useState } from 'react';
import { VideoUploadManager } from '@byteark/video-upload-sdk';
import { UploadForm } from './UploadForm';

function JobItem(props) {
  const { uploadId, name, status, progress, onClickCancelButton } = props;

  return (
    <li className="p-4 py-3 sm:py-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{ name }</p>
          <p className="text-sm text-gray-500 truncate">
            #{ uploadId } - { status }
          </p>
        </div>
        <div
          className="inline-flex items-center text-base font-semibold text-gray-900">
          { progress ? `${ progress.percent }%` : '' }
        </div>
        <button
          className="bg-red-500 text-white font-bold py-2 px-4 rounded ml-2"
          type="button"
          onClick={onClickCancelButton}
        >
          Cancel
        </button>
      </div>
    </li>
  );
}

function App() {
  const defaultUploadManagerOptions = {
    serviceName: 'byteark.stream',
    serviceEndpoint: 'https://stream.byteark.com',
    authorizationToken: '',
    maximumConcurrentJobs: 2,
    onUploadProgress: () => {
      console.log('Example: onUploadProgress');
      setJobs([...uploadManager.jobQueue]);
    },
    onUploadCompleted: () => {
      console.log('Example: onUploadCompleted');
      setJobs([...uploadManager.jobQueue]);
    },
    onUploadFailed: () => {
      console.log('Example: onUploadFailed');
      setJobs([...uploadManager.jobQueue]);
    },
  };

  const [jobs, setJobs] = useState([]);
  const [uploadManagerOption, setUploadManagerOptions] = useState(
    defaultUploadManagerOptions,
  );
  const [uploadManager, setUploadManager] = useState(null);

  useEffect(() => {
    // We need only one VideoUploadManager
    // without recreating it every render.
    console.log(
      'Example: creating VideoUploadManager',
      defaultUploadManagerOptions,
    );

    const uploadManager = new VideoUploadManager({
      ...defaultUploadManagerOptions,
      onUploadProgress: () => {
        console.log('Example: onUploadProgress');
        setJobs([...uploadManager.jobQueue]);
      },
      onUploadCompleted: () => {
        console.log('Example: onUploadCompleted');
        setJobs([...uploadManager.jobQueue]);
      },
      onUploadFailed: () => {
        console.log('Example: onUploadFailed');
        setJobs([...uploadManager.jobQueue]);
      },
    });
    setUploadManager(uploadManager);
  }, []);

  const onSubmitUploadManagerOptions = useCallback(
    (event) => {
      event.preventDefault();
      const options = {
        ...defaultUploadManagerOptions,
        serviceName: event.target.serviceName.value,
        serviceEndpoint: event.target.serviceEndpoint.value,
        authorizationToken: event.target.authorizationToken.value,
      };
      setUploadManagerOptions(options);
      uploadManager.setOptions(options);
      console.log('Example: onSubmitUploadManagerOptions', options);
    },
    [uploadManager],
  );

  const createStreamVideo = async (data) => {
    const videoResponses = await fetch(
      'https://stream.byteark.com/api/v1/videos',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${uploadManagerOption?.authorizationToken}`,
        },
        body: JSON.stringify({
          projectKey: data.projectKey,
          videos: [{ title: data?.file?.name }],
        }),
      },
    );
    return (await videoResponses.json())[0];
  };

  const onClickAddVideoButton = async (data) => {
    console.log('Example: onClickAddVideoButton');
    if (uploadManagerOption?.serviceName === 'byteark.stream') {
      let videoData = await createStreamVideo(data);
      console.log('Example: create stream video');
      uploadManager.addUploadJob(videoData?.key, data.file);
    } else {
      uploadManager.addUploadJob(data.uploadId, data.file);
    }
    setJobs([...uploadManager.jobQueue]);
  };

  const onClickStartButton = useCallback(() => {
    console.log('Example: onClickStartButton');

    uploadManager.start();
  }, [uploadManager]);

  const onClickCancelButton = useCallback((uploadId) => {
    console.log('Example: onClickCancelButton');

    uploadManager.abort(uploadId);
  }, [uploadManager]);

  const MemoUploadForm = React.memo(() => (
    <UploadForm onSubmit={onClickAddVideoButton} />
  ));

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="App">
        <div className="flex flex-row">
          <div className="basis-1/4">
            <h1 className="mt mb-4 font-bold">Upload manager options</h1>
            <form onSubmit={onSubmitUploadManagerOptions}>
              <div className="mb-4">
                <div className="mb-4" style={{ width: '250px' }}>
                  <div>Service Name</div>
                  <input
                    className="border p-1"
                    placeholder="serviceName"
                    name="serviceName"
                    defaultValue={uploadManagerOption.serviceName}
                  />
                </div>
                <div className="mb-4" style={{ width: '250px' }}>
                  <div>Service Endpoint</div>
                  <input
                    className="border p-1"
                    placeholder="serviceEndpoint"
                    name="serviceEndpoint"
                    defaultValue={uploadManagerOption.serviceEndpoint}
                  />
                </div>
                <div className="mb-4" style={{ width: '250px' }}>
                  <div>Authorization token</div>
                  <input
                    className="border p-1"
                    placeholder="authorizationToken"
                    name="authorizationToken"
                    defaultValue={uploadManagerOption.authorizationToken}
                  />
                </div>
              </div>
              <div className="mb-4">
                <button
                  className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
                  type="submit"
                >
                  Save
                </button>
              </div>
            </form>
            <h1 className="mt mb-4 font-bold">Add files to upload</h1>
            <MemoUploadForm />
          </div>
          <div className="basis-3/4">
            <div className="max-w-md bg-white rounded-lg border">
              <ul className="h-96 divide-y divide-gray-200">
                {jobs.map((job) => (
                  <JobItem
                    {...job}
                    key={job.uploadId}
                    onClickCancelButton={() => onClickCancelButton(job.uploadId)}
                  />
                ))}
              </ul>
              <div className="p-4 border-t">
                <button
                  className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
                  type="button"
                  onClick={onClickStartButton}
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
