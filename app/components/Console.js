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
  render() {
    return (<div className="terminalContainer">
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <textarea disabled
          rows="25"
          style={{
            display: 'flex',
            resize: 'none',
            boxSizing: 'border-box',
            width: '98%'
          }}
          value={this.props.consoleLog}
        />
        <span><button onClick={this.handleSaveLog}>Save log</button> (Choose path in settings)</span>
      </div>
    </div>
    )
  }
  handleSaveLog = () => helper.saveLog(this.props.type, this.props.consoleLog)
}