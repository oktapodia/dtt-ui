import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import async from 'async';
import * as helper from './Helper.js';
import uniqby from 'lodash/uniqby';
import { exec } from 'child_process';
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
      message: '' // any errors or warnings should be put in here
    };
    this.downloadProcesses = [];
    this.queueArr = []; // the uuids to be put in queue
    this.prefList = ''; // holds the prefs to be used for each download
    this.queue = null;
  }

  render = () =>
    <div
      className="mainContainer"
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '3px',
        height: '88%'
      }}
    >
      <Dropzone
        style={dropzoneStyle}
        onDrop={acceptedFiles => {
          this.handleManifestDrop(acceptedFiles);
          acceptedFiles = [];
        }}
        disableClick
      >
        <div
          id="downloadOptionContainer"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'no-wrap'
          }}
        >
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
              onChange={this.handleUUIDChange}
            />
          </div>
          <div style={this.state.downloadStep < 1 ? hiddenStyle : {}}>
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

        <div
          style={{
            height: '100%',
            border: '1px solid',
            overflow: 'auto'
          }}
        >
          {this.state.uuidStatuses.length > 0 &&
            <table className="pure-table">
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
                  <tr
                    key={x.uuid}
                    // style={{ verticalAlign: 'top', borderBottom: '1px solid lightgrey' }}
                  >
                    <td>
                      <button
                        onClick={() => {
                          this.state.uuidStatuses.find(y => y.uuid === x.uuid).status ===
                            'Downloading'
                            ? this.handleStopDownload(x.uuid)
                            : this.handleDownload(x.uuid);
                        }}
                      >
                        {this.state.uuidStatuses.find(y => y.uuid === x.uuid).status ===
                          'Downloading'
                          ? <i className="fa fa-stop" aria-hidden="true" />
                          : <i className="fa fa-play" aria-hidden="true" />}
                      </button>
                      <button onClick={() => this.handleRemoveDownload(x.uuid)}>
                        <i className="fa fa-trash" aria-hidden="true" />
                      </button>
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
            </table>}
          {this.state.uuidStatuses.length === 0
            ? <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'center',
                justifyContent: 'center',
                alignItems: 'center',
                height: 'calc(100% - 19px)'
              }}
            >
              <div>
                  No files added to queue. Drag and drop or browse manifests from the toolbar
                  above.
                  Files can also been selected by UUID in the text box.
                </div>
            </div>
            : ''}
        </div>
        <div>
          <div style={{ float: 'right' }}>
            <button
              style={this.state.uuidStatuses.length <= 0 ? hiddenStyle : {}}
              onClick={this.handleClear}
            >
              {' '}Clear
            </button>
            <button
              style={this.state.uuidStatuses.length <= 0 ? hiddenStyle : {}}
              onClick={
                this.state.downloadStatus === 'Downloading'
                  ? this.handleStopAllDownloads
                  : this.handleAllDownloads
              }
            >
              {this.state.downloadStatus === 'Downloading'
                ? 'Stop'
                : this.state.downloadStatus === 'Stopped' ? 'Resume' : 'Download'}
            </button>
          </div>
          <div>{this.state.statusStr}</div>
        </div>
      </Dropzone>
    </div>;

  handleManifestDrop = paths => {
    try {
      let files = paths.map(file => file.path);
      if (files.length > 0) {
        helper.checkValidManifest(files).then(arr => {
          let excludedFiles = arr[0],
            message = arr[1];
          files = files.filter(x => excludedFiles.indexOf(x) === -1); // remove invalid files from list of files
          this.setState({ manifestFiles: files, message });
          if (
            files.length > 0 // if there are valid files
          ) {
            this.setState({ downloadStep: 1 });
          } else this.setState({ downloadStep: 0 });
        });
      }
    } catch (e) {
      this.setState({ manifestFiles: '' });
    }

    this.setState({ manifestFiles: filePaths });
  };

  handleUUIDChange = e => {
    this.setState({ uuidStr: e.target.value });
    const uuids = e.target.value.split(/\s+/);
    const validUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    // if there are any valid uuids or not
    uuids.filter(x => validUUID.test(x)).length > 0
      ? this.setState({ downloadStep: 1 })
      : this.setState({ downloadStep: 0 });
  };

  handleResetManifestFile = () => this.setState({ manifestFiles: '' });

  handleResetDownloadFolder = () => this.setState({ downloadFolder: '' });

  handleCheckAnnotations = () => this.setState({ annotations: !this.state.annotations });

  handleCheckRelatedFiles = () => this.setState({ relatedFiles: !this.state.relatedFiles });

  handleManifestDialog = () => {
    dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] }, files => {
      try {
        if (files.length > 0) {
          helper.checkValidManifest(files).then(arr => {
            let excludedFiles = arr[0],
              message = arr[1];
            excludedFiles = uniqby(excludedFiles); // remove dupes from returned array
            files = files.filter(x => excludedFiles.indexOf(x) === -1); // remove invalid files from list of files
            this.setState({ manifestFiles: files, message });
            if (
              files.length > 0 // if there are valid files
            ) {
              this.setState({ downloadStep: 1 });
            } else this.setState({ downloadStep: 0 });
          });
        }
      } catch (e) {
        console.log(e);
        this.setState({ manifestFiles: '' });
      }
    });
  };

  handleStopDownload = uuid => {
    helper.killProcess(this.downloadProcesses.find(x => x.uuid === uuid));
    this.downloadProcesses.splice(this.downloadProcesses.findIndex(x => x.uuid === uuid), 1); // remove download process once done, otherwise restarting a download makes two processes with the same uuid
    const tempStatusArray = this.state.uuidStatuses;
    const file = tempStatusArray.find(x => x.uuid === uuid);
    const fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid);
    file.status = 'Stopped';
    this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) }, () => {
      helper.saveState(this.state);
      this.checkNumOfDownloads();
    });
  };

  handleStopAllDownloads = () => {
    helper.killProcesses(this.downloadProcesses);
    const tempStatusArray = this.state.uuidStatuses;
    tempStatusArray.forEach(obj => {
      if (obj.status !== 'Downloaded' && obj.status !== 'Failed') obj.status = 'Stopped';
    });
    this.setState({ uuidStatuses: tempStatusArray, downloadStatus: 'Stopped' }, () => {
      helper.saveState(this.state);
      this.checkNumOfDownloads();
    });
  };

  handleClear = () => {
    this.handleStopAllDownloads();
    this.setState({ uuidStatuses: [], downloadStatus: 'Downloaded' });
  };

  handleAddFiles = () => {
    this.handleFileChange(this.state.uuidStr, this.state.manifestFiles);
    this.setState({ manifestFiles: '', uuidStr: '', downloadStep: 0 }, () => {
      helper.saveState(this.state);
      this.checkNumOfDownloads();
    });
  };

  handleDownload = uuid => {
    this.prefList = helper.getDownloadPrefs();
    const tempStatusArray = this.state.uuidStatuses;
    const file = tempStatusArray.find(x => x.uuid === uuid);
    const fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid);
    file.indivDownload = true;
    file.status = 'Downloading';
    this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) }, () => {
      this.queue.unshift(uuid); // ignore callback with this download
      helper.saveState(this.state);
      this.checkNumOfDownloads();
    });
  };

  handleAllDownloads = () => {
    this.prefList = helper.getDownloadPrefs();
    const tempStatusArray = this.state.uuidStatuses.map(x => ({
      ...x,
      time: '',
      speed: '',
      status: x.indivDownload
        ? this.state.downloadStatus === 'Downloaded' ? 'Not Started' : x.status
        : 'Not Started',
      indivDownload: this.state.downloadStatus !== 'Downloaded'
    }));
    this.props.clearLog();
    this.downloadProcesses = [];
    this.setState({
      downloadStatus: 'Downloading',
      uuidStatuses: tempStatusArray,
      downloadStep: 0
    });
    this.queueArr = this.state.uuidStatuses.map(x => x.uuid);
    this.queue.push(
      Array(...Array(helper.getClientCons())).map(String.prototype.valueOf, 'dud'),
      this.queueCallback
    ); // kickstart queue
  };

  handleRemoveDownload = uuid => {
    const tempStatusArray = this.state.uuidStatuses;
    const fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid);
    tempStatusArray.splice(fileIndex, 1);
    if (this.state.downloadStatus === 'Downloading') {
      helper.killProcess(this.downloadProcesses.find(x => x.uuid === uuid));
    }
    this.setState({ uuidStatuses: tempStatusArray });
    console.log(tempStatusArray);
  };

  handleUnshiftDownload = uuid => {
    const tempStatusArray = this.state.uuidStatuses;
    const fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid);
    tempStatusArray.unshift(tempStatusArray.splice(fileIndex, 1));
    this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) }, () => {
      helper.saveState(this.state);
      this.checkNumOfDownloads();
    });
    if (this.state.downloadStatus === 'Downloading') {
      const queueIndex = this.queueArr.findIndex(x => x === uuid);
      this.queueArr.unshift(this.queueArr.splice(queueIndex, 1));
    }
  };

  handleFileChange = (uuids, manifestFiles) => {
    helper
      .requestDownloadStatuses(
        uuids.split(/\s+/),
        manifestFiles,
        this.state.relatedFiles,
        this.state.annotations
      )
      .then(objs => {
        if (this.state.downloadStatus !== 'Downloaded') {
          this.setState(
            { uuidStatuses: uniqby(this.state.uuidStatuses.concat(objs), 'uuid') },
            () => {
              helper.saveState(this.state);
              this.checkNumOfDownloads();
            }
          );
          this.queueArr = this.queueArr.concat(uniqby(objs.map(x => x.uuid)));
        } else {
          this.setState({ uuidStatuses: objs }, () => {
            helper.saveState(this.state);
            this.checkNumOfDownloads();
          });
          this.queueArr = objs.map(x => x.uuid);
        }
        if (this.state.downloadStatus === 'Downloading') {
          this.queue.push(
            Array(...Array(helper.getClientCons())).map(String.prototype.valueOf, 'dud'),
            this.queueCallback
          );
        } // kickstart the new batch of downloads
      });
  };

  spawnDownload = (uuid, strList, callback) => {
    const obj = this.state.uuidStatuses.find(x => x.uuid === uuid);
    let status = 'Not Done'; // ensures that callback() isn't called multiple times
    let time,
      timer = null,
      script = `${helper.prefix}download ${uuid}`;
    script += `${strList[0] + strList[1] + strList[2] + strList[3]} -n  1 `;
    console.log(script); // -n 1 uses the least amount of cores
    if (!this.state.downloadStatus === 'Downloading' && status === 'Not Done') {
      console.log('stopped callback');
      status = 'Done';
      callback();
    }
    if (this.state.downloadStatus === 'Downloading' || obj.indivDownload) {
      var cmd = exec(script, { maxBuffer: 1024 * 1000 }, (error, stdout, stderr) => {
        if (error !== null) {
          console.log(`exec error: ${error}`);
          const tempStatusArray = this.state.uuidStatuses;
          const file = tempStatusArray.find(x => x.uuid === uuid);
          const fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid);
          file.status = 'Failed';
          this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) }, () => {
            helper.saveState(this.state);
            this.checkNumOfDownloads();
          });
          if (status === 'Not Done') {
            console.log('failed callback');
            status = 'Done';
            callback();
          }
        }
      });
      var pid = cmd.pid;
    } else {
      callback();
    }

    cmd.stdout.on('data', data => {
      if (this.state.downloadStatus === 'Downloading' || obj.indivDownload) {
        console.log(data);
        const tempStatusArray = this.state.uuidStatuses;
        const file = tempStatusArray.find(x => x.uuid === uuid);
        const fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid);

        if (
          data.includes('100%') &&
          (data.includes('Successfully') || data.includes('Time: 0:00:00'))
        ) {
          file.status = 'Downloaded';
          clearInterval(timer);
          this.setState({ uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) }, () => {
            helper.saveState(this.state);
            this.checkNumOfDownloads();
          });
          if (status === 'Not Done') {
            console.log('downloaded callback');
            status = 'Done';
            callback({ uuid, timer, pid });
          }
          if (!data.includes('Time: 0:00:00') && data.includes('Successfully')) {
            // if file was already downloaded
            const regVar = /\s(\d+\.\d+\s+(?:kB|MB|GB)\/s)[\s\n\r]+SUMMARY/.exec(data.toString());
            file.speed = regVar[1];
          }
        } else if (file.status !== 'Failed') {
          file.status = 'Downloading';
          if (timer === null) {
            time = new Date().getTime();
            timer = setInterval(() => {
              const tempStatusArray = this.state.uuidStatuses;
              const file = tempStatusArray.find(x => x.uuid === uuid);
              const fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid);
              file.time = `(${helper.formatTime(new Date().getTime() - time)})`;
              this.setState(
                { uuidStatuses: Object(tempStatusArray, { [fileIndex]: file }) },
                () => {
                  helper.saveState(this.state);
                  this.checkNumOfDownloads();
                }
              );
            }, 1000);
          }
          const process = this.downloadProcesses.find(x => x.uuid === uuid);
          const processIndex = this.downloadProcesses.findIndex(x => x.uuid === uuid);
          this.downloadProcesses[processIndex] = { ...process, pid, timer };
          console.log(this.downloadProcesses[processIndex]);
        }
      }
    });
    cmd.stderr.on('data', data => {
      console.log(data);
      if (this.state.downloadStatus === 'Downloading') {
        const tempStatusArray = this.state.uuidStatuses;
        const file = tempStatusArray.find(x => x.uuid === uuid);
        const fileIndex = tempStatusArray.findIndex(x => x.uuid === uuid);
        file.status = data.includes('ERROR') ? 'Failed' : 'Downloading';
        clearInterval(timer);
        if ((file.status === 'Failed' || data.includes('Successfully')) && status === 'Not Done') {
          console.log('stderr callback');
          status = 'Done';
          callback({ uuid, timer, pid });
        }
        this.setState(
          { uuidStatuses: Object.assign(tempStatusArray, { [fileIndex]: file }) },
          () => {
            helper.saveState(this.state);
            this.checkNumOfDownloads();
          }
        );
        this.props.appendLog(data);
      }
    });
  };

  checkNumOfDownloads = () => {
    const statuses = {
      Downloaded: 0,
      Stopped: 0,
      Downloading: 0,
      Failed: 0,
      'Not Started': 0
    };
    let statusStr = '';
    this.state.uuidStatuses.forEach(x => (statuses[x.status] += 1));
    for (status in statuses) {
      statusStr += `${status}: ${statuses[status]} `;
    }
    this.setState({ statusStr });
  };

  queueCallback = () => {
    if (this.queueArr.length !== 0) {
      this.queue.push(this.queueArr.shift(), this.queueCallback);
    }
  };

  componentWillMount = () => {
    const state = helper.getState();
    if (state) {
      if (state.downloadStatus === 'Downloading') {
        state.downloadStatus = 'Stopped';
      }
      state.uuidStatuses.forEach(obj => {
        if (obj.status === 'Downloading') {
          obj.status = 'Stopped';
        }
      });
      this.setState(state);
    }
  };

  componentDidMount = () => {
    this.queue = async.queue((uuid, callback) => {
      const obj = this.state.uuidStatuses.find(x => x.uuid === uuid);
      try {
        if (uuid === 'dud') {
          // only kickstarters have 'dud' as uuid
          callback();
          console.log('lol');
        } else if (
          (this.state.downloadStatus === 'Downloading' && obj.status === 'Not Started') ||
          (obj.status === 'Downloading' && obj.indivDownload)
        ) {
          console.log('lmao');
          const rel = obj.rel === 'true' ? '' : ' --no-related-files ';
          const ann = obj.ann === 'true' ? '' : ' --no-annotations ';
          this.state.uuidStatuses.find(x => x.uuid === uuid).status;
          this.downloadProcesses.push({ uuid, timer: null, pid: null, callback });
          this.spawnDownload(uuid, this.prefList.concat([rel, ann]), callback);
        } else {
          callback();
        }
      } catch (e) {
        console.log(e);
        callback();
      }
    }, helper.getClientCons());

    this.queue.drain = () => {
      console.log('Drained');
      this.setState({ downloadStatus: 'Downloaded' });
    };
  };
}

const mainStyle = {
  display: 'flex',
  flexDirection: 'column'
};
const textAreaStyle = {
  resize: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden'
};

const hiddenStyle = {
  opacity: '0.3',
  pointerEvents: 'none'
};
const dropzoneStyle = {
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '4px'
};
