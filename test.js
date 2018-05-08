var mongoose = require('mongoose')

var User = require('./models/user')
var Log = require('./models/log')

const config = require('./config/database')

const { getMonthNames, getLogsByUsername, startBackup, closeAllLogs, createEmptyLogs, getPersonalLastLogTime, getPersonalLastLogTimePlus } = require('./actions/actions.js')
const { convertToMinutes, checkLenght, convertToHours, convertDate, sortByDate, getYear, getMonth, getDay, getMonthSlashYear, getIsWeekend } = require('./actions/date.js')


mongoose.connect(config.database)

// On Connection
mongoose.connection.on('connected', () => {
  console.log('Connected to mongo server')
})

// On Error
mongoose.connection.on('error', (err) => {
  console.log('Database error: '+err)
})

function startWorkForUsers(){
  User.find((err, userDocs) => {

    userDocs.forEach((item)=>{
      var date = '2018-05-08'
      var option = {
        date: convertDate(date),
        time_start: '08:00',
        time_over: '',
        time_plus: { time: '00:00', description: '' },
        status: 'started',
        username: item.username,
        sum_time: ''
      }

      var newLog = new Log(option)

      Log.createLog(newLog, (err, log) => {
        if(err) throw err
        console.log(log)
      })

    })

  })
}

function removeWorkForUsers(){
  User.find((err, userDocs) => {

    userDocs.forEach((item)=>{
      var date = '2018-05-08'
      var option = {
        date: convertDate(date),
        time_start: '08:00',
        time_over: '',
        time_plus: { time: '00:00', description: '' },
        status: 'started',
        username: item.username,
        sum_time: ''
      }

      Log.find(option, (err, log) => {
        if(err) throw err
        console.log(log)
      })

      // Log.update(option, {'$pull': option}, (err, log) => {
      //   if(err) throw err
      //   console.log(log)
      // })

    })

  })
}

function addWorkplaceForUsers(){
  User.find((err, userDocs) => {
    userDocs.forEach((item)=>{
      // switch (item.username) {
      //   case 'bohdan.zborovskyi':
      //     item.workplace = 3
      //     break
      //   case 'admin':
      //     item.workplace = 4
      //     break
      //   case 'pawel.cudny':
      //     item.workplace = 2
      //     break
      //   case 'filip.bartnicki':
      //     item.workplace = 1
      //     break
      //   case 'ilona.kaluska':
      //     item.workplace = 5
      //     break
      //   case 'marcin.kalinowski':
      //     item.workplace = 7
      //     break
      //   case 'pawel.potacki':
      //     item.workplace = 8
      //     break
      //   case 'piotr.pogorzelski':
      //     item.workplace = 6
      //     break
      //   default:
      //     item.workplace = 0
      // }

      switch (item.username) {
        case 'kinga.sabak':
          item.workplace = 3
          break
        case 'dominik.śpiewak':
          item.workplace = 4
          break
        case 'pawel.cudny':
          item.workplace = 2
          break
        case 'filip.bartnicki':
          item.workplace = 1
          break
        case 'ilona.kaluska':
          item.workplace = 5
          break
        case 'krzysztof.dabrowski':
          item.workplace = 7
          break
        case 'pawel.potacki':
          item.workplace = 8
          break
        case 'piotr.pogorzelski':
          item.workplace = 6
          break
        default:
          item.workplace = 0
      }

      item.save()

    })
  })
}


function removeLogByOption(){
  var option = {
    username: 'bohdan.zborovskyi',
    date: '08/05/2018',
    // time_start: '09:09'
  }

  Log.findOne(option, (err, log) => {
    if (log) {
      console.log(log)
      // log.remove()
    }

    if (!err) console.log('success!')
    else console.log('error')
  })

}


// startWorkForUsers()

// removeWorkForUsers()

addWorkplaceForUsers()

// removeLogByOption()



// closeAllLogs()
// createEmptyLogs()
// startBackup()
