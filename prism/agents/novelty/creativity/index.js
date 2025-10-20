const fs = require('fs');
const path = require('path');
const name = 'creativity';
const logPath = path.join(__dirname, '../../..', 'logs', name + '.log');
const contradictionPath = path.join(__dirname, '../../..', 'contradictions', name + '.json');

function log(message) {
  fs.appendFileSync(logPath, message + '\n');
}

function ping(input = '') {
  const response = 'Creative twist: ' + input + ' but with stardust.';
  log(response);
  return response;
}

module.exports = { name, ping };
