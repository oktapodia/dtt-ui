import React, { Component } from 'react';
import fs from 'fs';
import { getLogDest } from './Helper.js';
export default class Console extends Component {
  render() {
    return (<div className="terminalContainer">
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <textarea disabled
          rows="30"
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
  handleSaveLog = () => {
    fs.writeFileSync(getLogDest(), this.props.consoleLog);
  }
}