class Platform {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }
  get(param) {
    if(param == 'name') {
      return this.name;
    } else {
      return this.config[param];
    }
  }
}

const platforms = {};

platforms.nodejs = new Platform('nodejs', {
  fileExtension: 'js',
  editorMode: 'javascript',
  dockerImage: 'mhart/alpine-node:slim',
  dockerCreateCmd: [ '/bin/sh', '-c', 'tail -f /etc/alpine-release' ],
  dockerExecCmd: [ 'node' ] // filename will be added as last array element
});

platforms.php = new Platform('php', {
  fileExtension: 'php',
  editorMode: 'php',
  dockerImage: 'php',
  dockerCreateCmd: [ '/bin/sh', '-c', 'tail -f /proc/version' ],
  dockerExecCmd: [ 'php' ] // filename will be added as last array element
});

// Add more platforms here
// Remember to pull the image before using it

module.exports = platforms;