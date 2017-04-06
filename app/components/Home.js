'use strict';
import React, { Component } from 'react';
import styles from './Home.css';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import * as helper from './Helper.js';

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
        <span onClick={this.handleToken} style={{ display: 'flex', margin: '2px 8px', justifyContent: 'flex-end' }}>Token Status: {this.state.tokenStatus}</span>
        <div style={headStyle}>
          <h3 style={titleStyle}> DTT Desktop</h3>
          <span style={infoStyle}>
            <a href="#" onClick={this.handleSettings}><i className="fa fa-cog" aria-hidden="true" />Settings</a>
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
            <Tab>Download</Tab>
            <Tab>Upload</Tab>
            <Tab>Token</Tab>
            <Tab style={{ display: "none" }}>Settings</Tab>
            <Tab>Log</Tab>
          </TabList>
          <TabPanel><Download clearLog={this.handleClearDownloadConsoleLog} appendLog={this.handleDownloadConsoleLog} /></TabPanel>
          <TabPanel ><Upload clearLog={this.handleClearUploadConsoleLog} appendLog={this.handleUploadConsoleLog} /></TabPanel>
          <TabPanel><Token check={this.handleTokenCheck} consoleLog={this.state.consoleLog.token} /></TabPanel>
          <TabPanel><Settings /></TabPanel>
          <TabPanel><Console consoleLog={this.state.consoleLog} /></TabPanel>
        </Tabs>
      </div >
    );
  }
  handleSelect = (index) => this.setState({ selectedTab: index });
  handleToken = () => this.setState({ selectedTab: 2 });
  handleSettings = () => this.setState({ selectedTab: 3 });
  handleClearDownloadConsoleLog = () => this.setState({ consoleLog: { ...this.state.consoleLog, download: '' } });
  handleClearUploadConsoleLog = () => this.setState({ consoleLog: { ...this.state.consoleLog, upload: '' } });
  handleDownloadConsoleLog = (stderr) => this.setState({ consoleLog: { ...this.state.consoleLog, download: this.state.consoleLog.download += stderr } });
  handleUploadConsoleLog = (stderr) => this.setState({ consoleLog: { ...this.state.consoleLog, upload: this.state.consoleLog.upload += stderr } });
  handleTokenCheck = () => {
    var tokenObj;
    helper.checkToken().then((res) => {
      tokenObj = res
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
  margin: "15px 5px 15px 5px",
  fontSize: '24px'
}

const infoStyle = {
  margin: "15px 5px 15px 5px",
  alignSelf: "center"
}