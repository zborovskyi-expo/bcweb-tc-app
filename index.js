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
var mongoose = require('mongoose');
var lang = require('./public/js/lang.js').lang;

const config = require('./config/database');

var debug_mode = false;

//var mongodbUrl = 'mongodb://'+dbname+':'+dbpass+'@ds127321.mlab.com:27321/time_saver';

// Connect To Database
mongoose.connect(config.database);

// On Connection
mongoose.connection.on('connected', () => {
  console.log(lang["connected_mongo"]);
});

// On Error
mongoose.connection.on('error', (err) => {
  console.log('Database error: '+err);
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

  if(ipInfo.clientIp == const_ip || debug_mode == true) {
    app.use('/users', users);
    app.use('/logs', logs);
    app.use('/settings', settings);
  }

  next();
});


// Set Port
app.set('port', (process.env.PORT || 8080));

app.listen(app.get('port'), function(){
  console.log(lang["server_started"]+app.get('port'));
});

var http = require("http");
setInterval(function() {
  http.get("http://bcweb-app.herokuapp.com");
  console.log('WAKE UP!!!');
}, 900000);
