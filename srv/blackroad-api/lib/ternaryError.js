class TernaryError extends Error {
  constructor(message, opts) {
    super(message);
    if (!opts || typeof opts.state === 'undefined') {
      throw new Error('TernaryError requires a state (-1, 0, or 1)');
    }
    if (![ -1, 0, 1 ].includes(opts.state)) {
      throw new Error('TernaryError state must be -1, 0, or 1');
    }
    this.state = opts.state;
    this.code = opts.code;
    this.severity = opts.severity || 'med';
    this.hint = opts.hint;
  }
}

module.exports = {
  TernaryError,
};
