'use strict';
import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import async from 'async';
import * as helper from './Helper.js';
import styles from './Download.css';
import uniqby from 'lodash/uniqby'
var exec = require('child_process').exec;
const { dialog } = require('electron').remote;

export default class Download extends Component {
  constructor(props) {
    super(props);
    this.state = {
      manifestFiles: '',
      downloadFolder: '',
      uuidStr: '',
      relatedFiles: true,
      annotations: true,
      uuidStatuses: [],
      downloadStatus: false,
      statusStr: ''
    };
    this.downloadProcesses = [];
    this.queueArr = [];
    this.prefList = '';
    this.queue = null;
    this.queueCallback = ''
  }

  render = () => {
    return (
      <div>
        <div id="downloadOptionContainer" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
          <div>
            <Dropzone
              style={dropzoneStyle}
              onDrop={(acceptedFiles) => { this.handleManifestDrop(acceptedFiles); acceptedFiles = [] }}
              disableClick={true}
            >
              <div>Drag or browse manifest file</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button onClick={this.handleManifestDialog}><i className="fa fa-plus" aria-hidden="true" /></button>
                <textarea
                  rows="1"
                  cols="25"
                  id="manifestLocation"
                  value={this.state.manifestFiles}
                  onChange={this.handleManifestChange}
                  style={textAreaStyle}
                />
              </div>
            </Dropzone>
          </div>
          <div>
            <textarea
              rows="4"
              cols="38"
              placeholder="UUID(s)"
              style={{ resize: 'none' }}
              onChange={this.handleUUIDChange}>
            </textarea>
          </div>
          <div>
            <Dropzone
              style={dropzoneStyle}
              onDrop={(acceptedFiles, rejectedFiles) => { this.setState({ downloadFolder: acceptedFiles[0].path }); acceptedFiles = [] }}
              multiple={false}
              disableClick={true}
            >
              <div>Drag or browse destination folder</div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button onClick={this.handleDestDialog}><i className="fa fa-plus" aria-hidden="true" /></button>
                <textarea
                  rows="1"
                  cols="25"
                  id="destLocation"
                  value={this.state.downloadFolder}
                  onChange={this.handleDownloadChange}
                  style={textAreaStyle}
                />
              </div>
            </Dropzone>
          </div>
          <div>
            <div>
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
              />Annotations
            </div>
            <button onClick={this.handleAddFiles}>Add Files</button>
          </div>
        </div>
        <br />
        <div style={{ borderBottom: '0px', border: '1px solid', display: 'flex', justifyContent: 'space-around' }}>
          <span>UUID</span>
          <span>Size</span>
          <span>Status</span>
          <span>Speed</span>
        </div>
        <div className="tableContainer" style={{ border: 'solid 1px', height: '300px', overflow: 'auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {this.state.uuidStatuses.map(x =>
              <div style={{ tableLayout: 'fixed', display: 'flex', flexDirection: 'row', paddingBottom: '5px' }} key={x.uuid}>
                <span style={{ width: '25%', textAlign: 'center' }}>{x.uuid}</span>
                <span style={{ width: '25%', textAlign: 'center' }}>{x.size}</span>
                <span style={{ width: '25%', textAlign: 'center' }}>{x.status} {x.time}</span>
                <span style={{ width: '25%', textAlign: 'center' }}>{x.speed}
                  <button><i onClick={() => this.handleRemoveDownload(x.uuid)} className="fa fa-times" aria-hidden="true"></i></button>
                  <button><i onClick={() => this.handleUnshiftDownload(x.uuid)} className="fa fa-arrow-up" aria-hidden="true"></i></button>
                </span>
              </div>
            )}
          </div>
        </div>
        <span>{this.state.statusStr}</span>
        <button
          onClick={this.state.downloadStatus ? this.handleStopDownload : this.handleDownload}>
          {this.state.downloadStatus ? 'Stop' : 'Download'}
        </button>
      </div>)
  }
  handleManifestDrop = (files) =>
    this.setState({ manifestFiles: files.map(file => file.path) });

  handleUUIDChange = (e) =>
    this.setState({ uuidStr: e.target.value });

  handleResetManifestFile = () =>
    this.setState({ manifestFiles: '' });

  handleResetDownloadFolder = () =>
    this.setState({ downloadFolder: '' });

  handleCheckAnnotations = () =>
    this.setState({ annotations: !this.state.annotations });

  handleCheckRelatedFiles = () =>
    this.setState({ relatedFiles: !this.state.relatedFiles });

  handleManifestDialog = () =>
    dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] }, (files) => {
      try { this.setState({ manifestFiles: files }) }
      catch (e) { this.setState({ manifestFiles: '' }) }
    });

  handleDestDialog = () => dialog.showOpenDialog({ properties: ['openDirectory'] }, (dirName) => {
    try { this.setState({ downloadFolder: dirName[0] }) }
    catch (e) { this.setState({ downloadFolder: '' }) }
  });

  handleStopDownload = () => {
    helper.killProcesses(this.downloadProcesses);
    var tempStatusArray = this.state.uuidStatuses;
    tempStatusArray.forEach(obj => { if (obj.status !== 'Downloaded') obj.status = 'Skipped' });
    this.setState({ uuidStatuses: tempStatusArray, downloadStatus: false });
    this.checkNumOfDownloads();
  }

  handleAddFiles = () => {
    this.handleFileChange(this.state.uuidStr, this.state.manifestFiles);
    this.setState({ manifestFiles: '', uuidStr: '' });
  }

  handleDownload = () => {
    var tempStatusArray = this.state.uuidStatuses.map(x => {
      return { uuid: x.uuid, time: '', status: 'Not Started', speed: '', size: x.size }
    });
    this.queueArr = [];
    this.props.clearLog();
    this.downloadProcesses = [];
    this.setState({ downloadStatus: true, uuidStatuses: tempStatusArray });
    var relatedFilesStr = this.state.relatedFiles ? '' : ' --no-related-files ',
      annotationsStr = this.state.annotations ? '' : ' --no-annotations ';
    this.prefList = helper.getDownloadPrefs(this.state.downloadFolder).concat([relatedFilesStr, annotationsStr]);
    this.queueArr = this.state.uuidStatuses.map(x => x.uuid);
    this.queue.push(Array.apply(null, Array(helper.getClientCons())).map(String.prototype.valueOf, 'dud'), this.queueCallback)//kickstart queue 
  }

  handleRemoveDownload = (uuid) => {
    var tempStatusArray = this.state.uuidStatuses;
    var file = tempStatusArray.find(x => x.uuid === uuid);
    var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
    file.status = 'Removed';
    if (this.state.downloadStatus)
      helper.killProcess(this.downloadProcesses.find(x => x.uuid === uuid))
    this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) });
  }

  handleUnshiftDownload = (uuid) => {
    var tempStatusArray = this.state.uuidStatuses;
    var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
    tempStatusArray.unshift(tempStatusArray.splice(fileIndex, 1));
    this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) });
    if (this.state.downloadStatus) {
      var queueIndex = this.queueArr.findIndex(x => x === uuid);
      this.queueArr.unshift(this.queueArr.splice(queueIndex, 1));
    }
  }

  handleFileChange = (uuids, manifestFiles) => {
    helper.requestDownloadStatuses(uuids.split(/\s+/), manifestFiles)
      .then(objs => {
        this.setState({ uuidStatuses: uniqby(this.state.uuidStatuses.concat(objs), 'uuid') });
        this.queueArr = this.queueArr.concat(uniqby(objs.map(x => x.uuid)));
      });
    if (this.state.downloadStatus)
      this.queue.push(Array.apply(null, Array(helper.getClientCons())).map(String.prototype.valueOf, 'dud'), this.queueCallback)
  }

  spawnDownload = (uuid, strList, callback) => {
    var time,
      timer = null,
      script = helper.prefix + 'download ' + uuid;
    script += strList[2] + strList[1] + strList[0] + strList[3] + strList[4] + ' -n  1 ';
    console.log(script);
    if (!this.state.downloadStatus) callback('err')//ends all downloads
    var cmd = exec(script, { maxBuffer: 1024 * 1000 }, (error, stdout, stderr) => {
      if (error !== null) {
        console.log('exec error: ' + error);
        var tempStatusArray = this.state.uuidStatuses;
        var file = tempStatusArray.find(x => x.uuid === uuid);
        var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
        file.status = 'Failed'
        this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) });
        callback();
      }
    });
    var pid = cmd.pid;
    cmd.stdout.on('data', (data) => {
      console.log(data)
      var tempStatusArray = this.state.uuidStatuses;
      var file = tempStatusArray.find(x => x.uuid === uuid);
      var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
      this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) });

      if ((data.includes('100%') && data.includes('Successfully')) || data.includes('Time: 0:00:00')) {
        this.checkNumOfDownloads();
        file.status = 'Downloaded';
        clearInterval(timer);
        var regVar = /\s(\d+\.\d+\s+(?:kB|MB|GB)\/s)[\s\n\r]+SUMMARY/.exec(data.toString());
        file.speed = regVar[1];
        this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) });
        callback({ uuid: uuid, timer: timer, pid: pid });
      }
      else if (file.status !== 'Failed') {
        file.status = 'Downloading';
        this.checkNumOfDownloads();
        if (timer === null) {
          time = new Date().getTime();
          timer = setInterval(() => {
            var tempStatusArray = this.state.uuidStatuses;
            var file = tempStatusArray.find(x => x.uuid === uuid);
            var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
            file.time = '(' + helper.formatTime(new Date().getTime() - time) + ')';
            this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) });
          }, 1000);
        }
        this.downloadProcesses.push({ uuid: uuid, timer: timer, pid: pid });
      }
    });
    cmd.stderr.on('data', (data) => {
      console.log(data)
      var tempStatusArray = this.state.uuidStatuses;
      var file = tempStatusArray.find(x => x.uuid === uuid)
      var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
      file.status = data.includes('ERROR') ? 'Failed' : 'Downloading';
      this.checkNumOfDownloads();
      clearInterval(timer);
      if (file.status === 'Failed' || data.includes('Successfully'))
        callback({ uuid: uuid, timer: timer, pid: pid });
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

  componentWillMount = () => {
    this.queue = async.queue((uuid, callback) => {
      console.log(uuid);
      if (uuid === 'dud') callback();
      else if (this.state.uuidStatuses.find(x => x.uuid === uuid).status !== 'Removed')
        this.spawnDownload(uuid, this.prefList, callback)
      else callback();
    }, helper.getClientCons());

    this.queueCallback = () => {
      if (this.queueArr.length !== 0) {
        this.state.uuidStatuses.find(x => x.uuid === this.queueArr[0]).status !== 'Removed' ?
          this.queue.push(this.queueArr.shift(), this.queueCallback) : this.queueArr.shift();
      }
    }
    this.queue.drain = () => {
      console.log('Drained');
      this.setState({ downloadStatus: false });
    }
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
  display: 'inline-block',
  borderRadius: '4px',
  border: 'dashed 2px lightgrey',
  padding: '10px',
}