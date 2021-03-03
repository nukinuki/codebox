const yamlconfig = require('../lib/yamlconfig');
const { Docker } = require('node-docker-api');
const { generateHash } = require('random-hash');
const platforms = require('./platforms');
const fs = require('fs');
const tar = require('tar');

class Codebox {
  constructor(socket) {
    this.socket = socket;
    this.isRunning = false;
    this.timeStart = null;
    this.timeContainerReady = null;
    this.timeExecStart = null;
    this.timeFinish = null;
    this.runningContainer = null;
    this.timeoutTimer = null;
    this.initEvents();
  }
  initEvents() {
    const socket = this.socket;
    const _this = this;
    socket.on('run', function(configCode, content){
      const config = yamlconfig(configCode);
      if(config.err) {
        socket.emit("console", config.err);
      } else {
        console.log("Run");
        console.log(configCode);
        console.log(content);
        _this.execute(config, content);
      }
    });
    socket.on('stop', function(){
      console.log("Received [STOP] signal from client");
      _this.stop();
    });
    socket.emit("ready");
  }
  stop() {
    const _this = this;
    if(this.isRunning && this.runningContainer !== null) {
      clearTimeout(this.timeoutTimer);
      this.runningContainer.kill()
        .then(() => {
          return _this.runningContainer.delete({ force: true })
        })
        .then(() => {
          _this.runningContainer = null;
          _this.isRunning = false;
        })
    }
  }
  execute(config, content) {
    var socket = this.socket;
    if(!platforms.hasOwnProperty(config.sandbox)){
      console.log(`ERROR: Unsupported platform [${config.sandbox}]`);
      socket.emit("console", `ERROR: Unsupported platform [${config.sandbox}]`);
      socket.emit("done", 0);
    }
    const platform = platforms[config.sandbox];
    const timeout = config.timeout || 10;

    if(this.isRunning) {
      return this.stop();
    }

    const promisifyStream = stream => new Promise((resolve, reject) => {
      stream.on('data', data => {
        // Somehow Buffer starts with garbage 01 00 00 00 00 00 00 xx ? Why is that?
        const slicedBuffer = data.slice(8);
        console.log(slicedBuffer.toString());
        socket.emit("console", slicedBuffer.toString());
      });
      stream.on('end', resolve);
      stream.on('error', reject);
    });
     
    const docker = new Docker({ socketPath: '/var/run/docker.sock' });
    let _container;

    var hash = generateHash({length: 16});
    var filename = `/tmp/app_${hash}.${platform.get('fileExtension')}`;
    var tarname = filename + '.tar';

    const _this = this;

    // Save content to a file
    fs.writeFileSync(filename, content);

    _this.timeStart = Date.now() / 1000;

    // Tar it
    tar.c({
      gzip: false,
      file: tarname
      },
      [filename]
    )
      .then(_ => {
        return docker.container.create({
          Image: platform.get('dockerImage'),
          Cmd: platform.get('dockerCreateCmd'),
          name: 'sandbox-' + hash
        });
      })
      .then(container => container.start())
      .then(container => {
        _this.timeContainerReady = Date.now() / 1000;
        _container = container;
        _this.runningContainer = container;
        _this.isRunning = true;
        return container.fs.put(tarname, {
          path: '/'
        });
      })
      .then(() => {
        return _container.exec.create({
          AttachStdout: true,
          AttachStderr: true,
          Cmd: platform.get('dockerExecCmd').concat(filename)
        })
      })
      .then(exec => {
        _this.timeExecStart = Date.now() / 1000;
        _this.timeoutTimer = setTimeout(function(){
          if(_this.isRunning) {
            _this.stop();
            socket.emit("timeout", timeout);
            console.log(`Container killed by timeout (${timeout}): sandbox-${hash}`);
          }
        }, timeout * 1000)
        return exec.start({ Detach: false })
      })
      .then(stream => promisifyStream(stream))
      .then(() => {
        _this.timeFinish = Date.now() / 1000;
        socket.emit("done", _this.timeFinish - _this.timeExecStart);
        console.log("Performance:");
        console.log("Container Ready: " + (_this.timeContainerReady - _this.timeStart));
        console.log("Prepare to exec: " + (_this.timeExecStart - _this.timeContainerReady));
        console.log("Exec time: " + (_this.timeFinish - _this.timeExecStart));
      })
      .then(() => _container.kill())
      .then(() => {
        _this.runningContainer = null;
        _this.isRunning = false;
        return _container.delete({ force: true });
      })
      .catch(error => console.log(error));
  }
}

module.exports = Codebox;