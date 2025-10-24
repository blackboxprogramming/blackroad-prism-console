declare module 'node:crypto' {
  import crypto = require('crypto');
  export = crypto;
}

declare module 'node:fs' {
  import fs = require('fs');
  export = fs;
}

declare module 'node:path' {
  import path = require('path');
  export = path;
}

declare const Buffer: any;
declare const process: any;

type Buffer = any;
