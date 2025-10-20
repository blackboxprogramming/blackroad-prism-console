const fs = require('fs');
const path = require('path');
const name = 'geometry';
const logPath = path.join(__dirname, '../../..', 'logs', name + '.log');
const contradictionPath = path.join(__dirname, '../../..', 'contradictions', name + '.json');

function log(message) {
  fs.appendFileSync(logPath, message + '\n');
}

function ping(input = '') {
  const response = '+---+\n|   |\n+---+';
  log(response);
  return response;
}

module.exports = { name, ping };
