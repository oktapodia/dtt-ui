'use strict';
import React, { Component } from 'react';
import styles from './Home.css';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import * as helper from './Helper.js';
var remote = require('electron').remote;

import Download from './Download';
import Upload from './Upload';
import Token from './Token';
import Settings from './Settings';
import Console from './Console';

export default class Home extends Component {
  constructor() {
    super();
    this.state = {
      selectedTab: 0,
      tokenStatus: '',
      consoleLog: {
        download: '',
        upload: '',
      }
    }
  }
  render() {
    return (
      <div>
        <div style={headStyle}>
          <h3 style={titleStyle}> DTT Desktop</h3>
          <span style={infoStyle}>
            <div onClick={this.handleToken}>Token Status: {this.state.tokenStatus}</div>
            <a href="#" onClick={this.handleSettings} style={{display:'flex', justifyContent: 'flex-end'}}><i className="fa fa-cog" aria-hidden="true" />Settings</a>
            {/*<a href="#"> Help </a>
            <a href="#"> About</a>*/}
          </span>
        </div>
        <Tabs
          onSelect={this.handleSelect}
          forceRenderTabPanel={true}
          selectedIndex={this.state.selectedTab}
        >
          <TabList>
            <Tab >Download</Tab>
            <Tab >Upload</Tab>
            <Tab >Token</Tab>
            <Tab >Log</Tab>
            <Tab style={{ display: "none" }}>Settings</Tab>
          </TabList>
          <TabPanel><Download clearLog={this.handleClearDownloadConsoleLog} appendLog={this.handleDownloadConsoleLog} /></TabPanel>
          <TabPanel><Upload clearLog={this.handleClearUploadConsoleLog} appendLog={this.handleUploadConsoleLog} /></TabPanel>
          <TabPanel><Token check={this.handleTokenCheck} consoleLog={this.state.consoleLog.token} /></TabPanel>
          <TabPanel><Console consoleLog={this.state.consoleLog} /></TabPanel>
          <TabPanel><Settings /></TabPanel>
        </Tabs>
      </div >
    );
  }
  handleSelect = (index) => this.setState({ selectedTab: index });
  handleToken = () => this.handleSelect(2);
  handleSettings = () => this.handleSelect(4);
  handleClearDownloadConsoleLog = () => this.setState({ consoleLog: { ...this.state.consoleLog, download: '' } });
  handleClearUploadConsoleLog = () => this.setState({ consoleLog: { ...this.state.consoleLog, upload: '' } });
  handleDownloadConsoleLog = (stderr) => this.setState({ consoleLog: { ...this.state.consoleLog, download: this.state.consoleLog.download += stderr } });
  handleUploadConsoleLog = (stderr) => this.setState({ consoleLog: { ...this.state.consoleLog, upload: this.state.consoleLog.upload += stderr } });
  handleTokenCheck = () => {
    var tokenObj;
    helper.checkToken().then((res) => {
      tokenObj = res;
      this.setState({ tokenStatus: tokenObj.tokenStatus });
      this.setState({ consoleLog: { ...this.state.consoleLog, token: tokenObj.consoleLog } });
    });
  }
  componentWillMount() {
    this.handleTokenCheck();
  }
}
const headStyle = {
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between"
}

const titleStyle = {
  margin: '5px',
  fontSize: '24px',
  alignSelf: 'center'
}

const infoStyle = {
  margin: "15px 5px 15px 5px",
}