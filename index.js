const express = require('express'),
      path = require('path'),
      cookieParser = require('cookie-parser'),
      bodyParser = require('body-parser'),
      exphbs = require('express-handlebars'),
      expressValidator = require('express-validator'),
      flash = require('connect-flash'),
      session = require('express-session'),
      passport = require('passport'),
      LocalStrategy = require('passport-local').Strategy,
      mongoose = require('mongoose'),
      http = require('http'),
      config = require('./config/database'),
      routes = require('./routes/index'),
      users = require('./routes/users'),
      logs = require('./routes/logs'),
      settings = require('./routes/settings'),
      { closeAllLogs, createEmptyLogs, startBackup } = require('./actions/actions.js'),
      CronJob = require('cron').CronJob
      app = express()

class Server {

  constructor(){
    this.initDB()
    this.initViewEngine()
    this.initParser()
    this.initStaticFolder()
    this.initExpressSession()
    this.initPassport()
    this.initExpressValidator()
    this.initFlash()
    this.initGlobalVars()
    this.initRoutes()
    this.initCronJob()
    this.start()
  }

  initCronJob(){

    var time = '30 23 * * *'

    var job = new CronJob({
      cronTime: time,
      onTick: () => {
        closeAllLogs()
        createEmptyLogs()
        startBackup()
      },
      start: true,
      timeZone: 'Europe/Warsaw'
    });
  }

  initParser(){
    // BodyParser Middleware
    app.use(bodyParser.json())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(cookieParser())
  }

  initViewEngine(){
    // View Engine
    app.set('views', path.join(__dirname, 'views'))
    app.engine('handlebars', exphbs({defaultLayout:'layout', helpers: require("./public/js/helpers.js").helpers}))
    app.set('view engine', 'handlebars')
  }

  initPassport(){
    // Passport init
    app.use(passport.initialize())
    app.use(passport.session())
  }

  initExpressSession(){
    // Express Session
    app.use(session({
      secret: 'secret',
      saveUninitialized: true,
      resave: true
    }))
  }

  initDB(){
    // Connect To Database
    mongoose.connect(config.database)

    // On Connection
    mongoose.connection.on('connected', () =>
      console.log("Connected to mongo server"))

    // On Error
    mongoose.connection.on('error', (err) =>
      console.log('Database error: '+err))

  }

  initExpressValidator(){
    // Express Validator
    app.use(expressValidator({
      errorFormatter: (param, msg, value) => {
        var namespace = param.split('.'),
            root = namespace.shift(),
            formParam = root

        while(namespace.length)
          formParam += '[' + namespace.shift() + ']'

        return {
          param : formParam,
          msg : msg,
          value : value
        }
      }
    }));

  }

  initGlobalVars(){
    // Global Vars
    var res_url = ''

    const Lang = require('./models/lang')

    app.use((req, res, next) => {
      res.locals.success_msg = req.flash('success_msg')
      res.locals.error_msg = req.flash('error_msg')
      res.locals.error = req.flash('error')
      res.locals.user = req.user || null

      if(req.url != '/css/bootstrap.min.css.map') {
        res_url = req.url
        res.locals.res_url = res_url
      }

      Lang.find((err, docs) => {
        if( err ) {
          throw err
        } else {
          var languages = []
          var languages_short = []

          for(var i = 0; i<docs.length; i++){
            var data = docs[i].toJSON()

            languages.push({name_short: data.name_short, name_full: data.name_full})
            languages_short.push(data.name_short)
          }

          res.locals.languages = languages

          Lang.find({name_short: (req.cookies.timerLanguage)?req.cookies.timerLanguage:req.acceptsLanguages(...languages_short)}, (err, docs) => {
            if( err ) {
              throw err
              next()
            } else {
              var data = docs[0].toJSON()
              var lang = {}

              Object.keys(data).forEach((key) => {
                if(key != '_id' && key != '__v')
                lang[key] = data[key]
              })

              res.locals.lang = lang
              next()
            }

          })
        }

      })


    })
  }

  initFlash(){
    // Connect Flash
    app.use(flash())
  }

  initRoutes(){
    // Set Routes
    app.use((req, res, next) => {

      app.use('/', routes)
      app.use('/users', users)
      app.use('/logs', logs)
      app.use('/settings', settings)

      next()
    })
  }

  start(){
    // Set Port
    app.set('port', (process.env.PORT || 8000))

    app.listen(app.get('port'), () => {
      console.log("Server started on port "+app.get('port'))

      setInterval(() => {
        http.get("http://bcweb-app.herokuapp.com")
      }, 900000)
    })

  }

  initStaticFolder(){
    // Set Static Folder
    app.use(express.static(path.join(__dirname, 'public')))
  }

}

new Server()
