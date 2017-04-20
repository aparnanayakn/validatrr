const spawn = require('child_process').spawn;
const path = require('path');
const os = require("os");
const fs = require("fs");

let resourcePath = path.resolve(__dirname, '..', 'constraint-rules', 'examples', 'reasoning', 'rdfsResource.n3');
let subclassPath = path.resolve(__dirname, '..', 'constraint-rules', 'examples', 'reasoning', 'rdfsSubClassOf.n3');

let files = [{
  type: 'n3',
  path: resourcePath
}, {
  type: 'n3',
  path: subclassPath
}];
let rulePath = path.resolve(__dirname, '..', 'constraint-rules', 'examples');
let rules = fs.readdirSync(rulePath);
rules.forEach(function (file) {
  if (file.match(/^[AB]/)) {
    files.push({
      type: 'n3',
      path: path.resolve(rulePath, file, 'rule.n3')
    });
  }
});

const eyePath = os.platform() === 'win32' ? "C:/Program Files/eye/bin/eye.cmd" : '/opt/eye/bin/eye.sh';
const swiplPath = os.platform() === 'win32' ? "swipl" : '/usr/bin/swipl';

let start = new Date();
parse(files, 'pvm', path.resolve(__dirname, 'dist', 'n3unit-owl')).then(function (outPath) {
  let end = new Date();
  let timing = end.getTime() - start.getTime();
  console.log(`it took ${timing}`);
});


function parse(files, parseType, outPath) {
  let errLog = '';

  const args = ['--nope'];
  for (let i = 0; i < files.length; i++) {
    if (files[i].type === 'n3p') {
      args.push('--plugin');
    }
    args.push(files[i].path);
  }
  switch (parseType) {
    case 'n3p':
      args.push('--n3p');
      outPath += '.n3p';
      break;
    case 'pvm':
      args.push('--image');
      outPath += '.pvm';
      args.push(outPath);
      break;
  }
  return new Promise(function (fulfill, reject) {
    const parser = spawn(eyePath, args);
    parser.on('error', function (data) {
      errLog += data;
    });
    if (parseType !== 'pvm') {
      fs.writeFile(outPath, '', function (clearOutFileErr) {
        if (clearOutFileErr) {
          reject(clearOutFileErr);
        }
        const outStream = fs.createWriteStream(outPath, {flags: 'a'});
        parser.stdout.pipe(outStream);
      });
    }
    parser.on('close', function () {
      if (errLog.indexOf('** ERROR **') >= 0) {
        reject(errLog);
      }
      fulfill(outPath);
    });
  });
}