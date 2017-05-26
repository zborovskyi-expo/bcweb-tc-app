var express = require('express');
var router = express.Router();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user');
var Log = require('../models/log');

function getUsers(docs) {
  var chunkSize = 1;
  var userChunks = [];
  for (var i = 0; i < docs.length; i += chunkSize) {
    userChunks.push(docs[i].username);
  } 

  return userChunks;
}

function less_than_ten(text) {

  if( text < 10 ) { 
    text = '0' + text; 
  }

  return text;
}

function getTimeOfMonth(docs, month, username) {
  var chunkSize = 1;

  var monthNames = [0, "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  var sum_time = 0;

  for (var i = 0; i < docs.length; i += chunkSize) {
    if(docs[i].username == username) {

      var dateNow = docs[i].date.split('/');
      docs[i].month = Number(dateNow[1]);

      if(docs[i].month == month && docs[i].status == 'overed') {
        this_t = docs[i].sum_time.split(':');
        this_t = Number(this_t[0]) * 60 + Number(this_t[1]);
        sum_time += this_t; 
      }
    }

    if(!username) {
      var dateNow = docs[i].date.split('/');
      docs[i].month = Number(dateNow[1]);

      if(docs[i].month == month && docs[i].status == 'overed') {
        this_t = docs[i].sum_time.split(':');
        this_t = Number(this_t[0]) * 60 + Number(this_t[1]);
        sum_time += this_t; 
      }
    }
  }

  if(sum_time>=60) {
    sum_hours = Math.floor(sum_time/60);
    sum_minutes = sum_time%60;

    sum_hours = less_than_ten(sum_hours);
    sum_minutes = less_than_ten(sum_minutes);
    
    sum_time = sum_hours+':'+sum_minutes;
  } else {
    sum_time = less_than_ten(sum_time);
    sum_time = '00:'+sum_time;  
  }

  return sum_time;

}

function getMyLogs(docs, username) {
  var chunkSize = 1;
  var logChunks = [];

  var monthNames = [0, "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  docs.sort(function(a,b) { 
    return new Date(a.date).getTime() - new Date(b.date).getTime() 
  });

  for (var i = 0; i < docs.length; i += chunkSize) {
    if(docs[i].username == username) {
      var dateNow = docs[i].date.split('/');
      docs[i].day = Number(dateNow[0]);
      docs[i].month = Number(dateNow[1]);
      docs[i].year = Number(dateNow[2]);
    }
  }

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

  return logChunks;
}

function getMyLastLog(docs, username) {
  var chunkSize = 1;

  var date_now = new Date();
  var day = date_now.getDate();
  var month = date_now.getMonth()+1;
  var year = date_now.getFullYear();

  month = less_than_ten(month);
  day = less_than_ten(day);

  var date = day+'/'+month+'/'+year;

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

function getAllLogs(docs) {
  var chunkSize = 1;
  var logChunks = [];

  var monthNames = [0, "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  docs.sort(function(a,b) { 
    return new Date(a.date).getTime() - new Date(b.date).getTime() 
  });

  for (var i = 0; i < docs.length; i += chunkSize) {
    var dateNow = docs[i].date.split('/');
    docs[i].day = Number(dateNow[0]);
    docs[i].month = Number(dateNow[1]);
    docs[i].year = Number(dateNow[2]);
  }

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

  return logChunks;
}

function getLogsByName(docs, usename) {
  var chunkSize = 1;
  var logChunks = [];

  var monthNames = [0, "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  docs.sort(function(a,b) { 
    return new Date(a.date).getTime() - new Date(b.date).getTime() 
  });

  for (var i = 0; i < docs.length; i += chunkSize) {
    if(docs[i].username == username) {
      var dateNow = docs[i].date.split('/');
      docs[i].day = Number(dateNow[0]);
      docs[i].month = Number(dateNow[1]);
      docs[i].year = Number(dateNow[2]);
    }
  }

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

  return logChunks;
}

function getLogsByMonth(docs, username) {
  var chunkSize = 1;
  var logChunks = [];

  var monthNames = [0, "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  docs.sort(function(a,b) { 
    return new Date(a.date).getTime() - new Date(b.date).getTime() 
  });

  for (var i = 0; i < docs.length; i += chunkSize) {
    var dateNow = docs[i].date.split('/');
    docs[i].day = Number(dateNow[0]);
    docs[i].month = Number(dateNow[1]);
    docs[i].year = Number(dateNow[2]);
  }

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
  
  return logChunks;
}

function isAuthenticated(req, res, next){
  if(req.isAuthenticated())
    return next();
  else {
    req.flash('error_msg', 'You are not logged in');
    res.render('index');
  }
}

function isNotAuthenticated(req, res, next){
  if(!req.isAuthenticated())
    return next();
  else {
    req.flash('error_msg', 'You are logged in');
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

      var button = getMyLastLog(docs, local_username);
      var title = '';

      if(button!='start' && button!='end') {
        button = 'primary';
        title = 'Kliknij żeby rozpocząć pracę';
        
      } else {
        if(button=='start') {
          button = 'danger';
          title = 'Kliknij żeby skończyć pracę';
        }

        if(button=='end') {
          button = 'default disabled';
          title = 'Na dzisiaj praca jest skończona';
        }
      }

      User.find(function(err, docs) {
        
        userChunks = getUsers(docs);
        
        res.render('profile', { title: 'Profile', desc: 'Welcome to your profile page', users: userChunks, logs: logChunks, button_status: button, button_title: title});
      });

    });


  } else {
    res.redirect('/users/login');
  }
});

// My Logs
router.get('/profile/my_logs', function(req, res){

  var local_username = res.locals.user.username;
  var title = 'My logs';
  var desc = 'Welcome to your logs';

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

  var title = 'All logs';

  if(req.isAuthenticated()) {
    Log.find(function(err, docs) {
      var logChunks = [];
      var chunkSize = 1;

      logChunks = getAllLogs(docs);

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

  var title = 'Logs by month';

  if(req.isAuthenticated()) {
    Log.find(function(err, docs) {
      var logChunks = [];
      var chunkSize = 1;
      
      logChunks = getAllLogs(docs);

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
  var title = 'Logs of ' + username;
  var desc = 'Welcome to '+username+' logs';
  

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

// Create New offer
router.post('/profile', function(req, res){
  
  var date_now = new Date();

  var day = date_now.getDate();
  var month = date_now.getMonth()+1; //January is 0!
  var year = date_now.getFullYear();
  var hours = date_now.getHours();
  var minutes = date_now.getMinutes();

  var sum_time = '';

  month = less_than_ten(month);
  day = less_than_ten(day);
  hours = less_than_ten(hours);
  minutes = less_than_ten(minutes);

  var date = day+'/'+month+'/'+year;
  var time = hours+':'+minutes;

  var username = req.body.username;


  Log.find(function(err, docs) {
    var status = '';
    var chunkSize = 1;
    var logsSize = 0;
    var sub_time = '';    

    if(docs.length==1) {
      if(docs[0].date == date && docs[0].username == username && docs[0].status == 'started') {
        logsSize = 1;

        first_t = docs[0].time_start.split(':');
        first_t = Number(first_t[0]) * 60 + Number(first_t[1]);

        second_t = time.split(':');
        second_t = Number(second_t[0]) * 60 + Number(second_t[1]);
        
        sum_time = second_t - first_t;

        if(sum_time>=60) {
          sum_hours = Math.floor(sum_time/60);
          sum_minutes = sum_time%60;

          sum_hours = less_than_ten(sum_hours);
          sum_minutes = less_than_ten(sum_minutes);
          
          sum_time = sum_hours+':'+sum_minutes;
        } else {
          sum_time = less_than_ten(sum_time);
          sum_time = '00:'+sum_time;  
        }
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

          first_t = docs[i].time_start.split(':');
          first_t = Number(first_t[0]) * 60 + Number(first_t[1]);

          second_t = time.split(':');
          second_t = Number(second_t[0]) * 60 + Number(second_t[1]);
          
          sum_time = second_t - first_t;

          if(sum_time>=60) {
            sum_hours = Math.floor(sum_time/60);
            sum_minutes = sum_time%60;
            
            sum_hours = less_than_ten(sum_hours);
            sum_minutes = less_than_ten(sum_minutes);

            sum_time = sum_hours+':'+sum_minutes;
          } else {
            sum_time = less_than_ten(sum_time);
            sum_time = '00:'+sum_time;  
          }
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


      req.flash('success_msg', 'Your new log added. Now you can work.');
      res.redirect('/users/profile/my_logs');

    
    } else {

      req.flash('success_msg', 'Your limit of logs is over.');
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
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
  
  var errors = req.validationErrors();

  if(errors){
    res.render('register', {
      errors: errors 
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

    req.flash('success_msg', 'You are registered and can now login');
    res.redirect('/users/login');
  }

});


passport.use(new LocalStrategy(
  function(username, password, done) {
    User.getUserByUsername(username, function(err, user){
      if(err) throw err;
      if(!user){
        return done(null, false, { message: 'Unknown User' });
      }
      User.comparePassword(password, user.password, function(err, isMatch){
        if(err) throw err;
        if(isMatch){
          return done(null, user);
        } else {
          return done(null, false, { message: 'Invalid password' });
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

  req.flash('success_msg', 'You are logged out');

  res.redirect('/users/login');
});


module.exports = router;