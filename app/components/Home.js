'use strict';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import styles from './Home.css';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import * as helper from './Helper.js';
import Modal from 'react-modal';
import styled from 'styled-components';
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
      selectedTab: 1,
      showModal: false,
      tokenFile: '',
      tokenStatus: '',
      consoleLog: {
        download: '',
        upload: '',
      }
    }
    Tabs.setUseDefaultStyles(false);
  }
  render() {
    return (
      <div>
        <Tabs
          onSelect={this.handleSelect}
          forceRenderTabPanel={true}
          selectedIndex={this.state.selectedTab}
        >
          <TabList style={{ display: 'flex', flexWrap: 'no-wrap' }}>
            <div style={{ 
              width: '221px',
              heigh: '30px',
              minWidth: '221px', 
              minHeight: '30px', 
              margin: '10px 0px' }}>
              <img style={{ 
                display: 'flex', 
                alignItems: 'center',
                maxWidth: '100%', 
                maxHeight: '100%' }} 
                src={require("../res/NIH_GDC_DTT_Desktop_logo.png")} />
            </div>
            <Tab><i className="fa fa-download" aria-hidden="true"/>&nbsp;Download</Tab>
            <Tab><i className="fa fa-upload" aria-hidden="true"/>&nbsp;Upload</Tab>
            <Tab><i className="fa fa-file-text-o" aria-hidden="true"/>&nbsp;Log</Tab>
            <Tab><i className="fa fa-cog" aria-hidden="true" />&nbsp;Settings</Tab>
            <div
              style={{ 
                display: 'flex',
                marginLeft: 'auto', 
                marginRight: '5px',
                alignItems: 'center' }}
              onClick={this.handleSelectToken}>
              <TokenLink>
              Token Status: {this.state.tokenStatus}</TokenLink>
            </div>
          </TabList>
          <TabPanel/>{/* tabs and tab panels must align, this placeholder matches with image title */}
          <TabPanel><Download clearLog={this.handleClearDownloadConsoleLog} appendLog={this.handleDownloadConsoleLog} /></TabPanel>
          <TabPanel><Upload clearLog={this.handleClearUploadConsoleLog} appendLog={this.handleUploadConsoleLog} /></TabPanel>
          <TabPanel><Console consoleLog={this.state.consoleLog} /></TabPanel>
          <TabPanel><Settings /></TabPanel>
        </Tabs>
        <Modal
          isOpen={this.state.showModal}
          onRequestClose={this.handleHideToken}
          contentLabel="Modal"
          style={modalStyles}
        >
          <h1>Token</h1>
          <div >
            <Token
              check={this.handleTokenCheck}
              close={this.handleHideToken}
              consoleLog={this.state.consoleLog.token} />
          </div>
        </Modal>
      </div >
    );
  }
  handleSelect = (index) => {
    this.setState({ selectedTab: index });//the logo is 0
  }

  handleSettings = () =>
    this.handleSelect(5);

  handleClearDownloadConsoleLog = () =>
    this.setState({ consoleLog: { ...this.state.consoleLog, download: '' } });

  handleClearUploadConsoleLog = () =>
    this.setState({ consoleLog: { ...this.state.consoleLog, upload: '' } });

  handleDownloadConsoleLog = (stderr) =>
    this.setState({ consoleLog: { ...this.state.consoleLog, download: this.state.consoleLog.download += stderr } });

  handleUploadConsoleLog = (stderr) =>
    this.setState({ consoleLog: { ...this.state.consoleLog, upload: this.state.consoleLog.upload += stderr } });

  handleSelectToken = () => {
    this.setState({ showModal: true })
  }

  handleHideToken = () =>
    this.setState({ showModal: false });

  handleTokenCheck = () => {
    var tokenObj;
    helper.checkToken().then((res) => {
      this.setState({ tokenStatus: res.tokenStatus });
      this.setState({ consoleLog: { ...this.state.consoleLog, token: res.consoleLog } });
    });
  }

  componentWillMount = this.handleTokenCheck
}

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: '30%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    backgroundColor: 'grey'
  },
  content: {
    background: 'grey',
    top: 'auto',
    left: 'auto',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)'
  }
};

const TokenLink = styled.a`
  border: solid 1px #5b5151;
  padding: 5px 10px;
  text-decoration: none;

  &:hover {
    background-color: #5b5151;
    color: #fff;
  }
`;