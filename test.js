var mongoose = require('mongoose')

var User = require('./models/user')
var Log = require('./models/log')

const config = require('./config/database')

const { getMonthNames, getLogsByUsername, startBackup, closeAllLogs, createEmptyLogs } = require('./actions/actions.js')
const { convertToMinutes, checkLenght, convertToHours, sortByDate, getYear, getMonth, getDay, getMonthSlashYear, getIsWeekend } = require('./actions/date.js')


mongoose.connect(config.database)

// On Connection
mongoose.connection.on('connected', () => {
  console.log('Connected to mongo server')
})

// On Error
mongoose.connection.on('error', (err) => {
  console.log('Database error: '+err)
})

// closeAllLogs()
// createEmptyLogs()
startBackup()