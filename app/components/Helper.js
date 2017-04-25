'use strict'
import os from 'os';
import fs from 'fs';
import axios from 'axios'
import yaml from 'js-yaml';
import React from 'react';
import { exec } from 'child_process';
import uniqby from 'lodash/uniqby';

////////////////////Global Variables/////////////////////////////
export var isWin = /^win/.test(process.platform);
export var homedir = os.homedir();
export var dir = isWin ? homedir + '\\AppData\\Roaming\\dtt\\' : homedir + '/.dtt/';
export var prefix = isWin ? dir + 'gdc-client.exe ' : dir + './gdc-client ';

//////////////////////Download Functions/////////////////////////
export var getDownloadPrefs = () => {
  var prefStr = '';
  var numClientCons = 0;
  var prefs = yaml.load(fs.readFileSync(dir + 'prefs.yml', 'utf8'));

  prefStr = Object.keys(prefs.parameters).reduce((str, sectionKey) => {
    if (sectionKey !== 'uploadParams') {
      var section = prefs.parameters[sectionKey];
      return Object.keys(section).reduce((str, obj) => {
        if (obj !== 'numClientCons' && section[obj] !== false) {
          return str + section[obj];
        }
        return str;
      }, str)
    }
    return str;
  }, '')
  console.log(prefStr);
  if (numClientCons > 6) numClientCons = 6;
  var tokenStr = ' -t ' + dir + 'token.txt ';
  var strList = [tokenStr, prefStr];
  return strList;
}

export var checkValidManifest = (manifests) => {
  var message = [];
  var excludedFiles = []
  var validUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return Promise.all(manifests.map(manifest => {
    return new Promise((res, reject) => {
      fs.readFile(manifest, 'utf8', (err, content) => {
        if (err) {
          reject(err)
          return;
        }
        if (content.split('\n').slice(1).length === 0) {
          excludedFiles.push(manifest)
          message.push(manifest + ' has an invalid format\n');
        }//forEach below will not run if length is 0
        content.split('\n').slice(1).forEach(x => {
          var columns = x.split('\t');
          if (!validUUID.test(columns[0]) || !parseInt(columns[3])) {//if first column is not uuid or fourth is not a number
            excludedFiles.push(manifest)
            message.push(manifest + ' has an invalid format\n');
          }
        });
        res();
      })
    }).catch(() => {
      excludedFiles.push(manifests);
      message.push('error reading ' + manifest + '\n');
    })
  }))
    .then(() => [uniqby(excludedFiles), uniqby(message)])
}

export var requestDownloadStatuses = (uuids, manifests, relFiles, anns) => {
  var validUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  return Promise.all(uuids.filter(id => validUUID.test(id)).map(id => {
    return axios.get('https://api.gdc.cancer.gov/v0/files/' + id + '?expand=metadata_files&fields=file_size,file_name,access')
      .then(res => {
        return {
          uuid: id,
          status: 'Not Started',
          time: '', size: formatBytes(res.data.data.file_size),
          speed: '',
          rel: relFiles.toString(),
          ann: anns.toString(),
          name: res.data.data.file_name,
          access: res.data.data.access,
          indivDownload: false,
        };
      })
  }))
    .then(objs => {
      var statusObjs = objs;
      try {
        return Promise.all(manifests.map(manifest => {
          return new Promise((resolve) => {
            fs.readFile(manifest, 'utf8', (err, content) => {
              var fileInfo = content.split('\n').slice(1).map(x => x.split('\t'));
              Promise.all(fileInfo.map(x => {
                return axios.get('https://api.gdc.cancer.gov/v0/files/' + x[0] + '?expand=metadata_files&fields=file_name,access')
                  .then(res => {
                    return {
                      uuid: x[0],
                      time: '',
                      status: 'Not Started',
                      size: formatBytes(x[3]),
                      speed: '',
                      rel: relFiles.toString(),
                      ann: anns.toString(),
                      name: res.data.data.file_name,
                      access: res.data.data.access,
                      indivDownload: false,
                    }
                  })
              }))
                .then(rows => resolve(rows));
            });
          });
        }))
          .then((rows) => {
            return rows.reduce((acc, row) => acc.concat(row), statusObjs);
          });
      } catch (e) { return statusObjs }
    });
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
          numClientCons = parseInt(section[obj], 10);
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
    return new Promise((resolve) => resolve({
      consoleLog: '',
      token: {
        status: 'No Token File',
        icon: <i className="fa fa-warning" aria-hidden="true" />,
        colour: 'red'
      }
    }));
  }
  else {
    return new Promise((resolve, reject) => {
      return exec(script, (error, stdout, stderr) => {
        console.log(stderr);
        console.log('stdout: ' + stdout)
        if (stderr.includes('403 Client Error: FORBIDDEN')) {
          resolve({
            consoleLog: stderr,
            token: {
              status: 'Expired or invalid',
              icon: <i className="fa fa-times-circle" aria-hidden="true" />,
              colour: 'red'

            }
          });
        }
        else if (stdout.includes('Successfully downloaded')) {
          resolve({
            consoleLog: '',
            token: {
              status: 'Valid',
              icon: <i className="fa fa-check" aria-hidden="true" />,
              colour: 'green'
            }
          });
        }
        else {
          resolve({
            consoleLog: stderr,
            token: {
              status: 'Unknown',
              icon: <i className="fa fa-times-circle" aria-hidden="true" />,
              colour: 'red'
            }
          });
        }
        if (error !== null) {
          reject('exec error: ' + error);
        }
      })
    });
  }
}

export var saveToken = (tokenFile) => {
  return new Promise((resolve, reject) => {
    fs.access(dir, () => {
      var readStream = fs.createReadStream(tokenFile);
      readStream.once('error', (err) => {
        console.log(err);
        reject(err)
      });

      readStream.once('end', () => {
        console.log('done copying');
      });
      var tokenDest = dir + (isWin ? '\\token.txt' : 'token.txt');
      return new Promise((res) => res(readStream.pipe(fs.createWriteStream(tokenDest))))
        .then(() => {
          if (!isWin) {
            var script = 'chmod 600 ' + dir + 'token.txt';
            var cmd = exec(script, (error, stdout, stderr) => {
              console.log(stderr);
            });
          }
          else {

          }
          resolve();
        });
    })
  });
}
//////////////////////Settings Functions//////////////////////
export var saveSettings = (defaultSettings, state) => {
  var obj = Object.keys(state).length === 0 ? defaultSettings : state;
  var params = {
    // connectionsParams: {
    //   server: obj.server !== defaultSettings.server ? ' -s ' + obj.server : false,
    //   port: obj.port !== defaultSettings.port ? ' -P ' + obj.port : false
    // },
    bothParams: {
      numClientCons: obj.numClientCons <= 6 ? obj.numClientCons : 3,
      // createLogFile: obj.createLogFile  ? ' --log-file ' + fixSpace(obj.logDestination) : false,
      debugLogging: obj.debugLogging ? ' --debug' : false,
      verboseLogging: obj.verboseLogging ? ' --v' : false
    },
    downloadParams: {
      downloadDestination: ' -d ' + fixSpace(obj.downloadDestination),
      blockSize: obj.blockSize !== defaultSettings.blockSize ?
        ' --http-chunk-size ' + obj.blockSize : false,

      saveInterval: obj.saveInterval !== defaultSettings.saveInterval ?
        ' --save-interval ' + obj.saveInterval : false,

      calcInSegAndCheckMd5: !obj.calcInSegAndCheckMd5 ? ' --no-segment-md5sums' : false,
      checkMd5: !obj.checkMd5 ? ' --no-file-md5sum' : false,
      // autoRetry: !obj.autoRetry ? ' --no-auto-retry' : false,
      // numRetrys: obj.autoRetry ? ' --retry-amount ' + obj.numRetrys : false,
      // retryInterval: obj.autoRetry ? ' --wait-time ' + obj.retryInterval : false
    },
    uploadParams: {
      multipartUpload: !obj.multipartUpload ? ' --disable-multipart' : false,
      partSize: obj.multipartUpload ? '-ps ' + partSize : false
    }
  }

  var settings = obj;

  var prefs = {
    parameters: params,
    settings: settings
  };
  var yamlObj = yaml.dump(prefs);
  fs.writeFileSync(dir + 'prefs.yml', yamlObj);
}
//////////////////////Utility Functions///////////////////////
export var getClientCons = () => {
  var obj = yaml.load(fs.readFileSync(dir + 'prefs.yml', 'utf8'));
  var cons = parseInt(obj.parameters.bothParams.numClientCons, 10);
  return cons > 6 && cons < 1 ? 6 : cons;
}

export var isDirDefault = (type) => {
  var obj = yaml.load(fs.readFileSync(dir + 'prefs.yml', 'utf8'));
  if (type === 'download') {
    return obj.parameters.downloadParams.downloadDestination === homedir;
  }
  else {
    return obj.parameters.uploadParams.uploadSource === homedir;
  }
}
export var killProcesses = (processes) => {
  console.log(processes);
  processes.forEach(process => killProcess(process))
}

export var killProcess = (process) => {
  try {
    process.callback();
    clearInterval(process.timer);
    if (isWin) {
    }
    else {
      exec('pkill -TERM -P ' + process.pid, { maxBuffer: 1024 * 1000 }, (error, stdout, stderr) => {
        if (error !== null) {
          console.log('exec error: ' + error);
          console.log(stderr);
          console.log(stdout);
        }
      });
    }
  } catch (e) { }
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
    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
    i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

