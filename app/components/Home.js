// @flow
'use strict';
import React, { Component } from 'react';
import styles from './Home.css';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import fs from 'fs';
import os from 'os';

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
      consoleLog: ''
    }
  }
  render() {
    return (
      <div>
        <span onClick={this.handleToken} style={{ display: 'flex', margin: '2px 8px', justifyContent: 'flex-end' }}>Token Status: {this.state.tokenStatus}</span>
        <div style={headStyle}>
          <h3 style={titleStyle}> DTT Desktop</h3>
          <span style={infoStyle}>
            <a href="#" onClick={this.handleSettings}><i className="fa fa-cog" aria-hidden="true" /></a>
            <a href="#"> Help </a>
            <a href="#"> About</a>
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
            <Tab>Console</Tab>
          </TabList>
          <TabPanel><Download handleClearConsoleLog={this.handleClearConsoleLog} handleConsoleLog={this.handleConsoleLog} /></TabPanel>
          <TabPanel ><Upload /></TabPanel>
          <TabPanel><Token check={this.handleCheck} /></TabPanel>
          <TabPanel><Settings /></TabPanel>
          <TabPanel><Console consoleLog={this.state.consoleLog} /></TabPanel>
        </Tabs>
      </div >
    );
  }
  handleSelect = (index) => this.setState({ selectedTab: index });
  handleToken = () => this.setState({ selectedTab: 2 });
  handleSettings = () => this.setState({ selectedTab: 3 });
  handleClearConsoleLog = () => this.setState({ consoleLog: this.state.consoleLog = '' })
  handleConsoleLog = (stderr) => this.setState({ consoleLog: this.state.consoleLog += stderr });
  handleCheck = () => {
    var homedir = os.homedir();
    var isWin = /^win/.test(process.platform);
    var dir = isWin ? homedir + '\\AppData\\Roaming\\dtt\\' : homedir + '/.dtt/';
    var prefix = isWin ? dir + 'gdc-client.exe ' : dir + './gdc-client ';
    const exec = require('child_process').exec;

    var tempDir = isWin ? homedir + '\\AppData\\Local\\Temp' : '/tmp';
    var script = prefix + 'download 00007ccc-269b-4cd0-a0b1-6e5d700a8e5f -t ' + dir + 'token.txt -d ' + tempDir;
    if (!fs.existsSync(dir + 'token.txt')) {
      this.setState({ tokenStatus: 'No Token File' });
    }
    else {
      var cmd = exec(script, (error, stdout, stderr) => {
        console.log(stderr);
        console.log('stdout: ' + stdout)
        if (stderr.includes('403 Client Error: FORBIDDEN')) {
          this.setState({ tokenStatus: 'Expired or invalid' });
        }
        else if (stdout.includes('Successfully downloaded')) {
          this.setState({ tokenStatus: 'Valid' });
        }
        else {
          this.setState({ tokenStatus: 'Unknown' });
        }
        if (error !== null) {
          console.log('exec error: ' + error);
        }
      });
    }
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