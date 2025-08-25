const fs = require('fs');
const path = require('path');
const name = 'math';
const logPath = path.join(__dirname, '../../..', 'logs', name + '.log');
const contradictionPath = path.join(__dirname, '../../..', 'contradictions', name + '.json');

function log(message) {
  fs.appendFileSync(logPath, message + '\n');
}

function ping(input = '') {
  let result;
  try {
    result = Function('"use strict"; return (' + input + ')')();
  } catch (e) {
    result = 'NaN';
  }
  const response = String(result);
  log(response);
  return response;
}

module.exports = { name, ping };
