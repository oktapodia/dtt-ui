'use strict';
import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import async from 'async';
import * as helper from './Helper.js';
import uniqby from 'lodash/uniqby'
var exec = require('child_process').exec;
const { dialog } = require('electron').remote;

export default class Download extends Component {
  constructor(props) {
    super(props);
    this.state = {
      manifestFiles: [],
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
  }

  render = () => {
    return (
      <div>
        <Dropzone
          style={dropzoneStyle}
          onDrop={(acceptedFiles) => { this.handleManifestDrop(acceptedFiles); acceptedFiles = [] }}
          disableClick={true}
        >
          <div id="downloadOptionContainer" style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'no-wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={this.handleManifestDialog}>
                <i className="fa fa-plus" aria-hidden="true" />&nbsp;Manifest
                </button>
            </div>
            <div style={{flexGrow: 1}}>
              <textarea
                rows="1"
                placeholder="UUID(s)"
                style={{ width: '100%', boxSizing: 'border-box', resize: 'none' }}
                onChange={this.handleUUIDChange}>
              </textarea>
            </div>
            <div>
              <input
                type="checkbox"
                name="relatedFilesCheckBox"
                onChange={this.handleCheckRelatedFiles}
                checked={this.state.relatedFiles}
              />Related Files
                <input
                type="checkbox"
                name="annotationsCheckBox"
                onChange={this.handleCheckAnnotations}
                checked={this.state.annotations}
              />Annotations
                <button onClick={this.handleAddFiles}>Add Files</button>
            </div>
          </div>
          <br />
          <div style={{
            borderBottom: '0px',
            border: '1px solid',
            display: 'flex',
            justifyContent: 'space-around'
          }}>
            <span>UUID</span>
            <span>Size</span>
            <span>Status</span>
            <span>Speed</span>
          </div>
          <div className="tableContainer" style={{
            border: 'solid 1px',
            height: '90%',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {this.state.uuidStatuses.map(x =>
                <div style={{ tableLayout: 'fixed', display: 'flex', flexDirection: 'row', paddingBottom: '5px' }} key={x.uuid}>
                  <span style={{ width: '25%', textAlign: 'center' }}>{x.uuid}</span>
                  <span style={{ width: '25%', textAlign: 'center' }}>{x.size}</span>
                  <span style={{ width: '25%', textAlign: 'center' }}>{x.status} {x.time}</span>
                  <span style={{ width: '25%', textAlign: 'center' }}>{x.speed}
                    <button onClick={() => this.handleRemoveDownload(x.uuid)}><i className="fa fa-times" aria-hidden="true"></i></button>
                    <button onClick={() => this.handleUnshiftDownload(x.uuid)}><i className="fa fa-arrow-up" aria-hidden="true"></i></button>
                  </span>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <div>{this.state.statusStr}</div>
            <button
              style={{ display: 'flex', justifyContent: 'flex-end' }}
              onClick={this.state.downloadStatus === 'Downloading' ? this.handleStopDownload : this.handleDownload}>
              {this.state.downloadStatus === 'Downloading' ? 'Stop' :
                this.state.downloadStatus === 'Stopped' ? 'Resume' : 'Download'}
            </button>
          </div>
        </Dropzone>
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

  handleStopDownload = () => {
    helper.killProcesses(this.downloadProcesses);
    var tempStatusArray = this.state.uuidStatuses;
    tempStatusArray.forEach(obj => {
      if (obj.status !== 'Downloaded' || 'Failed')
        obj.status = 'Skipped'
    });
    this.setState({ uuidStatuses: tempStatusArray, downloadStatus: 'Stopped' }, this.checkNumOfDownloads);
  }

  handleAddFiles = () => {
    this.handleFileChange(this.state.uuidStr, this.state.manifestFiles);
    this.setState({ manifestFiles: '', uuidStr: '' });
  }

  handleDownload = () => {
    var tempStatusArray = this.state.uuidStatuses.map(x => {
      return {
        uuid: x.uuid, time: '', speed: '', size: x.size,
        status: x.status !== 'Removed' ? 'Not Started' : 'Removed'
      }
    });
    this.queueArr = [];
    this.props.clearLog();
    this.downloadProcesses = [];
    this.setState({ downloadStatus: 'Downloading', uuidStatuses: tempStatusArray });
    var relatedFilesStr = this.state.relatedFiles ? '' : ' --no-related-files ',
      annotationsStr = this.state.annotations ? '' : ' --no-annotations ';
    this.prefList = helper.getDownloadPrefs().concat([relatedFilesStr, annotationsStr]);
    this.queueArr = this.state.uuidStatuses.map(x => x.uuid);
    this.queue.push(Array.apply(null, Array(helper.getClientCons())).map(String.prototype.valueOf, 'dud'), this.queueCallback)//kickstart queue 
  }

  handleRemoveDownload = (uuid) => {
    var tempStatusArray = this.state.uuidStatuses;
    var file = tempStatusArray.find(x => x.uuid === uuid);
    var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
    file.status = 'Removed';
    if (this.state.downloadStatus === 'Downloading')
      helper.killProcess(this.downloadProcesses.find(x => x.uuid === uuid))
    this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) }, this.checkNumOfDownloads);
  }

  handleUnshiftDownload = (uuid) => {
    var tempStatusArray = this.state.uuidStatuses;
    var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
    tempStatusArray.unshift(tempStatusArray.splice(fileIndex, 1));
    this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) }, this.checkNumOfDownloads);
    if (this.state.downloadStatus === 'Downloading') {
      var queueIndex = this.queueArr.findIndex(x => x === uuid);
      this.queueArr.unshift(this.queueArr.splice(queueIndex, 1));
    }
  }

  handleFileChange = (uuids, manifestFiles) => {
    helper.requestDownloadStatuses(uuids.split(/\s+/), manifestFiles)
      .then(objs => {
        console.log(objs);
        if (this.state.downloadStatus !== 'Downloaded') {
          this.setState({ uuidStatuses: uniqby(this.state.uuidStatuses.concat(objs), 'uuid') }, this.checkNumOfDownloads);
          this.queueArr = this.queueArr.concat(uniqby(objs.map(x => x.uuid)));
        }
        else {
          this.setState({ uuidStatuses: objs }, this.checkNumOfDownloads)
          this.queueArr = objs.map(x => x.uuid)
        }
      });
    if (this.state.downloadStatus === 'Downloading')
      this.queue.push(Array.apply(null, Array(helper.getClientCons())).map(String.prototype.valueOf, 'dud'), this.queueCallback)//kickstart the new batch of downloads
  }

  spawnDownload = (uuid, strList, callback) => {
    var time,
      timer = null,
      script = helper.prefix + 'download ' + uuid;
    script += strList[0] + strList[1] + strList[2] + strList[3] + ' -n  1 ';
    console.log(script);
    if (!this.state.downloadStatus === 'Downloading') callback('err')//ends all downloads
    var cmd = exec(script, { maxBuffer: 1024 * 1000 }, (error, stdout, stderr) => {
      if (error !== null) {
        console.log('exec error: ' + error);
        var tempStatusArray = this.state.uuidStatuses;
        var file = tempStatusArray.find(x => x.uuid === uuid);
        var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
        file.status = 'Failed'
        this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) }, this.checkNumOfDownloads);
        callback();
      }
    });
    var pid = cmd.pid;
    cmd.stdout.on('data', (data) => {
      console.log(data)
      var tempStatusArray = this.state.uuidStatuses;
      var file = tempStatusArray.find(x => x.uuid === uuid);
      var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
      this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) }, this.checkNumOfDownloads);

      if (data.includes('100%') && (data.includes('Successfully') || data.includes('Time: 0:00:00'))) {
        file.status = 'Downloaded';
        clearInterval(timer);
        this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) }, this.checkNumOfDownloads);
        if (data.includes('Time: 0:00:00')) {//if file was already downloaded
          callback({ uuid: uuid, timer: timer, pid: pid });
        }
        var regVar = /\s(\d+\.\d+\s+(?:kB|MB|GB)\/s)[\s\n\r]+SUMMARY/.exec(data.toString());
        file.speed = regVar[1];
      }
      else if (file.status !== 'Failed') {
        file.status = 'Downloading';
        if (timer === null) {
          time = new Date().getTime();
          timer = setInterval(() => {
            var tempStatusArray = this.state.uuidStatuses;
            var file = tempStatusArray.find(x => x.uuid === uuid);
            var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
            file.time = '(' + helper.formatTime(new Date().getTime() - time) + ')';
            this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) }, this.checkNumOfDownloads);
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
      clearInterval(timer);
      if (file.status === 'Failed' || data.includes('Successfully'))
        callback({ uuid: uuid, timer: timer, pid: pid });
      this.setState({ uuidStatuses: Object.assign(tempStatusArray, { [fileIndex]: file }) }, this.checkNumOfDownloads);
      this.props.appendLog(data);
    });
  }

  checkNumOfDownloads = () => {
    var statuses = {
      Downloaded: 0, Removed: 0, Skipped: 0,
      Downloading: 0, Failed: 0, 'Not Started': 0
    }
    var statusStr = '';
    this.state.uuidStatuses.forEach((x) => statuses[x.status] += 1)
    for (status in statuses) {
      statusStr += status + ': ' + statuses[status] + ' ';
    }
    this.setState({ statusStr: statusStr });
  }

  queueCallback = () => {
    if (this.queueArr.length !== 0) {
      this.state.uuidStatuses.find(x => x.uuid === this.queueArr[0]).status === 'Not Started' ?
        this.queue.push(this.queueArr.shift(), this.queueCallback) : this.queueArr.shift();
    }
  }
  componentDidMount = () => {
    this.queue = async.queue((uuid, callback) => {
      console.log(uuid);
      if (uuid === 'dud') { callback(); }//only kickstarters have 'dud' as uuid
      else if (this.state.uuidStatuses.find(x => x.uuid === uuid).status === 'Not Started') {
        this.spawnDownload(uuid, this.prefList, callback)
      }
      else { callback(); }
    }, helper.getClientCons());

    this.queue.drain = () => {
      console.log('Drained');
      this.setState({ downloadStatus: 'Downloaded' });
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
  height: '80%',
  borderRadius: '4px',
  padding: '10px',
}