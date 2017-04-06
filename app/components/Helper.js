'use strict'
import os from 'os';
import fs from 'fs';
import axios from 'axios'
import yaml from 'js-yaml';
import { exec } from 'child_process';


////////////////////Global Variables/////////////////////////////
export var isWin = /^win/.test(process.platform);
export var homedir = os.homedir();
export var dir = isWin ? homedir + '\\AppData\\Roaming\\dtt\\' : homedir + '/.dtt/';
export var prefix = isWin ? dir + 'gdc-client.exe ' : dir + './gdc-client ';

//////////////////////Download Functions/////////////////////////
export var getDownloadPrefs = (downloadFolder) => {
  var prefStr = '';
  var numClientCons = 0;
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
  if (numClientCons > 6) numClientCons = 6;
  var downloadStr = ' -d ' + fixSpace(downloadFolder) + ' ';
  var tokenStr = ' -t ' + dir + 'token.txt ';
  var strList = [downloadStr, tokenStr, prefStr];
  return [strList, numClientCons];

}

export var requestDownloadStatuses = (uuids, manifest) => {

  var statusObjs = [];

  return Promise.all(uuids.filter(id => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)).map(id => {
    return axios.get('https://api.gdc.cancer.gov/v0/files/' + id + '?expand=metadata_files&fields=file_size')
      .then(res => {
        return { uuid: id, status: 'Not Started', time: '', size: formatBytes(res.data.data.file_size), speed: '' };
      })
  }))
    .then(objs => {
      console.log(objs)
      statusObjs = objs;
      var fileContent = fs.readFileSync(manifest, 'utf8');
      var fileInfo = fileContent.split('\n').slice(1, Infinity).map(x => x.split('\t'));
      return statusObjs.concat(fileInfo.map(x => ({ uuid: x[0], time: '', status: 'Not Started', size: formatBytes(x[3]), speed: '' })));
    });


  // var fileContent = fs.readFileSync(arg, 'utf8');
  // var fileInfo = fileContent.split('\n').slice(1, Infinity).map(x => x.split('\t'));
  // return Promise.all(fileInfo.map(x => ({ uuid: x[0], time: '', status: 'Not Started', size: formatBytes(x[3]), speed: '' })));
}


//////////////////////Upload Functions////////////////////////
export var getUploadPrefs = (uploadFolder) => {
  var prefStr = '';
  var numClientCons = 0;
  var prefs = yaml.load(fs.readFileSync(dir + 'prefs.yml', 'utf8'));
  for (var sectionKey in prefs.parameters) {
    if (sectionKey !== 'downloadParams') {
      var section = prefs.parameters[sectionKey]
      for (var obj in section) {
        if (obj === 'numClientCons') {
          numClientCons = parseInt(section[obj]);
        }
        else if (section[obj] !== false) prefStr += section[obj]
      }
    }
  }
  if (numClientCons > 6) numClientCons = 6;
  var uploadStr = ' --path ' + fixSpace(uploadFolder) + ' ';
  var tokenStr = ' -t ' + dir + 'token.txt ';
  var strList = [uploadStr, tokenStr, prefStr];
  return [strList, numClientCons];
}

export var requestUploadStatus = (isUUID, arg) => {
  if (isUUID) {
    return Promise.all(arg.filter(id => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)).map(id => {
      return axios.get('https://api.gdc.cancer.gov/v0/files/' + id + '?expand=metadata_files&fields=file_size')
        .then(res => {
          return { uuid: id, status: 'Not Started', time: '', size: formatBytes(res.data.data.file_size), speed: '' };
        })
    }));
  }
  else {
    var obj = yaml.load(fs.readFileSync(arg, 'utf8')).files;
    var uuids = [];
    obj.forEach(item => uuids.push(item.id))
    return Promise.all(obj.map(x => ({ uuid: x.id, status: 'Not Started', time: '', size: x.file_size, speed: '' })));
  }
}

//////////////////////Token Functions/////////////////////////
export var checkToken = () => {
  var tempDir = isWin ? homedir + '\\AppData\\Local\\Temp' : '/tmp';
  var script = prefix + 'download 00007ccc-269b-4cd0-a0b1-6e5d700a8e5f -t ' + dir + 'token.txt -d ' + tempDir;
  if (!fs.existsSync(dir + 'token.txt')) {
    return ({ consoleLog: '', tokenStatus: 'No Token File' });
  }
  else {
    return new Promise((resolve, reject) => {
      return exec(script, (error, stdout, stderr) => {
        console.log(stderr);
        console.log('stdout: ' + stdout)
        if (stderr.includes('403 Client Error: FORBIDDEN')) {
          resolve({ consoleLog: stderr, tokenStatus: 'Expired or invalid' });
        }
        else if (stdout.includes('Successfully downloaded')) {
          resolve({ consoleLog: '', tokenStatus: 'Valid' });
        }
        else {
          resolve({ consoleLog: stderr, tokenStatus: 'Unknown' });
        }
        if (error !== null) {
          reject('exec error: ' + error);
        }
      })
    });
  }
}

export var saveToken = (tokenFile) => {
  return new Promise(() => {
    fs.access(dir, () => {
      var readStream = fs.createReadStream(tokenFile);

      readStream.once('error', (err) => {
        console.log(err);
      });

      readStream.once('end', () => {
        console.log('done copying');
      });
      var tokenDest = dir + (isWin ? '\\token.txt' : 'token.txt');
      readStream.pipe(fs.createWriteStream(tokenDest));
      if (!isWin) {
        var script = 'chmod 600 ' + dir + 'token.txt';
        var cmd = exec(script, (error, stdout, stderr) => {
          console.log(stderr);
        });
      }
      else {

      }
    })
  });
}

//////////////////////Utility Functions///////////////////////
export var killProcess = (processes) => {
  processes.forEach(obj => {
    clearInterval(obj.timer);
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
export var saveLog = (type, log) => {
  var prefs = yaml.load(fs.readFileSync(dir + 'prefs.yml', 'utf8'));
  var logSuffix = isWin ? '\\' + type + '_log_DTT.txt' : '/' + type + '_log_DTT.txt';
  fs.writeFileSync(prefs.settings.logDestination + logSuffix, log);
}
export var fixSpace = (str) => {
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

export var formatTime = (time) => {
  var sec_num = (time / 1000).toFixed(0);
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

