import React, { useCallback, useState } from 'react';
import { VideoUploadManager } from '@byteark/video-upload-sdk';
import { SdkConfigForm } from './components/SdkConfigForm';
import { UploadForm } from './components/UploadForm';

const disabledClass =
  'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed';

function JobActionButton({ bgColor = 'blue', onClick, status, text }) {
  const getDisabledCondition = () => {
    const baseDisabled = status === 'pending' || status === 'cancelled';

    if (text === 'Resume') {
      return baseDisabled && status !== 'uploading';
    }

    if (text === 'paused') {
      return baseDisabled && status !== 'paused';
    }

    return baseDisabled;
  };

  return (
    <button
      className={`bg-${bgColor}-500 text-white py-2 px-4 rounded ml-2 ${disabledClass}`}
      type="button"
      onClick={onClick}
      disabled={getDisabledCondition()}
    >
      {text}
    </button>
  );
}

function JobItem(props) {
  const {
    uploadId,
    name,
    status,
    progress,
    onClickCancelButton,
    onClickResumeButton,
    onClickPauseButton,
  } = props;

  return (
    <li className="p-4 py-3 sm:py-4">
      <div className="flex items-center space-x-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{name}</p>
          <p className="text-sm text-gray-500 truncate">
            #{uploadId} - {status}
          </p>
        </div>
        <div className="inline-flex items-center text-base font-semibold text-gray-900">
          {progress ? `${progress.percent}%` : ''}
        </div>
        <JobActionButton
          text="Resume"
          status={status}
          onClick={onClickResumeButton}
        />
        <JobActionButton
          bgColor="gray"
          text="Pause"
          status={status}
          onClick={onClickPauseButton}
        />
        <JobActionButton
          bgColor="red"
          text="Cancel"
          status={status}
          onClick={onClickCancelButton}
        />
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
    formId: '',
    formSecret: '',
    projectKey: '',
    onUploadProgress: () => {
      console.log('Example: onUploadProgress');
      setJobs([...uploadManager.getJobQueue()]);
    },
    onUploadCompleted: () => {
      console.log('Example: onUploadCompleted');
      setJobs([...uploadManager.getJobQueue()]);
    },
    onUploadFailed: () => {
      console.log('Example: onUploadFailed');
      setJobs([...uploadManager.getJobQueue()]);
    },
    onVideosCreated: (videoKeys) => {
      console.log(`Videos created: ${videoKeys}`);
    },
  };

  const [jobs, setJobs] = useState([]);
  const [uploadManagerOption, setUploadManagerOptions] = useState(
    defaultUploadManagerOptions,
  );
  const [uploadManager, setUploadManager] = useState(null);

  const onSubmitUploadManagerOptions = useCallback(
    (event) => {
      event.preventDefault();
      const options = {
        ...defaultUploadManagerOptions,
        serviceName: event.target.serviceName.value,
        serviceEndpoint: event.target.serviceEndpoint.value,
        formId: event.target.formId.value,
        formSecret: event.target.formSecret.value,
        projectKey: event.target.projectKey.value,
      };

      if (!options.formId || !options.formSecret || !options.projectKey) {
        alert('Please enter required fields.');
        return;
      }

      if (!uploadManager) {
        console.log('Example: Creating VideoUploadManager...');

        const newUploadManager = new VideoUploadManager({
          ...options,
          onUploadStarted: (job) => {
            console.log('Example: onUploadStarted', job);
          },
          onUploadProgress: (job, progress) => {
            console.log('Example: onUploadProgress', { job, progress });
            setJobs([...newUploadManager.getJobQueue()]);
          },
          onUploadCompleted: (job) => {
            console.log('Example: onUploadCompleted', job);
            setJobs([...newUploadManager.getJobQueue()]);
          },
          onUploadFailed: (job, error) => {
            console.log('Example: onUploadFailed', { job, error });
            setJobs([...newUploadManager.getJobQueue()]);
          },
        });
        setUploadManager(newUploadManager);

        console.log('Example: VideoUploadManager Created', newUploadManager);
      } else {
        setUploadManagerOptions(options);
        uploadManager.setOptions(options);
        console.log('Example: onSubmitUploadManagerOptions', options);
      }
    },
    [uploadManager],
  );

  const onAddVideoFiles = async (files) => {
    console.log('Example: onAddVideoFiles');

    if (!files.length) {
      console.log('Example [Info]: A file list is empty.');
      return;
    }

    await uploadManager.addUploadJobs(files);

    setJobs([...uploadManager.getJobQueue()]);
  };

  const onClickStartButton = useCallback(() => {
    console.log('Example: onClickStartButton');

    uploadManager.start();
  }, [uploadManager]);

  const onClickResumeButton = useCallback(
    (uploadId) => {
      console.log('Example: onClickResumeButton');

      uploadManager.resumeUploadById(uploadId);
    },
    [uploadManager],
  );

  const onClickPauseButton = useCallback(
    async (uploadId) => {
      console.log('Example: onClickPauseButton');

      uploadManager.pauseUploadById(uploadId);
      setJobs([...uploadManager.getJobQueue()]);
    },
    [uploadManager],
  );

  const onClickCancelButton = useCallback(
    async (uploadId) => {
      console.log('Example: onClickCancelButton');

      await uploadManager.cancelUploadById(uploadId);
      setJobs([...uploadManager.getJobQueue()]);
    },
    [uploadManager],
  );

  const onClickCancelAllButton = useCallback(async () => {
    console.log('Example: onClickCancelAllButton');

    await uploadManager.cancelAll();
    setJobs([...uploadManager.getJobQueue()]);
  }, [uploadManager]);

  const MemoUploadForm = React.memo(() => (
    <UploadForm onSubmit={onAddVideoFiles} />
  ));

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="App">
        <h1 className="text-2xl mb-4 font-bold">
          Video Upload SDK React Example
        </h1>
        <div className="flex flex-row gap-8">
          <div className="basis-1/4">
            <h2 className="mb-4 font-bold">1. SDK Configuration</h2>
            <SdkConfigForm
              onSubmitUploadManagerOptions={onSubmitUploadManagerOptions}
              uploadManagerOption={uploadManagerOption}
            />
          </div>
          <div className="basis-3/4">
            <div className="mb-8">
              <h2 className="mb-4 font-bold">2. Add Files</h2>
              <MemoUploadForm />
            </div>
            <div>
              <h2 className="mb-4 font-bold">3. Job Queue</h2>
              <div className="bg-white rounded-lg border">
                {jobs.length > 0 ? (
                  <ul className="h-96 divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <JobItem
                        {...job}
                        key={`${job.uploadId}-${job.status}`}
                        onClickCancelButton={() =>
                          onClickCancelButton(job.uploadId)
                        }
                        onClickResumeButton={() =>
                          onClickResumeButton(job.uploadId)
                        }
                        onClickPauseButton={() =>
                          onClickPauseButton(job.uploadId)
                        }
                      />
                    ))}
                  </ul>
                ) : (
                  <div className="h-96 flex flex-col justify-center items-center column text-gray-400">
                    <p>
                      <strong>Empty Queue</strong>
                    </p>
                    <p>Please add video files using the input above</p>
                  </div>
                )}
                <div
                  className={`${jobs.length ? 'block' : 'hidden'} p-4 border-t`}
                >
                  <button
                    className={`bg-blue-500 text-white font-bold py-2 px-4 rounded ${disabledClass}`}
                    type="button"
                    onClick={onClickStartButton}
                    disabled={
                      jobs.length === 0 || uploadManager.getIsUploadStarted()
                    }
                  >
                    Start
                  </button>
                  <button
                    className={`bg-red-500 text-white font-bold py-2 px-4 rounded ml-2 ${disabledClass}`}
                    type="button"
                    onClick={onClickCancelAllButton}
                    disabled={
                      jobs.length === 0 ||
                      !uploadManager.getIsUploadStarted() ||
                      uploadManager.getIsAllUploadCancelled()
                    }
                  >
                    Cancel All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
