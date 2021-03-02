const fs = require('fs');
const YAML = require('yaml');

function loadConfig(req, res, next) {
	const code = req.params.code;
	let file;
	let config;

	try {
		file = fs.readFileSync(`${__dirname}/../configs/${code}.yaml`, 'utf8'); // try-catch?
	} catch(err) {
		res.err = `Confing file not found for ${code}`;
		return next();
	}
	try {
		config = YAML.parse(file);
	} catch (err) {
		res.err = `YAML parse error for ${code}.yaml: ${err}`;
		return next();
	}
	config.editor = config.editor.join("\\n");
	res.configData = config;
	next();
}

module.exports = loadConfig;