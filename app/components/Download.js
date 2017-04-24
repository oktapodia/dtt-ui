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
      statusStr: '',
      downloadStep: 0,
      message: ''
    };
    this.downloadProcesses = [];
    this.queueArr = [];
    this.prefList = '';
    this.queue = null;
  }

  render = () => {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '3px',
        height: '88%'
      }}>
        <Dropzone
          style={dropzoneStyle}
          onDrop={(acceptedFiles) => { this.handleManifestDrop(acceptedFiles); acceptedFiles = [] }}
          disableClick={true}
        >
          <div id="downloadOptionContainer" style={{
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
            <div style={{ flexGrow: 1 }}>
              <textarea
                rows="1"
                placeholder="UUID(s)"
                style={{ width: '100%', boxSizing: 'border-box', resize: 'none' }}
                onChange={this.handleUUIDChange}>
              </textarea>
            </div>
            <div style={(this.state.downloadStep < 1) ? hiddenStyle : {}}>
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
            height: '100%',
            border: '1px solid',
            overflow: 'auto'
          }}>
            <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ fontSize: '14px', borderBottom: '1px solid' }}>
                <tr>
                  <th>Actions</th>
                  <th>Name</th>
                  <th>UUID</th>
                  <th>Access</th>
                  <th>Size</th>
                  <th>Related Files</th>
                  <th>Annotations</th>
                  <th>Status</th>
                  <th>Speed</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '12px' }}>
                {this.state.uuidStatuses.map(x =>
                  <tr key={x.uuid}>
                    <td>
                      <button onClick={() => this.handleRemoveDownload(x.uuid)}><i className="fa fa-times" aria-hidden="true"></i></button>
                      <button onClick={() => this.handleUnshiftDownload(x.uuid)}><i className="fa fa-arrow-up" aria-hidden="true"></i></button>
                    </td>
                    <td style={{ textAlign: 'center' }}>{x.name}</td>
                    <td style={{ textAlign: 'center' }}>{x.uuid}</td>
                    <td style={{ textAlign: 'center' }}>{x.access}</td>
                    <td style={{ textAlign: 'center' }}>{x.size}</td>
                    <td style={{ textAlign: 'center' }}>{x.rel}</td>
                    <td style={{ textAlign: 'center' }}>{x.ann}</td>
                    <td style={{ textAlign: 'center' }}>{x.status} {x.time}</td>
                    <td style={{ textAlign: 'center' }}>{x.speed}</td>
                  </tr>
                )}
              </tbody>
            </table>
            {this.state.uuidStatuses.length === 0 ?
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'center', justifyContent: 'center', alignItems: 'center', height: '100%' }} >
                <div>
                  No files added to queue. Drag and drop or browse manifests from the toolbar above.
                  Files can also been selected by UUID in the text box.
                  </div>
              </div>
              : ''}
          </div>

          <div>
            <div style={{ float: 'right' }}>
              <button
                style={(this.state.uuidStatuses.length <= 0) ? hiddenStyle : {}}
                onClick={this.handleClear}
              > Clear
              </button>
              <button
                style={(this.state.uuidStatuses.length <= 0) ? hiddenStyle : {}}
                onClick={this.state.downloadStatus === 'Downloading' ? this.handleStopAllDownloads : this.handleAllDownloads}>
                {this.state.downloadStatus === 'Downloading' ? 'Stop' :
                  this.state.downloadStatus === 'Stopped' ? 'Resume' : 'Download'}
              </button>
            </div>
            <div>{this.state.statusStr}</div>
          </div>
        </Dropzone>
      </div >)
  }
  handleManifestDrop = (paths) => {
    try {
      var files = paths.map(file => file.path);
      if (files.length > 0) {
        helper.checkValidManifest(files)
          .then(arr => {
            var excludedFiles = arr[0],
              message = arr[1];
            console.log(excludedFiles, message.toString());
            files = files.filter(x => excludedFiles.indexOf(x) === -1)//remove invalid files from list of files
            this.setState({ manifestFiles: files, message: message });
            if (files.length > 0)//if there are valid files
              this.setState({ downloadStep: 1 })
          });
      }
    }
    catch (e) { console.log(e); this.setState({ manifestFiles: '' }) }

    this.setState({ manifestFiles: filePaths });
  }

  handleUUIDChange = (e) => {
    this.setState({ uuidStr: e.target.value });
    var uuids = e.target.value.split(/\s+/);
    var validUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    uuids.filter(x => validUUID.test(x)).length > 0 ? this.setState({ downloadStep: 1 }) : '';
  }

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
      try {
        if (files.length > 0) {
          helper.checkValidManifest(files)
            .then(arr => {
              var excludedFiles = arr[0],
                message = arr[1];
              console.log(excludedFiles, message.toString());
              excludedFiles = uniqby(excludedFiles);//remove dupes from returned array
              files = files.filter(x => excludedFiles.indexOf(x) === -1)//remove invalid files from list of files
              this.setState({ manifestFiles: files, message: message });
              if (files.length > 0)//if there are valid files
                this.setState({ downloadStep: 1 })
            });
        }
      }
      catch (e) { console.log(e); this.setState({ manifestFiles: '' }) }
    });
  handleStopAllDownloads = () => {
    helper.killProcesses(this.downloadProcesses);
    var tempStatusArray = this.state.uuidStatuses;
    tempStatusArray.forEach(obj => {
      if (obj.status !== 'Downloaded' || 'Failed')
        obj.status = 'Skipped'
    });
    this.setState({ uuidStatuses: tempStatusArray, downloadStatus: 'Stopped' }, this.checkNumOfDownloads);
  }

  handleClear = () => {
    this.handleStopAllDownloads();
    this.setState({ uuidStatuses: [], downloadStatus: 'Downloaded' })
  }
  handleAddFiles = () => {
    this.handleFileChange(this.state.uuidStr, this.state.manifestFiles);
    this.setState({ manifestFiles: '', uuidStr: '', downloadStep: 2 });
  }

  handleDownload = (uuid) => {
    var file = tempStatusArray.find(x => x.uuid === uuid);
    var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid);
    this.queueArr.push()
  }
  handleAllDownloads = () => {
    console.log(this.queue.workersList());
    var tempStatusArray = this.state.uuidStatuses.map(x => {
      return { ...x, time: '', speed: '', status: 'Not Started' }
    });
    this.props.clearLog();
    this.downloadProcesses = [];
    this.setState({ downloadStatus: 'Downloading', uuidStatuses: tempStatusArray, downloadStep: 0 });
    this.prefList = helper.getDownloadPrefs();
    this.queueArr = this.state.uuidStatuses.map(x => x.uuid);
    this.queue.push(Array.apply(null, Array(helper.getClientCons())).map(String.prototype.valueOf, 'dud'), this.queueCallback)//kickstart queue 
    console.log(this.queue.workersList());
  }

  handleRemoveDownload = (uuid) => {
    var tempStatusArray = this.state.uuidStatuses;
    var file = tempStatusArray.find(x => x.uuid === uuid);
    var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
    file.status = 'Skipped';
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
    helper.requestDownloadStatuses(uuids.split(/\s+/), manifestFiles, this.state.relatedFiles, this.state.annotations)
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
    var status = 'Not Done';//ensures that callback() isn't called multiple times
    var time,
      timer = null,
      script = helper.prefix + 'download ' + uuid;
    script += strList[0] + strList[1] + strList[2] + strList[3] + ' -n  1 ';
    console.log(script);
    if (!this.state.downloadStatus === 'Downloading' && status === 'Not Done') {
      console.log('stopped callback');
      status = 'Done'
      callback('err')//ends all downloads
    }
    if (this.state.downloadStatus === 'Downloading') {
      var cmd = exec(script, { maxBuffer: 1024 * 1000 }, (error, stdout, stderr) => {
        if (error !== null) {
          console.log('exec error: ' + error);
          var tempStatusArray = this.state.uuidStatuses;
          var file = tempStatusArray.find(x => x.uuid === uuid);
          var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
          file.status = 'Failed'
          this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) }, this.checkNumOfDownloads);
          if (status === 'Not Done') {
            console.log('failed callback')
            status = 'Done'
            callback();
          }
        }
      });
    }
    else { callback() };
    var pid = cmd.pid;
    cmd.stdout.on('data', (data) => {
      if (this.state.downloadStatus === 'Downloading') {
        console.log(data)
        var tempStatusArray = this.state.uuidStatuses;
        var file = tempStatusArray.find(x => x.uuid === uuid);
        var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid);

        if (data.includes('100%') && (data.includes('Successfully') || data.includes('Time: 0:00:00'))) {
          file.status = 'Downloaded';
          clearInterval(timer);
          this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) }, this.checkNumOfDownloads);
          if (status === 'Not Done') {
            console.log('downloaded callback')
            status = 'Done'
            callback({ uuid: uuid, timer: timer, pid: pid });
          }
          if (!data.includes('Time: 0:00:00') && data.includes('Successfully')) {//if file was already downloaded
            var regVar = /\s(\d+\.\d+\s+(?:kB|MB|GB)\/s)[\s\n\r]+SUMMARY/.exec(data.toString());
            file.speed = regVar[1];
          }
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
      }
    });
    cmd.stderr.on('data', (data) => {
      console.log(data)
      if (this.state.downloadStatus === 'Downloading') {
        var tempStatusArray = this.state.uuidStatuses;
        var file = tempStatusArray.find(x => x.uuid === uuid)
        var fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid)
        file.status = data.includes('ERROR') ? 'Failed' : 'Downloading';
        clearInterval(timer);
        if ((file.status === 'Failed' || data.includes('Successfully')) && status === 'Not Done') {
          console.log('stderr callback');
          status = 'Done';
          callback({ uuid: uuid, timer: timer, pid: pid });
        }
        this.setState({ uuidStatuses: Object.assign(tempStatusArray, { [fileIndex]: file }) }, this.checkNumOfDownloads);
        this.props.appendLog(data);
      }
    });
  }

  checkNumOfDownloads = () => {
    var statuses = {
      Downloaded: 0, Skipped: 0,
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
      this.queue.push(this.queueArr.shift(), this.queueCallback)
    }
  }

  componentDidMount = () => {
    this.queueTemplate = async.queue((uuid, callback) => {
      if (uuid === 'dud') {//only kickstarters have 'dud' as uuid
        callback();
      }
      else if (this.state.downloadStatus === 'Downloading' && this.state.uuidStatuses.find(x => x.uuid === uuid).status === 'Not Started') {
        var obj = this.state.uuidStatuses.find(x => x.uuid === uuid);
        var rel = obj.rel === 'true' ? '' : ' --no-related-files '
        var ann = obj.ann === 'true' ? '' : ' --no-annotations '
        this.prefList = this.prefList.concat([rel, ann])
        this.state.uuidStatuses.find(x => x.uuid === uuid).status
        this.spawnDownload(uuid, this.prefList, callback)
      }
      else {
        callback();
      }
    }, helper.getClientCons());
    this.queue = this.queueTemplate;
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

const hiddenStyle = {
  opacity: '0.3',
  pointerEvents: 'none'
}
const dropzoneStyle = {
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '4px',
}