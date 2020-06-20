const stream = require('stream');
const os = require('os');

class LineSplitStream extends stream.Transform {
  constructor(options) {
    super(options);
    this.lineData = '';
  }

  _transform(chunk, encoding, callback) {

    this.lineData += chunk.toString();

    const lines = this.lineData.split(os.EOL);

    if (lines.length > 1) {

      this.lineData = lines.pop();

      lines.map(line => {
        this.push(line);
      })
    }

    callback();
  }

  _flush(callback) {
    this.push(this.lineData);
    callback();
  }
}

module.exports = LineSplitStream;
