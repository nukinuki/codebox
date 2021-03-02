const yamlconfig = require('../lib/yamlconfig');

function loadConfig(req, res, next) {

	let result = yamlconfig(req.params.code);
	if(result.err){
		res.err = result.err;
		return next();
	}

	res.configData = result.config;
	next();
}

module.exports = loadConfig;