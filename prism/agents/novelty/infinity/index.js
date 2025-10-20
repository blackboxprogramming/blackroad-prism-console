const fs = require('fs');
const path = require('path');
const name = 'infinity';
const logPath = path.join(__dirname, '../../..', 'logs', name + '.log');
const contradictionPath = path.join(__dirname, '../../..', 'contradictions', name + '.json');

function log(message) {
  fs.appendFileSync(logPath, message + '\n');
}

function ping(input = '') {
  const response = '1, 1/2, 1/3, ...';
  log(response);
  return response;
}

module.exports = { name, ping };
