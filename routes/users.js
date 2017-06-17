var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var lang = require('../public/js/lang.js').lang;
var backup = require('mongodb-backup');
var cronJob = require('cron').CronJob;
var sendmail = require('sendmail')();

var User = require('../models/user');
var Log = require('../models/log');

var monthNames = [0, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function checkLenght(text) {
  if (text < 10) text = '0' + text;
  return text;
}

function getUsers(docs) {
  var chunkSize = 1;
  var userChunks = [];
  for (var i = 0; i < docs.length; i += chunkSize) {
    userChunks.push(docs[i].username);
  } 

  return userChunks;
}

function getUsersByUsername(docs, username) {
  var chunkSize = 1;
  var userChunks = [];
  for (var i = 0; i < docs.length; i += chunkSize) {
    if(username == docs[i].username) {
      userChunks.push(docs[i].username);
    }
  } 

  return userChunks;
}

function getLogsByStatus(docs, status) {
  var chunkSize = 1;
  var logChunks = [];

  for (var i = 0; i < docs.length; i += chunkSize) {
    if(docs[i].status == status) {
      logChunks.push(docs[i]);
    }
  }

  return logChunks;
}

function getTimeString() {
  var date_now = new Date();

  var hours = checkLenght(date_now.getHours());
  var minutes = checkLenght(date_now.getMinutes());

  var time = hours+':'+minutes;

  return time;
}


function setLogsByStatus(docs, option) {
  var chunkSize = 1;

  var status = 'overed';

  var time = '18:00';
  
  for (var i = 0; i < docs.length; i += chunkSize) {

    var criteria = option;

    Log.update(criteria, {status: status, time_over: time, sum_time: getSumTime(docs[i].time_start, time) }, function(err) {
      if(err) console.log(err);
    });
    
  }
}

function convertMinutes(time) {
  time = time.split(':');
  time = Number(time[0]) * 60 + Number(time[1]);

  return time;
}

function getSumTime(time_start, time_over) {

  var chunkSize = 1;
  
  time_start = convertMinutes(time_start);
  time_over = convertMinutes(time_over);
  
  var sum_time = time_over - time_start;

  if(sum_time>=60) {
    sum_hours = Math.floor(sum_time/60);
    sum_minutes = sum_time%60;
    
    sum_hours = checkLenght(sum_hours);
    sum_minutes = checkLenght(sum_minutes);

    sum_time = sum_hours+':'+sum_minutes;
  } else {
    sum_time = checkLenght(sum_time);
    sum_time = '00:'+sum_time;  
  }

  return sum_time;
}

function getTimeOfMonth(docs, month, username) {
  var chunkSize = 1;

  var sum_time = 0;

  for (var i = 0; i < docs.length; i += chunkSize) {
    if(docs[i].username == username) {

      var dateNow = docs[i].date.split('/');
      docs[i].month = Number(dateNow[1]);

      if(docs[i].month == month && docs[i].status == 'overed') {
        sum_time += convertMinutes(docs[i].sum_time); 
      }
    }

    if(!username) {
      var dateNow = docs[i].date.split('/');
      docs[i].month = Number(dateNow[1]);

      if(docs[i].month == month && docs[i].status == 'overed') {
        sum_time += convertMinutes(docs[i].sum_time); 
      }
    }
  }

  if(sum_time>=60) {
    sum_hours = Math.floor(sum_time/60);
    sum_minutes = sum_time%60;

    sum_hours = checkLenght(sum_hours);
    sum_minutes = checkLenght(sum_minutes);
    
    sum_time = sum_hours+':'+sum_minutes;
  } else {
    sum_time = checkLenght(sum_time);
    sum_time = '00:'+sum_time;  
  }

  return sum_time;

}


function setDateAdvanced(docs) {
  
  var chunkSize = 1;

  for (var i = 0; i < docs.length; i += chunkSize) {
    var dateNow = docs[i].date.split('/');
    docs[i].day = Number(dateNow[0]);
    docs[i].month = Number(dateNow[1]);
    docs[i].year = Number(dateNow[2]);
  }
}

function setDateBreak(docs, logChunks) {
  
  var chunkSize = 1;

  for (var i = 0; i < docs.length; i += chunkSize) {
    var monthNow = docs[i].month;
    
    if(i!=0) {
      var monthBefore = docs[i-1].month;
    } else {
      var monthBefore = monthNow;
    }
    
    if(i==docs.length-1) {
      var monthAfter = monthNow;
    } else {
      if(i<docs.length-1) {
        var monthAfter = docs[i+1].month;
      }
    }

    docs[i].monthName = monthNames[monthNow];

    var breakBefore = true;
    var breakAfter = true;

    if(i>0) {

      if(i!=docs.length) {
        if(monthNow != monthAfter) {
          breakAfter = true;
        } else {
          breakAfter = false;
        }
      } else {
        breakAfter = true;
      }

      if(monthNow != monthBefore) {
        breakBefore = true;
      } else {
        breakBefore = false;
      }

      if(i == docs.length-1) {
        breakAfter = true;
      }

    } else {
      breakBefore = true;

      if(monthNow != monthAfter) {
        breakAfter = true;
      } else {
        breakAfter = false;
      }
    }

    if(breakBefore) {
      docs[i].beforeBreak = true;
    } else {
      docs[i].beforeBreak = false;
    }

    
    if(breakAfter) {
      docs[i].afterBreak = true;
    } else {
      docs[i].afterBreak = false;
    }
    
    if(breakAfter) {
      docs[i].all_time = getTimeOfMonth(docs, docs[i].month, false);      
    }

    logChunks.push(docs[i]);
  }
  
}

function getPersonalLogs(docs, username) {

  var chunkSize = 1;
  var logChunks = [];

  for (var i = 0; i < docs.length; i += chunkSize) {
    if(docs[i].username == username) {
      logChunks.push(docs[i]); 
    }
  }

  return logChunks;
}

function getMyLogs(docs, username) {
  var chunkSize = 1;
  var logChunks = [];

  docs.sort(function(a,b) { 
    var date_f = a.date.split("/");
    var date_s = b.date.split("/");
    
    date_f = date_f[1]+'/'+date_f[0]+'/'+date_f[2];
    date_s = date_s[1]+'/'+date_s[0]+'/'+date_s[2];
    
    return new Date(date_f).getTime() - new Date(date_s).getTime();
  });

  docs = getPersonalLogs(docs, username);
  
  setDateAdvanced(docs);

  setDateBreak(docs, logChunks);

  return logChunks;
}

function getDateString(option) {
  var date_now = new Date();
  var day = checkLenght(date_now.getDate());
  var month = checkLenght(date_now.getMonth()+1);
  var year = date_now.getFullYear();

  if(option == 'slash') {
    var date = day+'/'+month+'/'+year;
  } else {
    var date = day+'_'+month+'_'+year;
  }

  return date;
}

function getMyLastLogTime(docs, username) {
  var chunkSize = 1;

  var date = getDateString('slash');

  for (var i = 0; i < docs.length; i += chunkSize) {
    if(docs[i].username == username && docs[i].date == date && docs[i].status == 'started') {
      return docs[i].time_start;
    } else {
      return '';
    }
  }
}

function getMyLastLog(docs, username) {
  var chunkSize = 1;

  var date = getDateString('slash');

  for (var i = 0; i < docs.length; i += chunkSize) {
    if(docs[i].username == username) {
      if(docs[i].date == date) {
        if(docs[i].status == 'started') {
          return 'start';
        } else {
          return 'end';
        }
      }
    }
  }
}

function getLogs(docs) {
  var chunkSize = 1;
  var logChunks = [];

  docs.sort(function(a,b) {
    var date_f = a.date.split("/");
    var date_s = b.date.split("/");
    
    date_f = date_f[1]+'/'+date_f[0]+'/'+date_f[2];
    date_s = date_s[1]+'/'+date_s[0]+'/'+date_s[2];
    
    return new Date(date_f).getTime() - new Date(date_s).getTime();
  });

  setDateAdvanced(docs);

  setDateBreak(docs, logChunks);

  return logChunks;
}

function getLogsByName(docs, usename) {
  var chunkSize = 1;
  var logChunks = [];

  docs.sort(function(a,b) { 
    var date_f = a.date.split("/");
    var date_s = b.date.split("/");
    
    date_f = date_f[1]+'/'+date_f[0]+'/'+date_f[2];
    date_s = date_s[1]+'/'+date_s[0]+'/'+date_s[2];
    
    return new Date(date_f).getTime() - new Date(date_s).getTime();
  });

  setDateAdvanced(docs);

  setDateBreak(docs, logChunks);

  return logChunks;
}

function getLogsByMonth(docs, username) {
  var chunkSize = 1;
  var logChunks = [];

  docs.sort(function(a,b) { 
    var date_f = a.date.split("/");
    var date_s = b.date.split("/");
    
    date_f = date_f[1]+'/'+date_f[0]+'/'+date_f[2];
    date_s = date_s[1]+'/'+date_s[0]+'/'+date_s[2];
    
    return new Date(date_f).getTime() - new Date(date_s).getTime();
  });

  setDateAdvanced(docs);
  
  setDateBreak(docs, logChunks);
  
  return logChunks;
}

function isAuthenticated(req, res, next){
  if(req.isAuthenticated())
    return next();
  else {
    req.flash('error_msg', lang['not_logged_in']);
    res.render('index');
  }
}

function isNotAuthenticated(req, res, next){
  if(!req.isAuthenticated())
    return next();
  else {
    req.flash('error_msg', lang['logged_in']);
    res.render('index');
  }
}

// Register
router.get('/register', function(req, res){
  res.render('register');
});

// Login
router.get('/login', function(req, res){
  res.render('login');
});

// Profile
router.get('/profile', function(req, res){
  if(req.isAuthenticated()) {

    var local_username = res.locals.user.username;

    Log.find(function(err, docs) {
      var logChunks = [];
      var userChunks = [];
      var chunkSize = 1;
      var time_start = getMyLastLogTime(docs, local_username);

      var button = getMyLastLog(docs, local_username);
      var title = '';

      if(button!='start' && button!='end') {
        button = 'primary';
        title = lang['click_start'];
        
      } else {
        if(button=='start') {
          button = 'danger';
          title = lang['click_end'];
        }

        if(button=='end') {
          button = 'default disabled';
          title = lang['unclickable'];
        }
      }

      User.find(function(err, docs) {
        userChunks = getUsers(docs);
        
        res.render('profile', { title: lang['profile'], desc: lang['wc_profile'], users: userChunks, logs: logChunks, button_status: button, button_title: title, time_start: time_start});
      });

    });


  } else {
    res.redirect('/users/login');
  }
});

// My Logs
router.get('/profile/my_logs', function(req, res){

  if(req.isAuthenticated()) {
    
    var local_username = res.locals.user.username;
    var title = lang['my_logs'];
    var desc = lang['wc_my_logs'];    
    
    Log.find(function(err, docs) {
      var logChunks = [];
      var chunkSize = 1;
      var time_start = getMyLastLogTime(docs, local_username);

      logChunks = getMyLogs(docs, local_username);

      User.find(function(err, docs) {
        
        userChunks = getUsers(docs);
        
        res.render('my_logs', { title: title, desc: desc, users: userChunks, logs: logChunks, time_start: time_start });
      });

    });
  } else {
    res.redirect('/users/login');
  }
});

// All Logs
router.get('/profile/all_logs', function(req, res){

  if(req.isAuthenticated()) {
    var title = lang['all_logs'];

    Log.find(function(err, docs) {
      var logChunks = [];
      var chunkSize = 1;

      logChunks = getLogs(docs);

      User.find(function(err, docs) {
        
        userChunks = getUsers(docs);
        
        res.render('all_logs', { title: title, users: userChunks, logs: logChunks });

      });

    });
  } else {
    res.redirect('/users/login');
  }
});

router.get('/profile/logs_by_month', function(req, res){

  if(req.isAuthenticated()) {
    var title = lang['logs_by_month'];

    Log.find(function(err, docs) {
      var logChunks = [];
      var chunkSize = 1;
      
      logChunks = getLogs(docs);

      User.find(function(err, docs) {
        
        userChunks = getUsers(docs);
        
        res.render('my_logs', { title: title, users: userChunks, logs: logChunks });
        
      });
      
    });
  } else {
    res.redirect('/users/login');
  }
});

router.get('/profile/logs_by_user/:username', function(req, res){

  if(req.isAuthenticated()) {
    var local_username = req.params.username;
    var title = lang['logs_by_user'] + local_username;
    var desc = lang['wc_logs_by_user'] + local_username;

    Log.find(function(err, docs) {
      
      var logChunks = [];
      var chunkSize = 1;

      var time_start = getMyLastLogTime(docs, local_username);
      
      logChunks = getMyLogs(docs, local_username);

      User.find(function(err, docs) {
        
        userChunks = getUsers(docs);
        
        res.render('my_logs', { title: title, users: userChunks, logs: logChunks, time_start: time_start });
        
      });

    });
  } else {
    res.redirect('/users/login');
  }
});

// Create New log
router.post('/profile', function(req, res){

  if(req.isAuthenticated()) {
    
    var sum_time = '';

    var username = req.body.username;

    var date = getDateString('slash');
    var time = getTimeString();


    Log.find(function(err, docs) {
      var status = 'started';
      var chunkSize = 1;
      var logsSize = 0;
      var sub_time = '';

      function checkLogStatus(doc) {
        if(doc.date == date && doc.username == username && doc.status == 'started') {
          status = 'overed';
          sum_time = getSumTime(doc.time_start, time);
        } else {
          logsSize = 0;

          if(doc.date == date && doc.username == username && doc.status == 'overed') {
            status = 'error';
          } 
        }
      }

      docs = getPersonalLogs(docs, username);

      if(docs.length==1) {
        checkLogStatus(docs[0]);
      }

      if(docs.length>1) {
        for (var i = 0; i < docs.length; i += chunkSize) {
          checkLogStatus(docs[i]);
        }
      }

      if(status == 'started') {

        var newLog = new Log({
          date: date,
          time_start: time,
          time_over: '',
          status: status,
          username: username,
          sum_time: ''
        });

        Log.createLog(newLog, function(err, log){
          if(err) throw err;
          console.log(log);
        });

        req.flash('success_msg', lang['log_added']);
        res.redirect('/users/profile/my_logs');

      }

      if(status == 'overed') {

        Log.find(function(err, docs) {

          if(err) throw err;
          
          if(docs.length==1) {
            if(docs[0].date == date && docs[0].username == username) {
              docs[0].time_over = time;
              docs[0].status = status;
              docs[0].sum_time = sum_time;
              docs[0].save();
            }
          }

          if(docs.length>1) {
            for (var i = 0; i < docs.length; i += chunkSize) {
              if(docs[i].date == date && docs[i].username == username) {
                docs[i].time_over = time;
                docs[i].status = status;
                docs[i].sum_time = sum_time;
                docs[i].save();   
              }
            }
          }

        });

        req.flash('success_msg', lang['log_finished']);
        res.redirect('/users/profile/my_logs');
      
      }

      if(status == 'error') {
        req.flash('error_msg', lang['logs_limit']);
        res.redirect('/users/profile');
      }
    });

  } else {
    res.redirect('/users/login');
  }

});


// Register User
router.post('/register', function(req, res){

  var username = req.body.username;
  var status = req.body.status;
  var password = req.body.password;
  var password2 = req.body.password2;
  
  // Validation
  req.checkBody('username', lang['un_req']).notEmpty();
  req.checkBody('password', lang['pass_req']).notEmpty();
  req.checkBody('password2', lang['pass_d_match']).equals(req.body.password);
  
  var errors = req.validationErrors();

  if(errors){

    res.render('register', {
      errors: errors 
    });

  } else {


    User.find(function(err, docs) {
      var userChunks = getUsersByUsername(docs, username);

      if(userChunks.length!=0) {
        res.render('register', {
          error_username: lang['user_exist']
        });
      } else {
        var newUser = new User({
          username: username,
          status: status,
          password: password
        });

        User.createUser(newUser, function(err, user){
          if(err) throw err;
          console.log(user);
        });

        req.flash('success_msg', lang['registered']);
        res.redirect('/users/login');
      }
    });
  }

});


passport.use(new LocalStrategy(
  function(username, password, done) {
    User.getUserByUsername(username, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, { message: lang['user_unknown'] });
      }
      User.comparePassword(password, user.password, function(err, isMatch){
        if(err) throw err;
        if(isMatch){
          return done(null, user);
        } else {
          return done(null, false, { message: lang['inv_pass'] });
        }
      });
    });
  }
));


passport.serializeUser(function(user, done){
  done(null, user.id);
});


passport.deserializeUser(function(id, done){
  User.getUserById(id, function(err, user) {
    done(err, user);
  });
});


router.post('/login',
  passport.authenticate('local', {successRedirect: '/users/profile', failureRedirect: '/users/login', failureFlash: true}));

router.get('/logout', function(req, res){
  req.logout();

  req.flash('success_msg', lang['logged_out']);

  res.redirect('/users/login');
});


function closeAllLogs() {
  Log.find(function(err, docs) {
    var logChunks = [];
    var chunkSize = 1;

    var option = {
      status: 'started'
    }

    logChunks = getLogsByStatus(docs, 'started');

    setLogsByStatus(logChunks, option);
  });
}

function startBackup() {

  function createBackup(database) {
    var date_now = new Date();
    var day = date_now.getDate();
    var month = date_now.getMonth()+1;
    var year = date_now.getFullYear();
    var date = day+'_'+month+'_'+year;

    var dbname = 'admin';
    var dbpass = 'admin';
    var mongodbUrl = 'mongodb://'+dbname+':'+dbpass+'@ds127321.mlab.com:27321/time_saver';
    var backup_root = 'backup';
    var backup_name = 'backup_'+date;
    var email_from = 'bohdan.blabla@blabla.com';
    var email_to = 'bcwebapp.backup@gmail.com, pawel@bcweb.pl';
    email_to = 'bcwebapp.backup@gmail.com';
    
    backup({
      uri: mongodbUrl,  
      root: backup_root,
      parser: 'json',
      tar: backup_name+'.tar',
      callback: function(err) {
        if (err) {
          console.error("Error:");
          console.error(err);
        } else {
          console.log('Utworzono backup bazy danych');

          sendmail({
            from: email_from,
            to: email_to,
            subject: 'Backup bazy danych',
            html: 'Backup bazy danych '+date,
            attachments: [
              {   // utf-8 string as an attachment
                filename: backup_name+'.tar',
                path: backup_root+'/'+backup_name+'.tar',
                contentType: 'application/x-compressed'
              },
            ]
          }, function(err, reply) {
            console.error("Error:");
            console.log(err);
          });

        }
      }
    });
   
  }
   
  Log.find(function(err, docs){
    var logChunks = [];
    var chunkSize = 1;

    logChunks = getLogsByStatus(docs, 'overed');
    createBackup(logChunks);
  });
}

var time = '30 23 * * 1-5';
time = '0 * * * * *';

var job = new cronJob({
  cronTime: time,
  onTick: function() {
    // Runs in jobs days
    // at exactly 23:30:00.

    var date = new Date();
    
    if(date.getMinutes() == 37 && date.getHours() == 23 && (/*date.getDay() != 5 && */date.getDay() != 6) ) {
      console.log('Day: '+date.getDay());
      console.log('Minutes: '+date.getMinutes());
      console.log('Hours: '+date.getHours());
      closeAllLogs();
      startBackup();
    } else {
      console.log('Day: '+date.getDay());
      console.log('Minutes: '+date.getMinutes());
      console.log('Hours: '+date.getHours());
      console.log('Doesnt works');
    }

  },
  start: false,
  timeZone: 'Europe/Warsaw'
});

job.start();

module.exports = router;