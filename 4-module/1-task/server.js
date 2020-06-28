const url = require('url');
const http = require('http');
const path = require('path');
const fs = require('fs');

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

  if (pathname === 'favicon.ico') {
    res.statusCode = 200;
    res.end('OK');
    return;
  }

  // console.log(pathname);

  const filepath = path.join(__dirname, 'files');

  switch (req.method) {
    case 'GET':
      /**
       * Вложенные папки не поддерживаются, при запросе вида /dir1/dir2/filename – ошибка 400.
       */
      if (pathname.split('/').length > 1) {
        res.statusCode = 400;
        res.end('Bad request');
        break;
      }

      /**
       * Формируем полный путь к файлу
       * - normalize - убираем из пути все лишнее (. ..) 
       */
      filePath = path.normalize(path.join(filepath, pathname));
      /**
       * Проверяем что файл существует
       */
      const exists = await checkFileExists(filePath);
      // console.log('exists', exists);
      if (!exists) {
        res.statusCode = 404;
        res.end('File not found');
        break;
      }
      else {
        console.log('filePath', filePath);
        let readStream = fs.createReadStream(filePath);
        readStream.on('open', function () {
          readStream.pipe(res);
        });
        readStream.on('error', function (err) {
          res.end(err);
        });
        break;
      }

      break;

    default:
      res.statusCode = 501;
      res.end('Not implemented');
  }
});

module.exports = server;
