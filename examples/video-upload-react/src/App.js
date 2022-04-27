import React, { useCallback, useEffect, useState } from 'react';
import { VideoUploadManager } from '@byteark/video-upload-sdk';
import { UploadForm } from './UploadForm';

function JobItem(props) {
  const { uploadId, name, status, progress } = props;

  return (
    <li className="p-4 py-3 sm:py-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {name}
          </p>
          <p className="text-sm text-gray-500 truncate">
            #{uploadId} - {status}
          </p>
        </div>
        <div className="inline-flex items-center text-base font-semibold text-gray-900">
          {progress ? `${progress.percent}%` : ''}
        </div>
      </div>
    </li>
  );
}

function App() {
  const defaultUploadManagerOptions = {
    serviceName: 'byteark.qoder',
    serviceEndpoint: '<https://qoder.byteark.com/apps/<qoderAppIdHere>/ajax>',
    authorizationToken: '<qoderAppJwtAccessTokenHere>',
  };

  const [jobs, setJobs] = useState([]);
  const [uploadManagerOptionsString, setUploadManagerOptionsString] = useState(JSON.stringify(defaultUploadManagerOptions));
  const [uploadManager, setUploadManager] = useState(null);

  useEffect(() => {
    // We need only one VideoUploadManager
    // without recreating it every render.
    console.log('Example: creating VideoUploadManager', defaultUploadManagerOptions);

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

  const onSubmitUploadManagerOptions = useCallback((event) => {
    const newOptions = JSON.parse(event.target[0].value);
    console.log('Example: onSubmitUploadManagerOptions', newOptions);

    event.preventDefault();
    setUploadManagerOptionsString(event.target[0].value);
    uploadManager.setOptions(JSON.parse(event.target[0].value));
  }, [uploadManager]);

  const onClickAddVideoButton = useCallback((data) => {
    console.log('Example: onClickAddVideoButton');

    uploadManager.addUploadJob(data.uploadId, data.file);
    setJobs([...uploadManager.jobQueue]);
  }, [uploadManager]);

  const onClickStartButton = useCallback(() => {
    console.log('Example: onClickStartButton');

    uploadManager.start();
  }, [uploadManager]);

  const MemoUploadForm = React.memo(
    () => <UploadForm onSubmit={onClickAddVideoButton} />,
  );

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="App">
        <div className="flex flex-row">
          <div className="basis-1/4">
            <h1 className="mt mb-4 font-bold">Upload manager options</h1>
            <form onSubmit={onSubmitUploadManagerOptions}>
              <div className="mb-4">
                <textarea className="border p-1" name="options" defaultValue={uploadManagerOptionsString}></textarea>
              </div>
              <div className="mb-4">
                <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded" type="submit">
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
                {
                  jobs.map(job => <JobItem key={job.uploadId} {...job} />)
                }
              </ul>
              <div className="p-4 border-t">
                <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
                  type="button"
                  onClick={onClickStartButton}>
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
