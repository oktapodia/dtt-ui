'use strict';
import React, { Component } from 'react';
import os from 'os';
import {shell} from 'electron';
import Dropzone from 'react-dropzone';
import * as helper from './Helper.js'
const {dialog} = require('electron').remote;

export default class Token extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      initialized: false,
      tokenFile: "",
    }
  }
  handleNewToken = () => {
    helper.saveToken(this.state.tokenFile)
      .then(this.props.check());

  }
  handleTokenChange = (e) => this.setState({ tokenFile: e.target.value });
  handleTokenDialog = () => dialog.showOpenDialog({ properties: ['openFile'] }, (fileName) => {
    try { this.setState({ tokenFile: fileName[0] }) }
    catch (e) { this.setState({ tokenFile: '' }) }
  });

  render() {
    return (
      <div>
        <span>
          <span>In order to get token, please login to the GDC Data Portal and click on "Download Token" from your Username dropdown</span>
          <button onClick={() => { shell.openExternal('https://auth.nih.gov/CertAuthV2/forms/NIHPivOrFormLogin.aspx?TYPE=33554433&REALMOID=06-b6b7dd79-a8fe-493e-abe9-40128a9a58c3&GUID=&SMAUTHREASON=0&METHOD=GET&SMAGENTNAME=nihwamwebagent&TARGET=-SM-HTTPS%3a%2f%2fauth%2enih%2egov%2faffwebservices%2fredirectjsp%2fSAML2redirect%2ejsp%3fSPID%3dhttps%3a%2f%2fportal%2egdc%2ecancer%2egov%2fauth%2fshibboleth%26SMPORTALURL%3dhttps-%3A-%2F-%2Fauth%2enih%2egov-%2Faffwebservices-%2Fpublic-%2Fsaml2sso%26SAMLTRANSACTIONID%3d1b84606e--1403a4d9--8863fc44--889e4747--4e8f4638--349') }}>
            Get Token
        </button>
        </span>
        <Dropzone
          style={dropzoneStyle}
          onDrop={(acceptedFiles, rejectedFiles) => { this.setState({ tokenFile: acceptedFiles[0].path }); acceptedFiles = [] }}
          multiple={false}
          disableClick={true}
        >
          <div>Drag your token into here</div>
          <button onClick={this.handleTokenDialog}>Browse</button>
          <textarea
            rows="1"
            cols="20"
            id="tokenLocation"
            value={this.state.tokenFile}
            onKeyUp={this.handleTokenChange}
            style={textAreaStyle}
          />
        </Dropzone>
        <button onClick={this.handleNewToken}>
          Save Token
        </button>
        <div>{this.props.consoleLog}</div>
      </div>
    )
  }
}

const dropzoneStyle = {
  width: '240px',
  height: '100px',
  borderRadius: '4px',
  border: 'dashed 2px lightgrey',
  padding: '4px',
}

const textAreaStyle = {
  resize: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
}