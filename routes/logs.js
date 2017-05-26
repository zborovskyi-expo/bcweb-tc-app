var express = require('express');
var router = express.Router();

// logs
router.get('/', function(req, res){
  res.render('logs');
});


module.exports = router;