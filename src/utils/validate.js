'use strict';

function isEmail(s) {
  return typeof s === 'string' && /.+@.+\..+/.test(s);
}

module.exports = { isEmail };
