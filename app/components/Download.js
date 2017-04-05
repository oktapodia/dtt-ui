'use strict';
import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import async from 'async';
import * as helper from './Helper.js';
var exec = require('child_process').exec;
const { dialog } = require('electron').remote;

export default class Download extends Component {
  constructor(props) {
    super(props);
    this.state = {
      manifestFile: '',
      downloadFolder: '',
      uuidStr: '',
      isUUID: true,
      relatedFiles: true,
      annotations: true,
      uuidStatuses: [],
      downloading: false,
      statusStr: ''
    };
    this.downloads = [];
  }

  render() {
    return (
      <div className="downloadMainContainer" style={mainStyle}>
        <div className="downloadFileContainer" style={fileStyle}>
          <div className="downloadInfoContainer" style={selectorStyle}>
            1. Select the files that you want to download:
            <br />
            <input
              type="radio"
              name="uuidRadio"
              checked={this.state.isUUID}
              onChange={this.handleDownloadMethodChange}
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
              name="manifestRadio"
              value="Manifest File"
              checked={!this.state.isUUID}
              onChange={this.handleDownloadMethodChange}
            />Manifest File
            <Dropzone
              style={dropzoneStyle}
              onDrop={(acceptedFiles, rejectedFiles) => { this.setState({ manifestFile: acceptedFiles[0].path }); acceptedFiles = [] }}
              multiple={false}
              disableClick={true}
            >
              <div>Drag or browse for the manifest file</div>
              <button onClick={this.handleManifestDialog}>Browse</button>
              <textarea
                rows="1"
                cols="20"
                id="manifestLocation"
                value={this.state.manifestFile}
                onChange={this.handleManifestChange}
                style={textAreaStyle}
              />
            </Dropzone>
            <button onClick={this.handleResetManifestFile}>Reset Manifest File</button>
          </div>
          <div className="downloadDestContainer" style={destStyle}>
            2. Select the destination directory:
            <br />
            <Dropzone
              style={dropzoneStyle}
              onDrop={(acceptedFiles, rejectedFiles) => { this.setState({ downloadFolder: acceptedFiles[0].path }); acceptedFiles = [] }}
              multiple={false}
              disableClick={true}
            >
              <div>Drag or browse for the destination folder</div>
              <button onClick={this.handleDestDialog}>Browse</button>
              <textarea
                rows="1"
                cols="20"
                id="destLocation"
                value={this.state.downloadFolder}
                onChange={this.handleDownloadChange}
                style={textAreaStyle}
              />
            </Dropzone>
            <button onClick={this.handleResetDownloadFolder}>Reset Destination</button>
          </div>
          <div className="downloadOptionContainer" style={optionStyle}>
            3. Select Download Options:
            <br />
            <input
              type="checkbox"
              name="relatedFilesCheckBox"
              onChange={this.handleCheckRelatedFiles}
              checked={this.state.relatedFiles}
            />Related Files<br />
            <input
              type="checkbox"
              name="annotationsCheckBox"
              onChange={this.handleCheckAnnotations}
              checked={this.state.annotations}
            />Annotations<br />
          </div>
        </div>
        <div className="downloadButtonContainer" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', marginTop: 'auto', alignSelf: 'flexEnd' }}>{this.state.statusStr}</span>
          <button
            onClick={this.state.downloading ? this.handleStopDownload : this.handleDownload}>
            {this.state.downloading ? 'Stop' : 'Download'}
          </button>
        </div>
        <div className="tableContainer" style={{ overflowY: "auto", flexGrow: 1, flexShrink: 1, height: '15em' }}>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <td>UUID</td>
                <td>Size</td>
                <td>Status</td>
                <td>Speed</td>
              </tr>
            </thead>
            <tbody>
              {this.state.uuidStatuses.map(x =>
                <tr key={x.uuid}>
                  <td>{x.uuid}</td>
                  <td>{x.size}</td>
                  <td>{x.status} {x.time}</td>
                  <td>{x.speed}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>)
  }
  handleDownloadMethodChange = (e) => this.setState({ isUUID: e.currentTarget.name === 'uuidRadio' });
  handleUUIDChange = (e) => this.setState({ uuidStr: e.target.value });
  handleResetManifestFile = () => this.setState({ manifestFile: '' });
  handleResetDownloadFolder = () => this.setState({ downloadFolder: '' });
  handleCheckAnnotations = () => this.setState({ annotations: !this.state.annotations });
  handleCheckRelatedFiles = () => this.setState({ relatedFiles: !this.state.relatedFiles });
  handleManifestDialog = () => dialog.showOpenDialog({ properties: ['openFile'] }, (fileName) => {
    try { this.setState({ manifestFile: fileName[0] }) }
    catch (e) { this.setState({ manifestFile: '' }) }
  });
  handleDestDialog = () => dialog.showOpenDialog({ properties: ['openDirectory'] }, (dirName) => {
    try { this.setState({ downloadFolder: dirName[0] }) }
    catch (e) { this.setState({ downloadFolder: '' }) }
  });
  handleStopDownload = () => {
    helper.killProcess(this.downloads);
    var tempStatusArray = this.state.uuidStatuses;
    tempStatusArray.forEach(obj => { if (obj.status !== 'Downloaded') obj.status = 'Skipped' });
    this.setState({ uuidStatuses: tempStatusArray, downloading: false });
  }
  handleDownload = () => {
    this.props.clearLog();
    this.downloads = [];
    this.setState({ downloading: true });
    var relatedFilesStr = this.state.relatedFiles ? '' : ' --no-related-files ';
    var annotationsStr = this.state.annotations ? '' : ' --no-annotations ';
    var [prefList, numDownloads] = helper.getDownloadPrefs(this.state.downloadFolder);
    prefList = prefList.concat([relatedFilesStr, annotationsStr])
    var statusObjs = [];
    var arg = this.state.isUUID ? this.state.uuidStr.split(/\s+/) : this.state.manifestFile;

    helper.requestDownloadStatuses(this.state.isUUID, arg)
      .then(objs => {
        statusObjs = objs;
        this.setState({ uuidStatuses: statusObjs });
        async.eachLimit(statusObjs, numDownloads, (statusObj, callback) => {
          if (this.state.downloading) {
            setTimeout(null, 300);
            this.spawnDownload(statusObj.uuid, prefList, callback);
          }
        }, () => {
          this.setState({ downloading: false });
          helper.killProcess(this.downloads);

        });
      });
  }
  spawnDownload = (uuid, strList, callback) => {
    var time,
      timer = null,
      script = helper.prefix + 'download ' + uuid;
    script += strList[2] + strList[1] + strList[0] + strList[3] + strList[4] + ' -n  1 ';
    console.log(script);
    if (!this.state.downloading) callback('err')//ends all downloads
    var cmd = exec(script, { maxBuffer: 1024 * 1000 }, (error, stdout, stderr) => {
      if (error !== null) {
        console.log('exec error: ' + error);
        callback(error);
      }
    });
    var pid = cmd.pid;
    cmd.stdout.on('data', (data) => {
      console.log(data)
      var tempStatusArray = this.state.uuidStatuses;
      var file = tempStatusArray.find(x => x.uuid === uuid)
      var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
      if (data.includes('100%') && !data.includes('Failed')) {
        file.status = 'Downloaded';
        this.checkNumOfDownloads();
        callback();
        clearInterval(timer);
        var regVar = /\s(\d+\.\d+\s+(?:kB|MB|GB)\/s)[\s\n\r]+SUMMARY/.exec(data.toString());
        file.speed = regVar[1];
        this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) });
      }
      else if (file.status !== 'Skipped') {
        file.status = 'Downloading';
        this.checkNumOfDownloads();
        if (timer === null) {
          time = new Date().getTime();
          timer = setInterval(() => {
            file.time = '(' + helper.formatTime(new Date().getTime() - time) + ')';
            this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) });
          }, 1000);
          this.downloads.push({ timer: timer, process: pid });
        }
      }
    });
    cmd.stderr.on('data', (data) => {
      console.log(data)
      var tempStatusArray = this.state.uuidStatuses;
      var file = tempStatusArray.find(x => x.uuid === uuid)
      var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
      file.status = data.includes('ERROR') ? 'Skipped' : 'Downloading';
      this.checkNumOfDownloads();
      clearInterval(timer);
      if (file.status === 'Skipped' && data.includes('Successfully')) callback();
      this.setState({ uuidStatuses: Object.assign(tempStatusArray, { [fileIndex]: file }) });
      this.props.appendLog(data);
    });
  }
  checkNumOfDownloads = () => {
    var arr = { 'Downloaded': 0, 'Downloading': 0, 'Not Started': 0, 'Skipped': 0 }
    console.log(arr, this.state.uuidStatuses)
    this.state.uuidStatuses.forEach(x => arr[x.status]++)
    this.setState({
      statusStr: 'Not Started: ' + arr['Not Started'] +
      ' Downloading: ' + arr['Downloading'] +
      ' Downloaded: ' + arr['Downloaded'] +
      ' Skipped: ' + arr['Skipped']
    })
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
const destStyle = {
  margin: '11px',
}

const textAreaStyle = {
  resize: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
}

const optionStyle = {
  margin: '11px'
}


const dropzoneStyle = {
  width: '240px',
  height: '100px',
  borderRadius: '4px',
  border: 'dashed 2px lightgrey',
  padding: '4px',
}