'use strict';
import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import * as helper from './Helper.js';
const dialog = require('electron').remote;
var exec = require('child_process').exec;

export default class Upload extends Component {
  constructor(props) {
    super(props);
    this.state = {
      manifestFile: '',
      uploadFolder: '',
      consoleLog: '',
      uuids: '',
      isUUID: true,
      uploadIntention: true,
      uploading: true,
      uuidStatuses: [],
      statusStr: ''
    };
    this.uploads = [];

  }

  render() {
    return (
      <div className="uploadMainContainer" style={mainStyle}>
        <div className="uploadFileContainer" style={fileStyle}>
          <div className="uploadSelectorContainer" style={selectorStyle}>
            1. Select the files you want to upload:
          <br />
            <input
              type="radio"
              name="uRadio"
              checked={this.state.isUUID}
              onChange={this.handleUploadMethodChange}
            />UUID(s)
          <br />
            <textarea
              rows="4"
              cols="36"
              id="uuids"
              style={{ resize: 'none' }}
              onChange={this.handleUUIDChange}>
            </textarea>
            <br />
            <input
              type="radio"
              name="mRadio"
              checked={!this.state.isUUID}
              onChange={this.handleUploadMethodChange}
            /> Manifest File
          <br />
            <Dropzone
              style={dropzoneStyle}
              onDrop={(acceptedFiles, rejectedFiles) => { this.setState({ manifestFile: acceptedFiles[0].path }); acceptedFiles = [] }}
              multiple={false}
              disableClick={true}
            >
              <button onClick={this.handleManifestDialog}>Browse</button>
              <textarea
                rows="1"
                cols="20"
                id="manifestLocation"
                value={this.state.manifestFile}
                onChange={this.handleManifestChange}
              />
              <div>Drag or browse for the manifest file</div>
            </Dropzone>
            <button onClick={this.handleResetManifestFile}>Reset Manifest File</button>
          </div>
          &nbsp;
          &nbsp;
          &nbsp;
          <div className="uploadSourceContainer" style={sourceStyle}>
            2. Select the source directory:
            <Dropzone
              style={dropzoneStyle}
              onDrop={(acceptedFiles, rejectedFiles) => { this.setState({ uploadFolder: acceptedFiles[0].path }); acceptedFiles = [] }}
              multiple={false}
              disableClick={true}
            >
              <div>Drag or browse for the source folder</div>
              <button onClick={this.handleSourceDialog}>Browse</button>
              <textarea
                rows="1"
                cols="20"
                id="sourceLocation"
                value={this.state.uploadFolder}
                onChange={this.handleSourceChange}
              />
            </Dropzone>
            <button onClick={this.handleResetUploadFolder}>Reset Source</button>
          </div>
        </div>
        <div className="uploadButtonContainer" style={buttonStyle}>
          <input
            type="radio"
            name="uploadRadio"
            value="Upload"
            checked={this.state.uploadIntention}
            onChange={this.handleIntentionChange}
          />Upload &nbsp;
          <input
            type="radio"
            name="deleteRadio"
            value="Delete"
            checked={!this.state.uploadIntention}
            onChange={this.handleIntentionChange}
          />Delete &nbsp;
          <button onClick={this.handleUpload}>Submit</button>
        </div>
      </div>)
  }

  handleUploadMethodChange = (e) => this.setState({ isUUID: e.currentTarget.name === 'uRadio' });
  handleUUIDChange = (e) => this.setState({ uuids: e.target.value });
  handleResetManifestFile = () => this.setState({ manifestFile: "" });
  handleResetUploadFolder = () => this.setState({ uploadFolder: "" });
  handleManifestChange = (e) => this.setState({ manifestFile: e.target.value });
  handleSourceChange = (e) => this.setState({ uploadFolder: e.target.value });
  handleIntentionChange = (e) => this.setState({ uploadIntention: e.currentTarget.name === 'uploadRadio' });
  handleManifestDialog = () => dialog.showOpenDialog({ properties: ['openFile'] }, (fileName) => {
    try { this.setState({ manifestFile: fileName[0] }) }
    catch (e) { this.setState({ manifestFile: '' }) }
  });
  handleSourceDialog = () => dialog.showOpenDialog({ properties: ['openDirectory'] }, (dirName) => {
    try { this.setState({ uploadFolder: dirName[0] }) }
    catch (e) { this.setState({ uploadFolder: '' }) }
  });
  handleUpload = () => {
    this.props.clearLog();
    this.uploads = [];
    this.setState({ uploading: true });
    var [prefList, numUploads] = helper.getUploadPrefs(this.state.uploadFolder);
    var deleteStr = this.state.uploadIntention ? '' : ' --delete ';
    prefList = prefList.concat(deleteStr);
    var statusObjs = [];
    var arg = this.state.isUUID ? this.state.uuidStr.split(/\s+/) : this.state.manifestFile;

    helper.requestUploadStatuses(this.state.isUUID, arg)
      .then(objs => {
        statusObjs = objs;
        this.setState({ uuidStatuses: statusObjs });
        async.eachLimit(statusObjs, numDownloads, (statusObj, callback) => {
          if (this.state.uploading) {
            setTimeout(null, 300);
            this.spawnUpload(statusObj.uuid, prefList, callback);
          }
        }, () => {
          this.setState({ uploading: false });
          helper.killProcess(this.uploads);
        });
      });
  }
  spawnUpload = (uuid, strList, callback) => {
    var time,
      timer = null,
      script = helper.prefix + 'upload ' + uuid;
    script += strList[2] + strList[1] + strList[0] + strList[3] + strList[4] + ' -n  1 '
  }
}
const mainStyle = {
  display: 'flex',
  flexDirection: 'column',
}
const fileStyle = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
};

const selectorStyle = {
  margin: '11px',
}
const sourceStyle = {
  margin: '11px',
}

const textAreaStyle = {
  resize: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
}

const buttonStyle = {
  marginRight: '11px',
  marginLeft: 'auto',
}

const dropzoneStyle = {
  width: '240px',
  height: '100px',
  borderRadius: '4px',
  border: 'dashed 2px lightgrey',
  padding: '4px',
}
