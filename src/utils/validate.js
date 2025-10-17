// FILE: /srv/blackroad-api/src/utils/validate.js
'use strict';

function isEmail(s) {
  return typeof s === 'string' && /.+@.+\..+/.test(s);
}

module.exports = { isEmail };
