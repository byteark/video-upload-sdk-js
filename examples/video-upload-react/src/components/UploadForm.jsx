import { useRef } from 'react';

export function UploadForm({ onSubmit }) {
  const fileInput = useRef();

  const onChangeInput = (event) => {
    event.preventDefault();
    if (!fileInput.current) {
      return;
    }

    onSubmit(fileInput.current.files);
    fileInput.current.value = null;
  };

  return (
    <form>
      <div className="mb-4">
        <label htmlFor="file" className="hidden">
          File
        </label>
        <input
          id="file"
          type="file"
          ref={fileInput}
          onChange={onChangeInput}
          accept="video/*"
          multiple
        />
      </div>
    </form>
  );
}
