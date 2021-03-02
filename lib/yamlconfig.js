const fs = require('fs');
const YAML = require('yaml');

function yamlconfig(code) {
	let file;
	let config;

	try {
		file = fs.readFileSync(`${__dirname}/../configs/${code}.yaml`, 'utf8'); // try-catch?
	} catch(err) {
    return {
      err: `Confing file not found for ${code}`
    }
	}
	try {
		config = YAML.parse(file);
	} catch (err) {
		return {
      err: `YAML parse error for ${code}.yaml: ${err}`
    }
	}
	config.editor = config.editor.join("\\n");
	return {
    config: config
  }
}

module.exports = yamlconfig;