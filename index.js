var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongo = require('mongodb');
var mongoose = require('mongoose');
var network = require('network');
var lang = require('./public/js/lang.js').lang;

var debug_mode = false;

var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }, 
                replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } };       
 
var dbname = 'admin';

var dbpass = 'admin';

var mongodbUrl = 'mongodb://'+dbname+':'+dbpass+'@ds127321.mlab.com:27321/time_saver';
 
mongoose.connect(mongodbUrl, options);

var db = mongoose.connection;             
 
db.on('error', console.error.bind(console, 'connection error:'));  
 
db.once('open', function() {
  console.log(lang["connected_mongo"]);
  // Wait for the database connection to establish, then start the app.                         
});

var routes = require('./routes/index');
var users = require('./routes/users');
var logs = require('./routes/logs');
var settings = require('./routes/settings');

// Init App
var app = express();

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', exphbs({defaultLayout:'layout', helpers: require("./public/js/helpers.js").helpers}));
app.set('view engine', 'handlebars');

// BodyParser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Set Static Folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }

    return {
      param : formParam,
      msg : msg,
      value : value
    };
  }
}));

// Connect Flash
app.use(flash());

var res_url = '';
// Global Vars
app.use(function(req, res, next){
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  if(req.url != '/css/bootstrap.min.css.map') {
    res_url = req.url;
    res.locals.res_url = res_url;
  }
  next();
});

var const_ip = '80.55.43.241';
var getIP = require('ipware')().get_ip;

app.use(function(req, res, next) {
  var ipInfo = getIP(req);
  
  app.use('/', routes);
  //debug_mode = true;

  if(debug_mode == true) {
    app.use('/users', users);
    app.use('/logs', logs);
    app.use('/settings', settings);
  } else {
    if(ipInfo.clientIp == const_ip) {
      app.use('/users', users);
      app.use('/logs', logs);
      app.use('/settings', settings);
    }
  }
  
  next();
});


// Set Port
app.set('port', (process.env.PORT || 8080));

app.listen(app.get('port'), function(){
  console.log(lang["server_started"]+app.get('port'));
});


// another side for backup and close all logs

var User = require('./models/user');
var Log = require('./models/log');

var backup = require('mongodb-backup');
var cronJob = require('cron').CronJob;
var sendmail = require('sendmail')();

function checkLenght(text) {
  if (text < 10) text = '0' + text;
  return text;
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
    var email_from = 'bcwebapp.backup@gmail.com';
    var email_to = 'bcwebapp.backup@gmail.com, pawel@bcweb.pl';
    
    backup({
      uri: mongodbUrl,  
      root: backup_root,
      parser: 'json',
      tar: backup_name+'.tar',
      callback: function(err) {
        if (err) {
          //console.error(err);
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
            //console.log(err);
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

var time = '00 30 23 * * 1-5';
time = '00 38 10 * * 1-5';
var job = new cronJob({
  cronTime: time,
  onTick: function() {
    // Runs in jobs days
    // at exactly 23:30:00.
    closeAllLogs();
    startBackup();
  },
  start: false
});

job.start();