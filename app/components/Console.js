import React, { Component } from 'react';
import fs from 'fs';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import * as helper from './Helper.js';

export default class Console extends Component {
  render() {
    return (
      < div >
        <Tabs>
          <TabList>
            <Tab>Download</Tab>
            <Tab>Upload</Tab>
          </TabList>
          <TabPanel><ConsoleSection consoleLog={this.props.consoleLog.download} type="download" /></TabPanel>
          <TabPanel><ConsoleSection consoleLog={this.props.consoleLog.upload} type="upload" /></TabPanel>
        </Tabs>
      </div >
    )
  }

}

class ConsoleSection extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: '(Choose path in Settings)'
    }
  }
  render() {
    return (<div className="terminalContainer">
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <textarea disabled
          rows="25"
          style={{
            display: 'flex',
            resize: 'none',
            boxSizing: 'border-box',
            padding: '20px',
            height: 'calc(100vh - 180px)'
          }}
          value={this.props.consoleLog}
        />
        <span><button onClick={this.handleSaveLog}>Save log</button> {this.state.status}</span>
      </div>
    </div>
    )
  }
  handleSaveLog = () => {
    this.setState({ status: helper.saveLog(this.props.type, this.props.consoleLog) },
      () => { setTimeout(() => this.setState({ status: '(Choose path in Settings)' }), 5000) });

  }
}