const express = require('express'),
      router = express.Router()

function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated())
    return next()
  else
    res.redirect('/users/login')
}

// Get Homepage
router.get('/', ensureAuthenticated, (req, res) =>
  res.redirect('/users/profile'))

// Get Error
router.get('/error_404', ensureAuthenticated, (req, res) =>
  res.render('error_404'))

module.exports = router
