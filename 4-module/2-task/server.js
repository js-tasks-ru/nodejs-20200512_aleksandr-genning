const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');
const LimitSizeStream = require('./LimitSizeStream');


function checkFileExists(file) {
  return new Promise((resolve, reject) => {
    fs.access(file, fs.F_OK, (error) => {
      resolve(!error);
    });
  });
}


const server = new http.Server();

server.on('request', async (req, res) => {
  const pathname = url.parse(req.url).pathname.slice(1);

  const filePath = path.normalize(path.join(__dirname, 'files', pathname));

  switch (req.method) {
    case 'POST':
      /**
       * Вложенные папки не поддерживаются, при запросе вида /dir1/dir2/filename – ошибка 400.
       */
      if (pathname.split('/').length > 1) {
        res.statusCode = 400;
        res.end('Bad request');
        break;
      }

      /**
       * Проверяем что файл существует
       */
      const exists = await checkFileExists(filePath);
      /**
       * Если файл уже есть на диске – сервер должен вернуть ошибку 409.
       */
      if (exists) {
        res.statusCode = 409;
        res.end('Conflict');
        break;
      }

      const limitedStream = new LimitSizeStream({ limit: 1024 * 1024 }); // 1 Mb
      const outStream = fs.createWriteStream(filePath);
      limitedStream.pipe(outStream);

      res.on('close', () => {
        if (res.finished) {
          return;
        }
        fs.unlink(filePath, () => { });
        outStream.destroy();
        limitedStream.destroy();
      });

      req.on('data', (chunk) => {
        limitedStream.write(chunk);
      }).on('end', () => {
        limitedStream.end();
        outStream.end();

        res.statusCode = 201;
        res.end('Created');
      });

      limitedStream.on('error', (error) => {
        // console.error('limitedStream', error)
        /**
         * Максимальный размер загружаемого файла не должен превышать 1МБ, при превышении лимита – ошибка 413.
         */
        if (error.code === 'LIMIT_EXCEEDED') {
          res.statusCode = 413;
          res.end('Request Entity Too Large');
        }
        else {
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
        /**
         * Если в процессе загрузки файла на сервер произошел обрыв соединения — созданный файл с диска надо удалять.
         */
        fs.unlink(filePath, () => { });
        outStream.destroy();
        limitedStream.destroy();
      });

      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
