import React from 'react';

export class UploadForm extends React.Component {

  constructor(props) {
    super(props);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.videoSourceIdInput = React.createRef();
    this.fileInput = React.createRef();
  }

  handleSubmit(event) {
    event.preventDefault();
    if (this.props.onSubmit) {
      this.props.onSubmit({
        uploadId: this.videoSourceIdInput.current.value,
        file: this.fileInput.current.files[0]
      })
      this.videoSourceIdInput.current.value = '';
      this.fileInput.current.value = null;
    }
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <div className="mb-4">
          <label className="block">Video Source ID</label>
          <input className="border p-1" type="text" ref={this.videoSourceIdInput} />
        </div>
        <div className="mb-4">
          <label className="block">File</label>
          <input type="file" ref={this.fileInput} />
        </div>
        <div className="mb-4">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="submit">Add</button>
        </div>
      </form >
    );
  }
}
