const {Docker} = require('node-docker-api');

const dockerTest = function() {
  const promisifyStream = stream => new Promise((resolve, reject) => {
    stream.on('data', data => console.log(data.toString()))
    stream.on('end', resolve)
    stream.on('error', reject)
  });
   
  const docker = new Docker({ socketPath: '/var/run/docker.sock' });
  let _container;
   
  docker.container.create({
    Image: 'mhart/alpine-node:slim',
    Cmd: [ '/bin/sh', '-c', 'tail -f /etc/alpine-release' ],
    name: 'test'
  })
    .then(container => container.start())
    .then(container => {
      _container = container;
      return container.fs.put('./demo-exec-code.js.tar', {
        path: '/tmp'
      });
    })
    .then(() => {
      return _container.exec.create({
        AttachStdout: true,
        AttachStderr: true,
        Cmd: [ 'node', '/tmp/demo-exec-code.js' ]
      })
    })
    .then(exec => {
      return exec.start({ Detach: false })
    })
    .then(stream => promisifyStream(stream))
    .then(() => _container.kill())
    .then(() => _container.delete({ force: true }))
    .catch(error => console.log(error));
}

module.exports = dockerTest;