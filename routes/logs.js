const express = require('express'),
      sendmail = require('sendmail')(),
      User = require('../models/user'),
      Log = require('../models/log'),
      {
        checkLenght, checkIp, ifEqualsLog, getUsers, getYears, convertDate,
        getMonths, getLogsByDate, getTitleCSV, convertToCSV, getMonthNames
      } = require('../actions/actions.js'),
      router = express.Router()

// logs
router.get('/', checkIp, (req, res) => {
  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      User.find((err, userDocs) => {
        res.render('logs', { users: getUsers(userDocs) })
      })

    } else {
      res.redirect('/users/profile')
    }
  } else {
    res.redirect('/users/login')
  }
})

// get add logs
router.get('/add_log', checkIp, (req, res) => {
  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      User.find((err, userDocs) => {
        res.render('add_log', { users: getUsers(userDocs) })
      })

    } else {
      res.redirect('/users/profile')
    }
  } else {
    res.redirect('/users/login')
  }
});

// edit logs
router.get('/edit_log', checkIp, (req, res) => {
  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      User.find((err, userDocs) => {
        res.render('edit_log', { users: getUsers(userDocs) })
      })

    } else {
      res.redirect('/users/profile')
    }

  } else {
    res.redirect('/users/login')
  }
});

// export logs
router.get('/export_logs', checkIp, (req, res) => {
  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      Log.find((err, logDocs) => {

        User.find((err, userDocs) => {
          res.render('export_logs', { users: getUsers(userDocs), months: getMonths(logDocs), years: getYears(logDocs) })
        })

      })

    } else {
      res.redirect('/users/profile')
    }
  } else {
    res.redirect('/users/login')
  }
});


// post add logs
router.post('/add_log', checkIp, (req, res) => {
  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      var sum_time = ''

      var username = req.body.username
      var status = req.body.status
      var date = convertDate(req.body.date)
      var time_start = req.body.time_start
      var time_over = req.body.time_over

      // Validation
      req.checkBody('username', res.locals.lang.un_req).notEmpty()
      req.checkBody('status', res.locals.lang.status_req).notEmpty()
      req.checkBody('date', res.locals.lang.date_req).notEmpty()
      req.checkBody('time_start', res.locals.lang.time_start_req).notEmpty()
      if(status == 'overed') {
        req.checkBody('time_over', res.locals.lang.time_over_req).notEmpty()
      }

      var errors = req.validationErrors();

      if(errors){
        for (error in errors) {
          req.flash('error_msg', ' '+errors[error].msg)
        }
        res.redirect('/logs/add_log')

      } else {

        Log.find((err, logDocs) => {

          var option = {}

          if(status == 'started') {
            option = {
              date: date,
              time_start: time_start,
              time_over: '',
              time_plus: { time: '00:00', description: '' },
              status: status,
              username: username,
              sum_time: ''
            }
          }

          if(status == 'overed') {
            var sum_time = getSumTime(time_start, time_over, '00:00')

            option = {
              date: date,
              time_start: time_start,
              time_over: time_over,
              status: status,
              username: username,
              sum_time: sum_time
            }

          }

          if(status == 'started' || status == 'overed') {
            if(ifEqualsLog(logDocs, username, date)) {

              var newLog = new Log(option);

              Log.createLog(newLog, (err, log) => {
                if(err) throw err
                console.log(log)
              });

              req.flash('success_msg', res.locals.lang.log_added_auto)
              res.redirect('/logs');

            } else {
              req.flash('error_msg', res.locals.lang.log_exist)
              res.redirect('/logs/add_log')
            }

          }
        })
      }
    } else {
      res.redirect('/users/profile')
    }
  } else {
    res.redirect('/users/login')
  }
});

// post edit logs
router.post('/edit_log', checkIp, (req, res) => {
  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      var sum_time = ''

      var username = req.body.username
      var status = req.body.status
      var date = convertDate(req.body.date)
      var time_start = req.body.time_start
      var time_over = req.body.time_over

      // Validation
      req.checkBody('username', res.locals.lang.un_req).notEmpty()
      req.checkBody('date', res.locals.lang.date_req).notEmpty()

      var errors = req.validationErrors()

      if(errors){
        for (error in errors) {
          req.flash('error_msg', ' '+errors[error].msg)
        }
        res.redirect('/logs/edit_log')

      } else {

        var criteria = {
          username: username,
          date: date
        }

        Log.find(criteria, (err, logDocs) => {
          if(err) throw err

          if(logDocs[0] != undefined) {

            if(time_start != '') {
              logDocs[0].time_start = time_start
            }

            if(time_over != '') {
              logDocs[0].time_over = time_over
            }

            if(status != '') {
              logDocs[0].status = status
            }

            if(logDocs[0].status == 'overed' && logDocs[0].time_start != '' && logDocs[0].time_over != '') {
              logDocs[0].sum_time = getSumTime(logDocs[0].time_start, logDocs[0].time_over, logDocs[0].time_plus.time)
            }

            logDocs[0].save();

            req.flash('success_msg', res.locals.lang.log_changed)
            res.redirect('/logs');

          } else {
            req.flash('error_msg', res.locals.lang.log_notexist)
            res.redirect('/logs/edit_log')
          }
        })

      }
    } else {
      res.redirect('/users/profile')
    }
  } else {
    res.redirect('/users/login')
  }
});

// post edit logs
router.post('/export_logs', checkIp, (req, res) => {
  if(req.isAuthenticated()) {
    if(res.locals.user.status == 'admin') {

      var username = req.body.username
      var month = req.body.month
      var year = req.body.year

      // Validation
      req.checkBody('username', res.locals.lang.un_req).notEmpty()
      req.checkBody('month', res.locals.lang.month_req).notEmpty()
      req.checkBody('year', res.locals.lang.year_req).notEmpty()

      function arraySearch(arr, val) {
        for (var i=0; i<arr.length; i++)
          if (arr[i] === val)
            return i
        return false
      }

      month = checkLenght(arraySearch(getMonthNames('pl'), month))

      var errors = req.validationErrors()

      if(errors){
        for (error in errors) {
          req.flash('error_msg', ' '+errors[error].msg);
        }
        res.redirect('/logs/export_logs');

      } else {

        var criteria = {
          username: username
        }

        Log.find(criteria, (err, logDocs) => {
          if(err) throw err

          logDocs = getLogsByDate(logDocs, month, year)

          if(logDocs.length != 0) {
            var title = getTitleCSV(username, month, year)
            logDocs = convertToCSV(logDocs, title)
            req.flash('success_msg', res.locals.lang.log_export)
            res.redirect('/logs')

          } else {
            req.flash('error_msg', res.locals.lang.export_failed)
            res.redirect('/logs/export_logs')
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

module.exports = router
