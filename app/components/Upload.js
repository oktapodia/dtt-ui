'use strict';
import React, { Component } from 'react';
const os = require('os');
const { dialog } = require('electron').remote;
var Dropzone = require('react-dropzone');
var exec = require('child_process').exec;
var fixSpace = require('./Helper.js').fixSpace;


var isWin = /^win/.test(process.platform);
var homedir = os.homedir();
var dir = isWin ? homedir + '\\AppData\\Roaming\\dtt\\' : homedir + '/.dtt/';
var prefix = isWin ? dir + 'gdc-client.exe ' : dir + './gdc-client ';

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
    };
  }
  handleIntention = () => {
    this.setState({ consoleLog: "" });
    var uploadStr = ' -d ' + this.state.uploadFolder;
    var script = this.state.isUUID ? './gdc-client upload ' + this.state.uuids + uploadStr : './gdc-client upload -m ' + fixSpace(this.state.manifestFile) + fixSpace(uploadStr);
    console.log(script);
    if (!isWin) {
      var cmd = exec(script, (error, stdout, stderr) => {
        if (error !== null) {
          console.log('exec error: ' + error);
        }
      });
      cmd.stdout.on('data', (data) => {
        this.setState({ consoleLog: this.state.consoleLog + data });
      });
    }
    else {

    }
  }
  handleUploadMethodChange = (e) => this.setState({ isUUID: e.currentTarget.name === 'uRadio' });
  handleManifestDialog = () => dialog.showOpenDialog({ properties: ['openFile'] }, (fileName) => this.setState({ manifestFile: fileName[0] }));
  handleSourceDialog = () => dialog.showOpenDialog({ properties: ['openDirectory'] }, (dirName) => this.setState({ uploadFolder: dirName[0] }));
  handleUUIDChange = (e) => this.setState({ uuids: e.target.value });
  handleResetManifestFile = () => this.setState({ manifestFile: "" });
  handleResetUploadFolder = () => this.setState({ uploadFolder: "" });
  handleManifestChange = (e) => this.setState({ manifestFile: e.target.value });
  handleSourceChange = (e) => this.setState({ uploadFolder: e.target.value });
  handleIntentionChange = (e) => this.setState({ uploadIntention: e.currentTarget.name === 'uploadRadio' });

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
          <button onClick={this.handleIntention}>Submit</button>
        </div>
      </div>)
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
