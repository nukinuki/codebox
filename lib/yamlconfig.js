const fs = require('fs');
const YAML = require('yaml');
const platforms = require('./platforms');

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
	if(! platforms.hasOwnProperty(config.sandbox)){
		return {
      err: `Unsupported platform ${config.sandbox} in ${code}.yaml`
    }
	}
	config.editor = config.editor.join("\\n");
	config.editorMode = platforms[config.sandbox].get('editorMode');
	config.theme = config.theme || "monokai";
	return config;
}

module.exports = yamlconfig;