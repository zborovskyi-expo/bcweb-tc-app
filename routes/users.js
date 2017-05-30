var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var lang = require('../public/js/lang.js').lang;
var backup = require('mongodb-backup');
var cronJob = require('cron').CronJob;

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


function isUserNameExist(username) {
  var query = {username: username};
  
  var callback = function callback(err, user) {
    if(err) console.log(err);
    if(user.username) return true;
  }

  return User.findOne(query, callback);
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

function setDateAdvancedByUsername(docs, username) {
  
  var chunkSize = 1;

  for (var i = 0; i < docs.length; i += chunkSize) {
    if(docs[i].username == username) {
      var dateNow = docs[i].date.split('/');
      docs[i].day = Number(dateNow[0]);
      docs[i].month = Number(dateNow[1]);
      docs[i].year = Number(dateNow[2]);
    }
  }
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

function setDateBreakByUsername(docs, logChunks, username) {
  var chunkSize = 1;

  for (var i = 0; i < docs.length; i += chunkSize) {
    if(docs[i].username == username) {
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
        docs[i].all_time = getTimeOfMonth(docs, docs[i].month, username);      
      }

      logChunks.push(docs[i]);
    }
  }
}

function getMyLogs(docs, username) {
  var chunkSize = 1;
  var logChunks = [];

  docs.sort(function(a,b) { 
    return new Date(a.date).getTime() - new Date(b.date).getTime() 
  });

  setDateAdvancedByUsername(docs, username);

  setDateBreakByUsername(docs, logChunks, username);

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
    if(docs[i].username == username) {
      if(docs[i].date == date) {
        if(docs[i].status == 'started') {
          return docs[i].time_start;
        }
      }
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
    return new Date(a.date).getTime() - new Date(b.date).getTime() 
  });

  setDateAdvanced(docs);

  setDateBreak(docs, logChunks);

  return logChunks;
}

function getLogsByName(docs, usename) {
  var chunkSize = 1;
  var logChunks = [];

  docs.sort(function(a,b) { 
    return new Date(a.date).getTime() - new Date(b.date).getTime() 
  });

  setDateAdvancedByUsername(docs, username);

  setDateBreakByUsername(docs, logChunks, username);

  return logChunks;
}

function getLogsByMonth(docs, username) {
  var chunkSize = 1;
  var logChunks = [];

  docs.sort(function(a,b) { 
    return new Date(a.date).getTime() - new Date(b.date).getTime() 
  });

  setDateAdvancedByUsername(docs, username);
  
  setDateBreakByUsername(docs, logChunks);
  
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
      
      if(time_start) {
        var time_now = getSumTime(time_start, getTimeString());
      } else {
        var time_now = '';
      }

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
        
        res.render('profile', { title: lang['profile'], desc: lang['wc_profile'], users: userChunks, logs: logChunks, button_status: button, button_title: title, time_now: time_now});
      });

    });


  } else {
    res.redirect('/users/login');
  }
});

// My Logs
router.get('/profile/my_logs', function(req, res){

  var local_username = res.locals.user.username;
  var title = lang['my_logs'];
  var desc = lang['wc_my_logs'];

  if(req.isAuthenticated()) {
    Log.find(function(err, docs) {
      var logChunks = [];
      var chunkSize = 1;

      logChunks = getMyLogs(docs, local_username);

      //logChunks = getLogsByMonth(docs, local_username);

      User.find(function(err, docs) {
        
        userChunks = getUsers(docs);
        
        res.render('my_logs', { title: title, desc: desc, users: userChunks, logs: logChunks });
      });

    });
  } else {
    res.redirect('/users/login');
  }
});

// All Logs
router.get('/profile/all_logs', function(req, res){

  var title = lang['all_logs'];

  if(req.isAuthenticated()) {
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

router.get('/profile/logs_by_month', function(req, res){

  var title = lang['logs_by_month'];

  if(req.isAuthenticated()) {
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

  var username = req.params.username;
  var title = lang['logs_by_user'] + username;
  var desc = lang['wc_logs_by_user'] + username;
  

  if(req.isAuthenticated()) {
    Log.find(function(err, docs) {
      
      var logChunks = [];
      var chunkSize = 1;

      logChunks = getMyLogs(docs, username);

      User.find(function(err, docs) {
        
        userChunks = getUsers(docs);
        
        res.render('my_logs', { title: title, users: userChunks, logs: logChunks });
        
      });

    });
  } else {
    res.redirect('/users/login');
  }
});

// Create New log
router.post('/profile', function(req, res){
    
  var sum_time = '';

  var username = req.body.username;

  var date = getDateString('slash');
  var time = getTimeString();


  Log.find(function(err, docs) {
    var status = '';
    var chunkSize = 1;
    var logsSize = 0;
    var sub_time = '';    

    if(docs.length==1) {
      if(docs[0].date == date && docs[0].username == username && docs[0].status == 'started') {
        logsSize = 1;

        sum_time = getSumTime(docs[0].time_start, time);

      } else {
        logsSize = 0;

        if(docs[0].date == date && docs[0].username == username && docs[0].status == 'overed') {
          logsSize = 2;
        } 
      }
    }

    if(docs.length>1) {
      for (var i = 0; i < docs.length; i += chunkSize) {
        if(docs[i].date == date && docs[i].username == username && docs[i].status == 'started') {
          logsSize++;

          sum_time = getSumTime(docs[i].time_start, time);

        } else {
          if(docs[i].date == date && docs[i].username == username && docs[i].status == 'overed') {
            logsSize = 2;
          } 
        }
      }
    }
    
    if(logsSize == 0) {
      status = 'started';
    }

    if(logsSize == 1) {
      status = 'overed';
    }

    if(logsSize > 1) {
      status = 'error';
    }

    if(status != 'error') {

      if(status == '') {
        status = 'started';
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

      }


      req.flash('success_msg', lang['log_added']);
      res.redirect('/users/profile/my_logs');

    
    } else {

      req.flash('success_msg', lang['logs_limit']);
      res.redirect('/users/profile');
    
    }
  });

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

    if(errors) {
      res.render('register', {
        errors: errors 
      });
    }

  } else {

    if(isUserNameExist(username)) {
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
    
    backup({
      uri: mongodbUrl,  
      root: 'backup/'+date,
      parser: 'json',
      callback: function(err) {
        if (err) {
          console.error(err);
        } else {
          console.log('Utworzono backup bazy danych');
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


var time = '00 30 23 * * 1-5';

var job = new cronJob({
  cronTime: time,
  onTick: function() {
    // Runs in jobs days
    // at exactly 23:30:00.
    closeAllLogs();
    
    setTimeout(function(){
      startBackup();
    }, 2000);
  },
  start: false
});

job.start();

module.exports = router;