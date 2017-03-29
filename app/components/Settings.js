import React, { Component } from 'react';
import fs from 'fs';
import os from 'os';
var yaml = require('js-yaml');
const { dialog } = require('electron').remote;

var homedir = os.homedir();
var isWin = /^win/.test(process.platform);
var dir = isWin ? homedir + '\\AppData\\Roaming\\dtt\\' : homedir + '/.dtt/';


export default class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.defaultSettings = {
      server: 'https://gdc-api.nci.nih.gov/',
      port: '443',
      numClientCons: '3',
      createLogFile: false,
      logDestination: homedir,
      debugLogging: false,
      verboseLogging: false,
      blockSize: '1048576',
      saveInterval: '1000000',
      calcInSegAndCheckMd5: true,
      checkMd5: true,
      autoRetry: true,
      numRetrys: '5',
      retryInterval: '5',
      multipartUpload: false,
      partSize: '1073741824'
    }
    this.state = {}
  }
  render() {
    return (
      <div className="mainSettings">
        <div>
          <h2>Settings</h2>
          <div>
            <button onClick={this.handleDefaultSettings}>Reset to Default Settings</button>
            <button onClick={this.handleSaveSettings}>Save Settings</button>
          </div>
        </div>
        <div id="connectionSettings">
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div>Server</div>
            &nbsp;
                        <textarea
              style={textAreaStyle}
              rows="1"
              cols="40"
              value={this.state.server}
              onChange={this.handleServerChange}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div>Port</div>
            &nbsp;
                        <textarea
              style={textAreaStyle}
              rows="1"
              cols="40"
              value={this.state.port}
              onChange={this.handlePortChange}
            />
          </div>
        </div>
        <div id="uploadDownloadSettings">
          <h3>Parameters for Download and Upload</h3>
          <div style={{ display: "flex", flexDirection: "row" }}>
            <div>Number of Client Connections (max 6)</div>
            &nbsp;
                        <textarea
              style={textAreaStyle}
              rows="1"
              cols="20"
              value={this.state.numClientCons}
              onChange={this.handleNumClientCons}
            />
          </div>
          <div>
            <div style={{ display: "flex", flexDirection: "row" }}>
              <input
                type="checkbox"
                checked={this.state.createLogFile}
                onChange={this.handleLogFile}
              />Create Log File
                            <textarea
                style={textAreaStyle}
                rows="1"
                cols="20"
                value={this.state.logDestination}
                onChange={this.handleLogDestination}
              />
              <button onClick={this.handleLogDestDialog}>Browse</button>
            </div>
          </div>
          <div>
            <input
              type="checkbox"
              checked={this.state.debugLogging}
              onChange={this.handleDebugLogging}
            />Debug Logging
                    </div>
          <div>
            <input
              type="checkbox"
              checked={this.state.verboseLogging}
              onChange={this.handleVerboseLogging}
            />Verbose Logging
                    </div>
        </div>
        <div style={{ display: "flex", flexDirection: "row" }}>
          <div id="downloadSettings">
            <h3>Parameters for Download</h3>
            <div style={{ display: "flex", flexDirection: "row" }}>
              <div>Block Size</div>
              &nbsp;
                        <textarea
                style={textAreaStyle}
                rows="1"
                cols="20"
                value={this.state.blockSize}
                onChange={this.handleBlockSize}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "row" }}>
              <div>Save Interval</div>
              &nbsp;
                            <textarea
                style={textAreaStyle}
                rows="1"
                cols="20"
                value={this.state.saveInterval}
                onChange={this.handleSaveInterval}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div>
                <input
                  type="checkbox"
                  checked={this.state.calcInSegAndCheckMd5}
                  onChange={this.handleInSegAndMd5}
                />Calculate Inbound Segment and check Md5sum on Restart
                        </div>
              <div>
                <input
                  type="checkbox"
                  checked={this.state.checkMd5}
                  onChange={this.handleMd5}
                />Check Md5sum after Download
                            </div>
            </div>
            <div>
              <div>Retries after Downloads</div>
              <div>
                <input
                  type="checkbox"
                  checked={this.state.autoRetry}
                  onChange={this.handleAutoRetry}
                />Auto Retry
                            </div>
              <div>
                <textarea
                  style={textAreaStyle}
                  rows="1"
                  cols="2"
                  value={this.state.numRetrys}
                  onChange={this.handleNumRetrys}
                />Retry(s)
                            </div>
              <div>
                <textarea
                  style={textAreaStyle}
                  rows="1"
                  cols="2"
                  value={this.state.retryInterval}
                  onChange={this.handleRetryInterval}
                />Seconds between Retrys
                            </div>
            </div>
          </div>
          &nbsp;&nbsp;&nbsp;
                    <div>
            <h3>Parameters for Upload</h3>
            <div>
              <input
                type="checkbox"
                checked={this.state.multipartUpload}
                onChange={this.handleMultipartUpload}
              />Enable Multipart Upload
                        </div>
            <div>
              Part Size (Bytes)
                            <textarea
                style={textAreaStyle}
                rows="1"
                cols="20"
                value={this.state.partSize}
                onChange={this.handlePartSize}
              />
            </div>
          </div >
        </div>
      </div >
    )
  }
  handleServerChange = (e) => this.setState({ server: e.target.value });
  handlePortChange = (e) => this.setState({ port: e.target.value });
  handleNumClientCons = (e) => this.setState({ numClientCons: e.target.value });
  handleLogFile = () => this.setState({ createLogFile: !this.state.createLogFile });
  handleLogDestination = (e) => this.setState({ logDestination: e.target.value });
  handleLogDestDialog = (e) => dialog.showOpenDialog({ properties: ['openDirectory'] }, (dirName) => {
    try { this.setState({ logDestination: dirName[0] }) }
    catch (e) { this.setState({ logDestination: '' }) }
  });
  handleDebugLogging = () => this.setState({ debugLogging: !this.state.debugLogging });
  handleVerboseLogging = () => this.setState({ verboseLogging: !this.state.verboseLogging });
  handleBlockSize = (e) => this.setState({ blockSize: e.target.value });
  handleSaveInterval = (e) => this.setState({ saveInterval: e.target.value })
  handleInSegAndMd5 = () => this.setState({ calcInSegAndCheckMd5: !this.state.calcInSegAndCheckMd5 })
  handleMd5 = () => this.setState({ checkMd5: !this.state.checkMd5 });
  handleAutoRetry = () => this.setState({ autoRetry: !this.state.autoRetry });
  handleNumRetrys = (e) => this.setState({ numRetrys: e.target.value });
  handleRetryInterval = (e) => this.setState({ retryInterval: e.target.value });
  handleMultipartUpload = () => this.setState({ multipartUpload: !this.state.multipartUpload });
  handlePartSize = (e) => this.setState({ partSize: e.target.value });

  handleDefaultSettings = () => this.setState(this.defaultSettings);
  handleSaveSettings = () => {
    var obj = Object.keys(this.state).length === 0 ? this.defaultSettings : this.state;
    var params = {
      connectionsParams: {
        server: obj.server !== this.defaultSettings.server ? ' -s ' + obj.server : false,
        port: obj.port !== this.defaultSettings.port ? ' -P ' + obj.port : false
      },
      bothParams: {
        numClientCons: obj.numClientCons <= 6 ? obj.numClientCons : 3,
        // createLogFile: obj.createLogFile  ? ' --log-file ' + obj.logDestination : false,
        debugLogging: obj.debugLogging ? ' --debug' : false,
        verboseLogging: obj.verboseLogging ? ' --v' : false
      },
      downloadParams: {
        blockSize: obj.blockSize !== this.defaultSettings.blockSize ?
          ' --http-chunk-size ' + obj.blockSize : false,

        saveInterval: obj.saveInterval !== this.defaultSettings.saveInterval ?
          ' --save-interval ' + obj.saveInterval : false,

        calcInSegAndCheckMd5: !obj.calcInSegAndCheckMd5 ? ' --no-segment-md5sums' : false,
        checkMd5: !obj.checkMd5 ? ' --no-file-md5sum' : false,
        // autoRetry: !obj.autoRetry ? ' --no-auto-retry' : false,
        // numRetrys: obj.autoRetry ? ' --retry-amount ' + obj.numRetrys : false,
        // retryInterval: obj.autoRetry ? ' --wait-time ' + obj.retryInterval : false
      },
      uploadParams: {
        multipartUpload: !obj.multipartUpload ? ' --disable-multipart' : false,
        partSize: obj.multipartUpload ? '-ps ' + partSize : false
      }
    }

    var settings = Object.keys(this.state).length === 0 ? this.defaultSettings : this.state;

    var obj = {
      parameters: params,
      settings: settings
    };
    var yamlObj = yaml.dump(obj);
    fs.writeFileSync(dir + 'prefs.yml', yamlObj);
  }

  componentWillMount() {
    if (fs.existsSync(dir + 'prefs.yml')) {
      this.setState(yaml.load(fs.readFileSync(dir + 'prefs.yml', 'utf8')).settings);
    }
    else {
      this.handleSaveSettings();
      this.handleDefaultSettings();
    }
  }
}

const textAreaStyle = {
  resize: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
}