const express = require('express'),
      { checkIp, getUsers } = require('../actions/actions.js'),
      { sortByUsername } = require('../actions/other.js'),
      Lang = require('../models/lang'),
      bcrypt = require('bcryptjs'),
      router = express.Router()

// settings
router.get('/', checkIp, (req, res) => {
  if(req.isAuthenticated()){
    if(res.locals.user.status == 'admin') {

      User.find((err, userDocs) => {

        Lang.find((err, langDocs) => {

          var languages = []

          for(var i = 0; i<langDocs.length; i++)
            languages.push({ name_short: langDocs[i].name_short, name_full: langDocs[i].name_full })

          res.render('settings', { users: getUsers(userDocs), languages: languages })
        })

      })

    } else {
      res.redirect('/users/profile')
    }
  } else {
    res.redirect('/users/login')
  }
})

// edit users
router.get('/edit_users', checkIp, (req, res) => {
  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      User.find((err, userDocs) => {
        res.render('edit_users', { users: getUsers(userDocs) })
      })

    } else {
      res.redirect('/users/profile')
    }

  } else {
    res.redirect('/users/login')
  }
})

// edit bloking
router.get('/edit_blocking', checkIp, (req, res) => {
  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      User.find((err, userDocs) => {
        res.render('edit_blocking', { users: getUsers(userDocs), users_list: sortByUsername(userDocs) })
      })

    } else {
      res.redirect('/users/profile')
    }

  } else {
    res.redirect('/users/login')
  }
})

// edit bloking
router.post('/edit_blocking', checkIp, (req, res) => {
  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      var errors = req.validationErrors()

      if(errors){
        for(error in errors)
          req.flash('error_msg', ' '+errors[error].msg)
        res.redirect('/settings/edit_blocking');
      } else {

        User.find((err, userDocs) => {
          if(err) console.log(err)

          userDocs.forEach((item) => {
            item.blockedByIp = req.body[item.username]
            item.save()
          })

          req.flash('success_msg', res.locals.lang.bloking_changed)
          res.redirect('/settings')

        })
      }

    } else {
      res.redirect('/users/profile')
    }

  } else {
    res.redirect('/users/login')
  }
})

// edit users
router.post('/edit_users', checkIp, (req, res) => {
  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      var select_username = req.body.select_username
      var new_username = req.body.new_username
      var new_password = req.body.new_password
      var new_password_confirm = req.body.new_password_confirm

      // Validation
      if(new_username == ''){
        req.checkBody('new_password', res.locals.lang.new_pass_req).notEmpty()
        req.checkBody('new_password_confirm', res.locals.lang.pass_d_match).equals(req.body.new_password)
      }

      if(new_password == '')
        req.checkBody('new_username', res.locals.lang.new_username_req).notEmpty()

      var errors = req.validationErrors()

      if(errors){
        for(error in errors)
          req.flash('error_msg', ' '+errors[error].msg)
        res.redirect('/settings/edit_users')
      } else {

        var criteria = {
          username: select_username
        }

        User.find(criteria, (err, userDocs) => {
          if(err) throw err
          if(userDocs[0] != undefined){

            if(new_password != '')
              bcrypt.genSalt(10, (err, salt) =>
                bcrypt.hash(new_password, salt, (err, hash) => {
                  userDocs[0].password = hash
                  userDocs[0].save()
                }))

            userDocs[0].save()

            var isUserExist = (getUsersByUsername(userDocs, new_username).length)?true:false

            if(new_username != ''){
              if(!isUserExist){
                userDocs[0].username = new_username
              } else {
                req.flash('success_msg', res.locals.lang.user_exist)
                res.redirect('edit_users')
              }

              Log.find(criteria, (err, logDocs) => {
                if(err) throw err
                for(var i = 0; i<logDocs.length; i++){
                  logDocs[i].username = new_username
                  logDocs[i].save()
                }
              })
            }

            if(!isUserExist){
              req.flash('success_msg', res.locals.lang.username_changed)
              res.redirect('/settings')
            }
          } else {
            req.flash('error_msg', res.locals.lang.error_username_change)
            res.redirect('/settings/edit_users')
          }
        })

      }

    } else {
      res.redirect('/users/profile');
    }

  } else {
    res.redirect('/users/login');
  }
})

// edit langs
router.get('/edit_langs/:language', checkIp, (req, res) => {
  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      var criteria = {
        name_short: req.params.language
      }

      User.find((err, userDocs) => {
        var userChunks = getUsers(userDocs)

        Lang.find(criteria, (err, langDocs) => {

          var lang_list = {}
          var data = langDocs[0].toJSON()

          Object.keys(data).forEach((key) => {
            if(key != '_id' && key != 'name_short' && key != 'name_full' && key != '__v')
              lang_list[key] = data[key]
          })

          res.render('edit_langs', { users: userChunks, lang_list: lang_list, language: { name_short: data.name_short, name_full: data.name_full } })
        })
      })

    } else {
      res.redirect('/users/profile')
    }

  } else {
    res.redirect('/users/login')
  }
})

// edit langs
router.post('/edit_langs/:language', checkIp, (req, res) => {
  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      var criteria = {
        name_short: req.params.language
      }

      var errors = req.validationErrors()

      if(errors){
        for(error in errors)
          req.flash('error_msg', ' '+errors[error].msg)
        res.redirect('/settings/edit_users');
      } else {

        Lang.find(criteria, (err, langDocs) => {
          if(err) throw err
          if(langDocs[0] != undefined){

            Object.keys(langDocs[0]._doc).forEach((key) => {
              if(key != '_id' && key != 'name_short' && key != 'name_full' && key != '__v')
                if(req.body[key] != '')
                  langDocs[0][key] = req.body[key]
            })

            langDocs[0].save((err, doc) => {
              if (err) throw err
              else
                console.log('Lang successfully updated!')

            })

            req.flash('success_msg', res.locals.lang.langs_changed)
            res.redirect('/settings')
          } else {
            req.flash('error_msg', res.locals.lang.error_langs_changed)
            res.redirect('/settings/edit_langs')
          }
        })
      }

    } else {
      res.redirect('/users/profile')
    }

  } else {
    res.redirect('/users/login')
  }
})

// change language
router.get('/change_language/:language', checkIp, (req, res) => {
  if(req.isAuthenticated()) {

    var criteria = {
      name_short: req.params.language
    }

    Lang.find(criteria, (err, langDocs) => {
      if( err ) {
        throw err
        req.flash('error_msg', res.locals.lang.error_language_change)
        res.redirect(req.get('referer'))
      } else {
        var data = langDocs[0].toJSON()
        var lang = {}

        Object.keys(data).forEach((key) => {
          if(key != '_id' && key != '__v')
          lang[key] = data[key]
        })

        res.cookie('timerLanguage', req.params.language, { maxAge: 900000, httpOnly: true })

        req.flash('success_msg', res.locals.lang.language_changed)
        res.redirect(req.get('referer'))
      }
    })

  } else {
    res.redirect('/users/login')
  }
})


module.exports = router
