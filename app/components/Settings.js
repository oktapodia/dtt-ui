import React, { Component } from 'react';
import fs from 'fs';
import os from 'os';
import * as helper from './Helper.js';
const yaml = require('js-yaml');
const { dialog } = require('electron').remote;

export default class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.defaultSettings = {
      // server: 'https://gdc-api.nci.nih.gov/',
      // port: '443',
      numClientCons: '3', // number of concurrent downloads/uploads in queue
      createLogFile: false,
      logDestination: helper.homedir,
      debugLogging: false,
      verboseLogging: false,
      blockSize: '1048576',
      saveInterval: '1000000',
      downloadDestination: helper.homedir,
      calcInSegAndCheckMd5: true,
      checkMd5: true,
      autoRetry: true,
      numRetrys: '5',
      retryInterval: '5',
      multipartUpload: false,
      partSize: '1073741824',
      showAdvancedSettings: false
    };
    this.state = {};
  }
  render() {
    return (
      <div>
        <div className="mainSettings" style={{ padding: '25px' }}>
          <div>
            <h1>Settings</h1>
            <div>
              <button onClick={this.handleDefaultSettings}>Reset to Default Settings</button>
              <button onClick={this.handleSaveSettings}>Save Settings</button>
              <button
                onClick={() => {
                  this.setState({ showAdvancedSettings: !this.state.showAdvancedSettings });
                }}
              >
                {this.state.showAdvancedSettings ? 'Hide ' : 'Show '} Advanced Settings
              </button>
            </div>
          </div>
          {/* <div id="connectionSettings">
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
        </div>*/}
          <div>
            <div id="uploadDownloadSettings">
              <h3>Parameters for Download and Upload</h3>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <div>Number of Client Connections (max 6)&nbsp;</div>
                &nbsp;
                <textarea
                  style={textAreaStyle}
                  rows="1"
                  cols="20"
                  value={this.state.numClientCons}
                  onChange={this.handleNumClientCons}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div id="downloadSettings">
                <h3>Parameters for Download</h3>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div>Destination folder&nbsp;</div>
                  <textarea
                    rows="1"
                    cols="20"
                    id="destLocation"
                    value={this.state.downloadDestination}
                    onChange={this.handleDownloadChange}
                    style={textAreaStyle}
                  />
                  <button onClick={this.handleDownloadDialog}>Browse</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10 }}>
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
              </div>
              &nbsp;&nbsp;&nbsp;
            </div>
          </div>

          <div
            className="advancedSettings"
            style={this.state.showAdvancedSettings ? {} : { display: 'none' }}
          >
            <h2>Advanced Settings</h2>
            <div style={{ display: 'flex', flexDirection: 'row' }}>
              <div>
                <h3>Parameters for Download and Upload</h3>
                <div>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <input
                      type="checkbox"
                      checked={this.state.createLogFile}
                      onChange={this.handleLogDialog}
                    />Create Log File&nbsp;
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
              <div style={{ marginLeft: 40 }}>
                <h3>Parameters for Download</h3>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
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
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 5
                  }}
                >
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
                <div style={{ marginTop: 10 }}>
                  <div>Retries after Downloads</div>
                  <div style={{ marginTop: 5 }}>
                    <input
                      type="checkbox"
                      checked={this.state.autoRetry}
                      onChange={this.handleAutoRetry}
                    />Auto Retry
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 5
                    }}
                  >
                    <textarea
                      style={textAreaStyle}
                      rows="1"
                      cols="2"
                      value={this.state.numRetrys}
                      onChange={this.handleNumRetrys}
                    />&nbsp;Retry(s)
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: 5
                    }}
                  >
                    <textarea
                      style={textAreaStyle}
                      rows="1"
                      cols="2"
                      value={this.state.retryInterval}
                      onChange={this.handleRetryInterval}
                    />&nbsp;Seconds between Retrys
                  </div>
                </div>
              </div>
              <div style={{ marginLeft: 40 }}>
                <h3>Parameters for Upload</h3>
                <div>
                  <input
                    type="checkbox"
                    checked={this.state.multipartUpload}
                    onChange={this.handleMultipartUpload}
                  />Enable Multipart Upload
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 5
                  }}
                >
                  Part Size (Bytes)&nbsp;
                  <textarea
                    style={textAreaStyle}
                    rows="1"
                    cols="20"
                    value={this.state.partSize}
                    onChange={this.handlePartSize}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  handleServerChange = e => this.setState({ server: e.target.value });

  handlePortChange = e => this.setState({ port: e.target.value });

  handleNumClientCons = e => this.setState({ numClientCons: e.target.value });

  handleLogDialog = () => this.setState({ createLogFile: !this.state.createLogFile });

  handleLogDestination = e => this.setState({ logDestination: e.target.value });

  handleLogDestDialog = e =>
    dialog.showOpenDialog({ properties: ['openDirectory'] }, dirName => {
      try {
        this.setState({ logDestination: dirName[0] });
      } catch (e) {
        this.setState({ logDestination: '' });
      }
    });

  handleDebugLogging = () => this.setState({ debugLogging: !this.state.debugLogging });

  handleVerboseLogging = () => this.setState({ verboseLogging: !this.state.verboseLogging });

  handleDownloadDialog = () =>
    dialog.showOpenDialog({ properties: ['openDirectory'] }, dirName => {
      try {
        this.setState({ downloadDestination: dirName[0] });
      } catch (e) {
        this.setState({ downloadDestination: '' });
      }
    });

  handleDownloadChange = e => this.setState({ downloadDestination: e.target.value });

  handleBlockSize = e => this.setState({ blockSize: e.target.value });

  handleSaveInterval = e => this.setState({ saveInterval: e.target.value });

  handleInSegAndMd5 = () =>
    this.setState({ calcInSegAndCheckMd5: !this.state.calcInSegAndCheckMd5 });

  handleMd5 = () => this.setState({ checkMd5: !this.state.checkMd5 });

  handleAutoRetry = () => this.setState({ autoRetry: !this.state.autoRetry });

  handleNumRetrys = e => this.setState({ numRetrys: e.target.value });

  handleRetryInterval = e => this.setState({ retryInterval: e.target.value });

  handleMultipartUpload = () => this.setState({ multipartUpload: !this.state.multipartUpload });

  handlePartSize = e => this.setState({ partSize: e.target.value });

  handleDefaultSettings = () => this.setState(this.defaultSettings);

  handleSaveSettings = () => helper.saveSettings(this.defaultSettings, this.state);

  componentWillMount() {
    if (fs.existsSync(`${helper.dir}prefs.yml`)) {
      this.setState(yaml.load(fs.readFileSync(`${helper.dir}prefs.yml`, 'utf8')).settings);
    } else {
      this.handleSaveSettings();
      this.handleDefaultSettings();
    }
  }
}

const textAreaStyle = {
  resize: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden'
};
