var express = require('express');
var router = express.Router();
var loadConfig = require('../middleware/embed-config');

router.use('/:code', loadConfig);

/* GET users listing. */
router.get('/:code', function(req, res, next) {
  if(res.err) {
  	res.send(`ERROR: ${res.err}`);
  	return;
  }
  let code = req.params.code;
  console.log(res.configData);
  res.render('embed', { code: code, config: res.configData });
});

module.exports = router;
