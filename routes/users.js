const express = require('express')
      router = express.Router(),
      passport = require('passport'),
      LocalStrategy = require('passport-local').Strategy,
      User = require('../models/user'),
      Log = require('../models/log'),
      {
        getUsersByUsername, getTimeString, checkIp, getUsers, getSumTime,
        getPersonalLogs, getDateString, getPersonalLastLogTime,
        getPersonalLastLog, getAllLogs, getLogsSummary, checkLogStatus,
        getPersonalLastLogTimePlus, getPersonalLastLogTimeDesc, convertDate
      } = require('../actions/actions.js')

// Register
router.get('/register', (req, res) => res.render('register'))

// Login
router.get('/login', (req, res) => res.render('login'))

// Profile
router.get('/profile', checkIp, (req, res) => {

  if(req.isAuthenticated()) {
    var username = res.locals.user.username

    Log.find((err, logDocs) => {
      var time_start = getPersonalLastLogTime(logDocs, username) || ''
      var time_plus = getPersonalLastLogTimePlus(logDocs, username) || ''

      var button = getPersonalLastLog(logDocs, username)
      var title = ''

      if(button!='start' && button!='end') {
        button = 'primary'
        title = res.locals.lang.click_start
      } else {
        if(button=='start') {
          button = 'danger'
          title = res.locals.lang.click_end
        }

        if(button=='end') {
          button = 'default disabled'
          title = res.locals.lang.unclickable
        }
      }

      User.find((err, userDocs) => {
        res.render('profile', { users: getUsers(userDocs), button_status: button, button_title: title, time_start: time_start, time_plus: time_plus})
      })

    })


  } else {
    res.redirect('/users/login')
  }
})

// My Logs
router.get('/profile/my_logs', checkIp, (req, res) => {

  if(req.isAuthenticated()) {

    var username = res.locals.user.username

    Log.find((err, logDocs) => {

      User.find((err, userDocs) => {
        // console.log(getPersonalLastLogTime(logDocs, username))
        // console.log(getPersonalLastLogTimePlus(logDocs, username))
        res.render('my_logs', {
          users: getUsers(userDocs),
          logs: getPersonalLogs(logDocs, username),
          time_start: getPersonalLastLogTime(logDocs, username) || '',
          time_plus: getPersonalLastLogTimePlus(logDocs, username) || ''
        })
      })

    })
  } else {
    res.redirect('/users/login')
  }
})

// Add time plus
router.get('/profile/add_time_plus', checkIp, (req, res) => {

  if(req.isAuthenticated()) {

    User.find((err, userDocs) => {
      res.render('add_time_plus', {
        users: getUsers(userDocs)
      })
    })

  } else {
    res.redirect('/users/login')
  }
})

// All Logs
router.get('/profile/all_logs', checkIp, (req, res) => {

  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      Log.find((err, logDocs) => {

        User.find((err, userDocs) => {
          res.render('all_logs', { users: getUsers(userDocs), logs: getAllLogs(logDocs) })
        })

      })
    } else {
      res.redirect('/users/profile')
    }
  } else {
    res.redirect('/users/login')
  }
})

// Summary Logs
router.get('/profile/summary_logs', checkIp, (req, res) => {

  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      Log.find((err, logDocs) => {

        User.find((err, userDocs) => {
          res.render('summary_logs', { users: getUsers(userDocs), logs: getLogsSummary(logDocs) })
        })

      })
    } else {
      res.redirect('/users/profile')
    }
  } else {
    res.redirect('/users/login')
  }
})

router.get('/profile/logs_by_user/:username', checkIp, (req, res) => {

  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      var username = req.params.username

      Log.find((err, logDocs) => {

        User.find((err, userDocs) => {
          res.render('my_logs', {
            username: username,
            users: getUsers(userDocs),
            logs: getPersonalLogs(logDocs, username),
            time_start: getPersonalLastLogTime(logDocs, username) || ''
          })
        })

      })
    } else {
      res.redirect('/users/profile')
    }
  } else {
    res.redirect('/users/login')
  }
});

// Create New log
router.post('/profile', checkIp, (req, res) => {

  if(req.isAuthenticated()) {

    var sum_time = '';

    var username = req.body.username;

    var date = getDateString('slash')
    var time = getTimeString()


    Log.find((err, logDocs) => {
      var status = 'started'
      var sub_time = ''

      var time_plus = getPersonalLastLogTimePlus(logDocs, username)
      var time_desc = getPersonalLastLogTimeDesc(logDocs, username)

      logDocs = getPersonalLogs(logDocs, username)

      if(logDocs.length==1) {
        checkLogStatus(logDocs[0], date, username, time)
      }

      if(logDocs.length>1) {
        for (var i = 0; i < logDocs.length; i++) {
          checkLogStatus(logDocs[i], date, username, time)
        }
      }

      if(status == 'started') {

        var newLog = new Log({
          date: date,
          time_start: time,
          time_over: '',
          time_plus: { time: '00:00', description: '' },
          status: status,
          username: username,
          sum_time: ''
        })

        Log.createLog(newLog, (err, log) => {
          if(err) throw err
          console.log(log)
        })

        req.flash('success_msg', res.locals.lang.log_added)
        res.redirect('/users/profile/my_logs')

      }

      if(status == 'overed') {

        Log.find((err, logDocs) => {

          if(err) throw err

          if(logDocs.length==1) {
            if(logDocs[0].date == date && logDocs[0].username == username) {
              logDocs[0].time_over = time
              logDocs[0].time_plus = { time: time_plus, desc: time_desc }
              logDocs[0].status = status
              logDocs[0].sum_time = sum_time
              logDocs[0].save()
            }
          }

          if(logDocs.length>1) {
            for (var i = 0; i < logDocs.length; i++) {
              if(logDocs[i].date == date && logDocs[i].username == username) {
                logDocs[i].time_over = time
                logDocs[i].time_plus = { time: time_plus, desc: time_desc }
                logDocs[i].status = status
                logDocs[i].sum_time = sum_time
                logDocs[i].save()
              }
            }
          }

        });

        req.flash('success_msg', res.locals.lang.log_finished);
        res.redirect('/users/profile/my_logs');

      }

      if(status == 'error') {
        req.flash('error_msg', res.locals.lang.logs_limit);
        res.redirect('/users/profile');
      }
    });

  } else {
    res.redirect('/users/login');
  }

})

// post add time plus
router.post('/profile/add_time_plus', checkIp, (req, res) => {
  if(req.isAuthenticated()) {

    var username = res.locals.user.username
    var date = convertDate(req.body.date)
    var time = req.body.time
    var desc = req.body.desc

    // Validation
    req.checkBody('date', res.locals.lang.date_req).notEmpty()
    req.checkBody('time', res.locals.lang.plus_time_req).notEmpty()
    req.checkBody('desc', res.locals.lang.plus_desc_req).notEmpty()

    var criteria = { username: username, date: date }

    var errors = req.validationErrors()

    if(errors){
      for (error in errors)
        req.flash('error_msg', ' '+errors[error].msg)
      res.redirect('/users/profile/add_time_plus')
    } else {

      Log.find(criteria, (err, logDocs) => {
        if(err) throw err
        if(logDocs.length>0) {
          logDocs[0].time_plus = { time: time, description: desc }
          logDocs[0].sum_time = getSumTime(logDocs[0].time_start, logDocs[0].time_over, time)
          logDocs[0].save()
          req.flash('success_msg', res.locals.lang.time_plus_added)
          res.redirect('/users/profile')
        } else {
          req.flash('error_msg', res.locals.lang.time_plus_exist)
          res.redirect('/users/profile/add_time_plus')
        }
      })

    }
  } else {
    res.redirect('/users/login')
  }
});


// Register User
router.post('/register', (req, res) => {

  var username = req.body.username
  var status = 'user'
  var blockedByIp = true
  var password = req.body.password
  var password2 = req.body.password2

  // Validation
  req.checkBody('username', res.locals.lang.un_req).notEmpty()
  req.checkBody('password', res.locals.lang.pass_req).notEmpty()
  req.checkBody('password2', res.locals.lang.pass_d_match).equals(req.body.password)

  var errors = req.validationErrors()

  if(errors){

    res.render('register', {
      errors: errors
    })

  } else {

    User.find((err, userDocs) => {
      var list = getUsersByUsername(userDocs, username)

      if(list.length!=0) {
        res.render('register', {
          error_username: res.locals.lang.user_exist
        })
      } else {
        var newUser = new User({
          username: username,
          status: status,
          blockedByIp: blockedByIp,
          password: password
        })

        User.createUser(newUser, (err, user) => {
          if(err) throw err
          console.log(user)
        })

        req.flash('success_msg', res.locals.lang.registered)
        res.redirect('/users/login')
      }
    })
  }

})

//return done(null, false, { message: res.locals.lang.user_unknown })
//return done(null, false, { message: res.locals.lang.inv_pass })

passport.use(new LocalStrategy((username, password, done) => {
  User.getUserByUsername(username, (err, user) => {
    if(err) throw err
    if(!user)
      return done(null, false, { message: 'Nieznany użytkownik' })
    User.comparePassword(password, user.password, (err, isMatch) => {
      if(err) throw err
      if(isMatch)
        return done(null, user)
      else
        return done(null, false, { message: 'Nieprawidłowe hasło' })
    })
  })
}))


passport.serializeUser((user, done) =>
  done(null, user.id))


passport.deserializeUser((id, done) =>
  User.getUserById(id, (err, user) =>
    done(err, user)))


router.post('/login',
  passport.authenticate('local', {
    failureRedirect: '/users/login' }),
    (req, res) => {
      res.redirect('/users/profile')
    })

router.get('/logout', (req, res) => {
  req.logout()

  req.flash('success_msg', res.locals.lang.logged_out)

  res.redirect('/users/login')
})


module.exports = router
