const os = require('os');
var fs = require('fs');
var https = require('https');
var Zip = require('adm-zip');
var exec = require('child_process').exec;

var homedir = os.homedir();
var opSys = os.platform();
var dir = '';
var url = '';
var fileDir = '';
var isWin = /^win/.test(process.platform);

switch (process.platform) {
    case 'win32':
        dir = homedir + '\\AppData\\Roaming\\dtt';
        url = 'https://gdc.cancer.gov/files/public/file/gdc-client_v1.2.0_Windows_x64.zip';
        fileDir = dir + '\\gdc-client.exe'
        break;
    case 'darwin':
        dir = homedir + '/.dtt';
        url = 'https://gdc.cancer.gov/files/public/file/gdc-client_v1.2.0_OSX_x64.zip';
        fileDir = dir + '/gdc-client';
        break;
    case 'linux':
        dir = homedir + '/.dtt';
        url = 'https://gdc.cancer.gov/files/public/file/gdc-client_v1.2.0_Ubuntu14.04_x64.zip';
        fileDir = dir + '/gdc-client';
        break;
}

try {
    fs.statSync(dir).isDirectory();
}
catch (e) {
    fs.mkdirSync(dir);
}
try {
    fs.statSync(fileDir).isFile();
}
catch (e) {
    var zipPath = dir + (isWin ? '\\gdc.zip' : '/gdc.zip');
    https.get(url, (response) => {
        response.on('data', (data) => {
            fs.appendFileSync(zipPath, data);
            console.log(zipPath);
        });
        response.on('end', () => {
            if (isWin) {
                var zip = new Zip(zipPath);
                zip.extractAllTo(dir);
                fs.unlinkSync(zipPath);
            }
            else {
                exec('unzip ' + zipPath + ' -d ' + dir, () => fs.unlinkSync(zipPath));
            }
        });
    });
}


