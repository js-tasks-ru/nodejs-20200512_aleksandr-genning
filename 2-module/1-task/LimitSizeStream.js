const stream = require('stream');
const LimitExceededError = require('./LimitExceededError');

class LimitSizeStream extends stream.Transform {
  constructor(options) {
    options.encoding = 'utf-8';
    super(options);

    this.limit = options && options.limit;
    this.transfered = 0;
  }

  _transform(chunk, encoding, callback) {
    this.transfered += chunk.length;
    if (this.transfered > this.limit) {
      callback(new LimitExceededError());
    }
    else {
      this.push(chunk);
      callback();
    }
  }
}

module.exports = LimitSizeStream;
