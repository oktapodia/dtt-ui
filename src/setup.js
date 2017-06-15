const os = require('os');
const fs = require('fs');
const https = require('https');
const Zip = require('adm-zip');
const exec = require('child_process').exec;

let homedir = os.homedir();
let opSys = os.platform();
let dir = '';
let url = '';
let fileDir = '';
let isWin = /^win/.test(process.platform);

switch (process.platform) {
  case 'win32':
    dir = homedir + '\\AppData\\Roaming\\dtt';
    url =
      'https://gdc.cancer.gov/files/public/file/gdc-client_v1.2.0_Windows_x64.zip';
    fileDir = dir + '\\gdc-client.exe';
    break;
  case 'darwin':
    dir = homedir + '/.dtt';
    url =
      'https://gdc.cancer.gov/files/public/file/gdc-client_v1.2.0_OSX_x64.zip';
    fileDir = dir + '/gdc-client';
    break;
  case 'linux':
    dir = homedir + '/.dtt';
    url =
      'https://gdc.cancer.gov/files/public/file/gdc-client_v1.2.0_Ubuntu14.04_x64.zip';
    fileDir = dir + '/gdc-client';
    break;
}

try {
  fs.statSync(dir).isDirectory();
} catch (e) {
  fs.mkdirSync(dir);
}

try {
  fs.statSync(fileDir).isFile();
} catch (e) {
  const zipPath = dir + (isWin ? '\\gdc.zip' : '/gdc.zip');
  fs.unlinkSync(zipPath);

  https.get(url, response => {
    response.on('data', data => {
      fs.appendFileSync(zipPath, data);
      console.log(zipPath);
    });
    response.on('end', () => {
      if (isWin) {
        try {
          const zip = new Zip(zipPath);
          zip.extractAllTo(dir, true);
          fs.unlinkSync(zipPath);
        } catch (e) {
          alert(e + ' Close all instances and restart please.');
        }
      } else {
        exec('unzip ' + zipPath + ' -d ' + dir, () => fs.unlinkSync(zipPath));
      }
    });
  });
}
