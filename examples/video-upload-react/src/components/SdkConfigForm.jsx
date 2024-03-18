import { useEffect, useRef, useState } from 'react';
import { RadioButton } from './RadioButton.jsx';

export function SdkConfigForm(props) {
  const { onSubmitUploadManagerOptions, uploadManagerOption } = props;
  const [selectedService, setSelectedService] = useState('stream');
  const [formId, setFormId] = useState(uploadManagerOption.formId);

  const serviceNameRef = useRef();
  const serviceEndpoint = useRef();

  useEffect(() => {
    if (!serviceNameRef.current && !serviceEndpoint.current) {
      return;
    }

    if (selectedService === 'stream') {
      serviceNameRef.current.value = 'byteark.stream';
      serviceEndpoint.current.value = 'https://stream.byteark.com';
    } else {
      serviceNameRef.current.value = 'byteark.qoder';
      serviceEndpoint.current.value = `https://qoder.byteark.com/apps/${formId}/ajax`;
    }
  }, [selectedService, formId]);

  return (
    <form onSubmit={onSubmitUploadManagerOptions}>
      <div className="mb-4">
        <div className="mb-1">
          <fieldset className="border border-solid border-gray-300 p-3 mb-3">
            <legend className="text-sm">Service Presets:</legend>
            <div className="flex">
              <RadioButton
                id="stream"
                label="ByteArk Stream"
                value="stream"
                onChange={(event) => setSelectedService(event.target.value)}
                checked={selectedService === 'stream'}
              />
              <RadioButton
                id="qoder"
                label="ByteArk Qoder"
                value="qoder"
                onChange={(event) => setSelectedService(event.target.value)}
                checked={selectedService === 'qoder'}
              />
            </div>
          </fieldset>
          <fieldset>
            <div className="mb-4">
              <label className="block" htmlFor="serviceName">
                Service Name
              </label>
              <input
                className="border p-1 w-full"
                placeholder="serviceName"
                id="serviceName"
                name="serviceName"
                ref={serviceNameRef}
                defaultValue={uploadManagerOption.serviceName}
              />
            </div>
            <div>
              <label className="block" htmlFor="serviceEndpoint">
                Service Endpoint
              </label>
              <input
                className="border p-1 w-full"
                placeholder="serviceEndpoint"
                id="serviceEndpoint"
                name="serviceEndpoint"
                ref={serviceEndpoint}
                defaultValue={uploadManagerOption.serviceEndpoint}
              />
              <p
                className={`${
                  selectedService === 'qoder' ? 'opacity-100' : 'opacity-0'
                } text-gray-400 text-sm mt-1`}
              >
                ⓘ Service Endpoint will be automatically updated when the App ID
                below changes.
              </p>
            </div>
          </fieldset>
        </div>
        <div className="mb-4">
          <label className="block" htmlFor="formId">
            {selectedService === 'stream' ? 'Form ID' : 'App ID'}
          </label>
          <input
            className="border p-1 w-full"
            placeholder={selectedService === 'stream' ? 'formId' : 'appId'}
            id="formId"
            name="formId"
            onChange={(event) => setFormId(event.target.value)}
            defaultValue={uploadManagerOption.formId}
          />
        </div>
        <div className="mb-4">
          <label className="block" htmlFor="formSecret">
            {selectedService === 'stream' ? 'Form Secret' : 'App Secret'}
          </label>
          <input
            className="border p-1 w-full"
            placeholder={
              selectedService === 'stream' ? 'formSecret' : 'appSecret'
            }
            id="formSecret"
            name="formSecret"
            defaultValue={uploadManagerOption.formSecret}
          />
        </div>
        <div className="mb-4">
          <label className="block" htmlFor="projectKey">
            Project Key
          </label>
          <input
            className="border p-1 w-full"
            placeholder="projectKey"
            id="projectKey"
            name="projectKey"
            defaultValue={uploadManagerOption.projectKey}
          />
        </div>
      </div>
      <div className="mb-4">
        <button
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded w-full"
          type="submit"
        >
          Save Config
        </button>
      </div>
    </form>
  );
}
