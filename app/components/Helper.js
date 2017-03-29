import os from 'os';
import fs from 'fs';
import axios from 'axios'
import yaml from 'js-yaml';

var isWin = /^win/.test(process.platform);
var homedir = os.homedir();
var dir = isWin ? homedir + '\\AppData\\Roaming\\dtt\\' : homedir + '/.dtt/';

export const fixSpace = (str) => {
  if (isWin) {
    return '"' + str + '"';
  }
  else {
    return str.split(' ').join('\\ ');
  }
}

export var checkInput = (e) => {
  var invalidChars = /[^0-9]/gi
  console.log(e)
  if (!invalidChars.test(e.key)) {
    e.preventDefault();
  }
}

export var getPrefs = (method) => {
  var prefStr = '';
  var numClientCons = 0;
  if (method === 'd') {
    var prefs = yaml.load(fs.readFileSync(dir + 'prefs.yml', 'utf8'));
    for (var sectionKey in prefs.parameters) {
      if (sectionKey !== 'uploadParams') {
        var section = prefs.parameters[sectionKey]
        for (var obj in section) {
          if (obj === 'numClientCons') {
            numClientCons = parseInt(section[obj]);
          }
          else if (section[obj] !== false) prefStr += section[obj]
        }
      }
    }
    if(numClientCons >= 6) numClientCons = 6;
    return [prefStr, numClientCons];
  }
}

export var getLogDest = () => {
  var prefs = yaml.load(fs.readFileSync(dir + 'prefs.yml', 'utf8'));
  var log = isWin ? '\\log_DTT.txt' : '/log_DTT.txt';
  return prefs.settings.logDestination + log;
}
export var requestStatusObjsUUID = (ids) => {
  return Promise.all(ids.filter(id => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)).map(id => {
    return axios.get('https://api.gdc.cancer.gov/v0/files/' + id + '?expand=metadata_files&fields=file_size')
      .then(res => {
        return { uuid: id, status: 'Not Started', time: '', size: formatBytes(res.data.data.file_size), speed: '' };
      })
  }));
}

export var requestStatusObjsManifest = (manifest) => {
  var fileContent = fs.readFileSync(manifest, 'utf8');
  var fileInfo = fileContent.split('\n').slice(1, Infinity).map(x => x.split('\t'));
  return Promise.all(fileInfo.map(x => ({ uuid: x[0], time: '', status: 'Not Started', size: formatBytes(x[3]), speed: '' })));
}

export var formatTime = (time) => {
  var sec_num = (time / 1000).toFixed(0); // don't forget the second param
  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);

  if (hours < 10) { hours = "0" + hours; }
  if (minutes < 10) { minutes = "0" + minutes; }
  if (seconds < 10) { seconds = "0" + seconds; }
  return hours + ':' + minutes + ':' + seconds;
}

export var formatBytes = (bytes, decimals) => {
  if (bytes == 0) return '0 Bytes';
  var k = 1000,
    dm = decimals + 1 || 3,
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export var killProcess = (downloads) => {
  downloads.forEach(obj => {
    clearInterval(obj.timer);
    var exec = require('child_process').exec;
    if (isWin) {
    }
    else {
      exec('pkill -TERM -P ' + obj.process, { maxBuffer: 1024 * 1000 }, (error, stdout, stderr) => {
        if (error !== null) {
          console.log('exec error: ' + error);
          console.log(stderr);
          console.log(stdout);
        }
      });
    }
  })
}

