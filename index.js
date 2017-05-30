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

var gateway_ip = '192.168.20.1';

//mongoose.connect('mongodb://localhost/loginapp');

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

//var db = mongoose.connection;

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

// Global Vars
app.use(function(req, res, next){
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

var requestIp = require('request-ip');

app.use(function(req, res, next) {
    console.log(requestIp.getClientIp(req)); // on localhost > 127.0.0.1
    next();
});


network.get_active_interface(function(err, obj) {
  //console.log(err);
  //console.log(obj);
  //console.log(obj.gateway_ip);

  debug_mode = true;
  if(!debug_mode) {
    if(obj.gateway_ip == gateway_ip) {
      app.use('/', routes);
      app.use('/users', users);
      app.use('/logs', logs);
      app.use('/settings', settings);
    } else {
      app.use('/', routes);
    }
  } else {
    app.use('/', routes);
    app.use('/users', users);
    app.use('/logs', logs);
    app.use('/settings', settings);
  }
});

// Set Port
app.set('port', (process.env.PORT || 8080));

app.listen(app.get('port'), function(){
  console.log(lang["server_started"]+app.get('port'));
});
