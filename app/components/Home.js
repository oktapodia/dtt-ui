'use strict';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import * as helper from './Helper.js';
import Modal from 'react-modal';
import styled from 'styled-components';

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
      showTokenModal: false,
      showDownloadModal: false,
      token: {
        status: '',
        icon: '',
        colour: '',
      },
      consoleLog: {
        download: '',
        upload: '',
      }
    }
    Tabs.setUseDefaultStyles(false);
  }
  render() {
    return (
      <div 
      onClick= {this.state.showTokenModal ? this.handleHideToken: ''}
      style = {this.state.showTokenModal ? {opacity: 0.1} : {}}>
        <Tabs
          onSelect={this.handleSelect}
          forceRenderTabPanel={true}
          selectedIndex={this.state.selectedTab}
        >
          <TabList style={{ display: 'flex', flexWrap: 'no-wrap' }}>
            <div style={{
              width: '221px',
              height: '30px',
              minWidth: '221px',
              minHeight: '30px',
              margin: '10px 0px'
            }}>
              <img style={{
                display: 'flex',
                alignItems: 'center',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
                src={require("../res/NIH_GDC_DTT_Desktop_logo.png")} />
            </div>
            <Tab><i className="fa fa-download" aria-hidden="true" />&nbsp;Download</Tab>
            {/*<Tab><i className="fa fa-upload" aria-hidden="true" />&nbsp;Upload</Tab>*/}
            <Tab><i className="fa fa-file-text-o" aria-hidden="true" />&nbsp;Log</Tab>
            <Tab><i className="fa fa-cog" aria-hidden="true" /></Tab>
            <div
              style={{
                display: 'flex',
                marginLeft: 'auto',
                marginRight: '5px',
                alignItems: 'center'
              }}
              onClick={this.handleSelectToken}>
              <TokenLink>
                Token Status:&nbsp;
                <span style={{ fontWeight: 'bold', color: this.state.token.colour }}>
                  {this.state.token.status}
                  {this.state.token.icon}
                </span>
              </TokenLink>
            </div>
          </TabList>
          <TabPanel />{/* tabs and tab panels must align, this placeholder matches with image title */}
          <TabPanel style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}><Download clearLog={this.handleClearDownloadConsoleLog} appendLog={this.handleDownloadConsoleLog} /></TabPanel>
          {/*<TabPanel><Upload clearLog={this.handleClearUploadConsoleLog} appendLog={this.handleUploadConsoleLog} /></TabPanel>*/}
          <TabPanel><Console consoleLog={this.state.consoleLog} /></TabPanel>
          <TabPanel><Settings /></TabPanel>
        </Tabs>


        {/*{Token Modal}*/}
        <Modal
          isOpen={this.state.showTokenModal}
          onRequestClose={this.handleHideToken}
          contentLabel="Token"
          style={modalStyles}
        >
          <h1>Token</h1>
          <div>
            <Token
              check={this.handleTokenCheck}
              close={this.handleHideToken}
              consoleLog={this.state.consoleLog.token} />
          </div>
        </Modal>

        {/*Download Modal*/}
        <Modal
          isOpen={this.state.showDownloadModal}
          onRequestClose={this.handleHideDownloadModal}
          contentLabel="Download Directory Picker"
          style={modalStyles}
        >
          <h1>Pick your download directory</h1>
          <div>
            Download Directory:
          <button onClick={this.handleDownloadDir}>Browse</button>
          </div>
        </Modal>
      </div >
    );
  }
  handleSelect = (index) => {
    this.setState({ selectedTab: index });
  }

  handleSettings = () =>
    this.handleSelect(4);

  handleClearDownloadConsoleLog = () =>
    this.setState({ consoleLog: { ...this.state.consoleLog, download: '' } });

  handleClearUploadConsoleLog = () =>
    this.setState({ consoleLog: { ...this.state.consoleLog, upload: '' } });

  handleDownloadConsoleLog = (stderr) =>
    this.setState({
      consoleLog: {
        ...this.state.consoleLog,
        download: this.state.consoleLog.download += stderr
      }
    });

  handleUploadConsoleLog = (stderr) =>
    this.setState({
      consoleLog: {
        ...this.state.consoleLog,
        upload: this.state.consoleLog.upload += stderr
      }
    });

  handleSelectToken = () => {
    this.setState({ showTokenModal: true })
  }

  handleHideToken = () =>
    this.setState({ showTokenModal: false });

  handleTokenCheck = () => {
    var tokenObj;
    helper.checkToken().then((res) => {
      this.setState({ token: res.token });
      this.setState({
        consoleLog: {
          ...this.state.consoleLog,
          token: res.consoleLog
        }
      });
    });
  }

  componentWillMount = this.handleTokenCheck;

  componentDidMount = () => {
    this.setState({ showDownloadModal: helper.isDirDefault('download') && this.state.selectedTab === 1 });
  }
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
    position: 'absolute',
    top: 'auto',
    left: 'auto',
    right: 'auto',
    bottom: 'auto',
    border: '1px solid rgb(204, 204, 204)',
    background: '#fff',
    overflow: 'auto',
    borderRadius: '4px',
    outline: 'none',
    padding: '20px',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
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

const StyledModal = styled(Modal) `
  overlay: {
    position: 'fixed',
    top: '30%',
    left: '50%',
    right: '40%',
    bottom: '60%',
    backgroundColor: 'grey'
  },
  content: {
    position: absolute;
    top: auto;
    left: auto;
    right: auto;
    bottom: auto;
    border: 1px solid rgb(204, 204, 204);
    background: #fff;
    overflow: auto;
    border-radius: 4px;
    outline: none;
    padding: 20px;
    margin-right: -50%;
    transform: translate(-50%, -50%);
  }
`

