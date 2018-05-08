const Log = require('../models/log.js'),
      User = require('../models/user.js'),
      {
        getMonthNames, checkLenght, getYear, getMonth, getDay, getMonthSlashYear,
        getIsWeekend, convertToMinutes, convertToHours, sortByDate, convertDate,
        getSumTime, getDateString, getTimeString
      } = require('./date.js'),
      {
        checkIp, capitalizeFirstLetter, sortByAlphabet, convertToCSV,
        getTitleCSV, createBackup
      } = require('./other.js')


function ifEqualsLog(docs, username, date) {
  var ifFind = true

  for (var i = 0; i < docs.length; i++)
    if(docs[i].username == username && docs[i].date == date)
      ifFind = false

  return ifFind
}

function getLogsByUsername(docs, username){
  var list = []

  for (var i = 0; i < docs.length; i += 1)
    if(docs[i].username == username)
      list.push(docs[i])

  return list
}

function getSumTimeByMonth(docs, username, dateName){
  var sum_time = 0

  for (var i = 0; i < docs.length; i++) {
    var date = docs[i].date,
        _dateName = getMonthSlashYear(date)

    if(docs[i].username == username)
      if(dateName == _dateName && docs[i].status == 'overed')
        sum_time += convertToMinutes(docs[i].sum_time)
  }

  return convertToHours(sum_time)
}

function getUsers(docs) {
  var list = []

  for (var i = 0; i < docs.length; i++)
    list.push(docs[i].username)

  return sortByAlphabet(list)
}

function getYears(docs) {
  var list = []

  for (var i = 0; i < docs.length; i++)
    list.push(getYear(docs[i].date))

  list = list.filter((item, pos, self) => {
    return self.indexOf(item) == pos
  })

  return list
}

function getMonths(docs) {
  var list = []

  for (var i = 0; i < docs.length; i++)
    list.push(getMonthNames('pl')[Number(getMonth(docs[i].date))])

  list = list.filter((item, pos, self) => {
    return self.indexOf(item) == pos
  })

  return list
}

function getLogsByDate(docs, month, year) {
  var list = []

  for (var i = 0; i < docs.length; i++)
    if(month == getMonth(docs[i].date) && year == getMonth(docs[i].date))
      list.push(docs[i])

  return list
}

function getPersonalLastLogStatus(docs, username) {
  for (var i = 0; i < docs.length; i++)
    if(docs[i].username == username && docs[i].date == getDateString('slash'))
      return docs[i].status
}

function getPersonalLastLogTime(docs, username) {
  for (var i = 0; i < docs.length; i++)
    if(docs[i].username == username && docs[i].date == getDateString('slash') && docs[i].status == 'started')
      return docs[i].time_start
}

function getPersonalLastLogTimeStart(docs, username) {
  for (var i = 0; i < docs.length; i++)
    if(docs[i].username == username && docs[i].date == getDateString('slash'))
      return (docs[i].time_start)?docs[i].time_start:'00:00'
}

function getPersonalLastLogTimeOver(docs, username) {
  for (var i = 0; i < docs.length; i++)
    if(docs[i].username == username && docs[i].date == getDateString('slash') && docs[i].status == 'overed')
      return docs[i].time_over
}

function getPersonalLastLogTimePlus(docs, username) {
  for (var i = 0; i < docs.length; i++)
    if(docs[i].username == username && docs[i].date == getDateString('slash'))
      if(docs[i].time_plus)
        return docs[i].time_plus.time
      return null
}

function getPersonalLastLogTimeDesc(docs, username) {
  for (var i = 0; i < docs.length; i++)
    if(docs[i].username == username && docs[i].date == getDateString('slash'))
      if(docs[i].time_plus)
        return docs[i].time_plus.description
      return null
}



function getPersonalLastLog(docs, username) {
  for (var i = 0; i < docs.length; i++)
    if(docs[i].username == username && docs[i].date == getDateString('slash') )
      if(docs[i].status == 'started')
        return 'start'
      else
        return 'end'
}

function getUsersByUsername(docs, username) {
  var list = []

  for (var i = 0; i < docs.length; i++)
    if(username == docs[i].username)
      list.push(docs[i].username)

  return list
}

function getLogsByStatus(docs, status) {
  var list = []

  for (var i = 0; i < docs.length; i++)
    if(docs[i].status == status)
      list.push(docs[i])

  return list
}

function checkLogStatus(docs, date, username, time) {

  var status = ''
  var sum_time = ''
  if(docs.date == date && docs.username == username && docs.status == 'started') {
    status = 'overed'
    sum_time = getSumTime(docs.time_start, time, (docs.time_plus)?docs.time_plus.time:'00:00')
  } else {

    if(docs.date == date && docs.username == username && docs.status == 'overed') {
      status = 'error'
    }
  }

  return {
    status: status,
    sum_time: sum_time
  }
}

function setLogsByStatus(docs, criteria){
  var status = 'overed',
      time = '23:30'

  for (var i = 0; i < docs.length; i++)
    Log.update(criteria, {status: status, time_over: time, sum_time: getSumTime(docs[i].time_start, time, (docs[i].time_plus)?docs[i].time_plus.time:'00:00') }, (err) => {
      if(err) throw err
    })
}

function getPersonalLogs(docs, username) {
  var dateNameList = []
  var personalLogsListByUsername = getLogsByUsername(sortByDate(docs), username)

  for (var i = 0; i < personalLogsListByUsername.length; i++) {
    var date = personalLogsListByUsername[i].date,
        dateName = getMonthSlashYear(date)

    if(!dateNameList.some(item => item.dateName == dateName))
      dateNameList.push({dateName: dateName, monthName: getMonthNames('pl')[Number(getMonth(date))], yearName: getYear(date), logs: [], sum_time: 0})

  }

  for (var i = 0; i < personalLogsListByUsername.length; i++) {
    var date = personalLogsListByUsername[i].date,
        dateName = getMonthSlashYear(date)

    dateNameList.some(item => {
      if(item.dateName == dateName){
        item.logs.push({date: personalLogsListByUsername[i].date, weekend: getIsWeekend(date), time_start: personalLogsListByUsername[i].time_start, time_over: personalLogsListByUsername[i].time_over, time_plus: personalLogsListByUsername[i].time_plus, username: personalLogsListByUsername[i].username, status: personalLogsListByUsername[i].status, sum_time: personalLogsListByUsername[i].sum_time})
        item.sum_time += convertToMinutes(personalLogsListByUsername[i].sum_time)
      }
    })
  }

  dateNameList.some(item => {
    item.sum_time = convertToHours(item.sum_time)
  })

  return dateNameList
}

function getLogsSummary(docs) {
  var dateNameList = []

  docs = sortByDate(docs)

  for (var i = 0; i < docs.length; i++) {
    var date = docs[i].date,
        dateName = getMonthSlashYear(date)

    if(!dateNameList.some(item => item.dateName == dateName))
      dateNameList.push({dateName: dateName, monthName: getMonthNames('pl')[Number(getMonth(date))], yearName: getYear(date), logs: [], sum_time: 0})
  }

  for (var i = 0; i < docs.length; i++) {
    var date = docs[i].date,
        dateName = getMonthSlashYear(date)

    dateNameList.some(item => {
      if(item.dateName == dateName)
        if(!item.logs.some(log => log.username == docs[i].username)){
          item.logs.push({
            username: docs[i].username,
            sum_time: getSumTimeByMonth(docs, docs[i].username, dateName)
          })
        }
    })
  }

  return dateNameList
}


function closeAllLogs() {
  Log.find((err, logDocs) => {
    setLogsByStatus(getLogsByStatus(logDocs, 'started'), { status: 'started' })
  })
}

function createEmptyLogs() {

  User.find((err, userDocs) => {
    var userList = getUsers(userDocs)

    Log.find((err, logDocs) => {
      for(var i = 0; i < userList.length; i++) {
        var log = []
        var username = userList[i]
        var date = getDateString('slash')

        for(var j = 0; j < logDocs.length; j++)
          if(logDocs[j].username == username && logDocs[j].date == date)
            log.push(logDocs[j])

        if(log.length == 0) {
          var newLog = new Log({
            date: date,
            time_start: '00:00',
            time_over: '00:00',
            time_plus: {time: '00:00', description: ''},
            status: 'overed',
            username: username,
            sum_time: '00:00'
          })

          Log.createLog(newLog, (err, log) => {
            if(err) throw err
            console.log(log)
          })
        }
      }
    })

  })
}

function getAllLogs(docs) {
  var dateNameList = []
  var logsList = sortByDate(docs)

  for (var i = 0; i < logsList.length; i++) {
    var date = logsList[i].date,
        dateName = getMonthSlashYear(date)

    if(!dateNameList.some(item => item.dateName == dateName))
      dateNameList.push({dateName: dateName, monthName: getMonthNames('pl')[Number(getMonth(date))], yearName: getYear(date), logs: [], sum_time: 0})

  }

  for (var i = 0; i < logsList.length; i++) {
    var date = logsList[i].date,
        dateName = getMonthSlashYear(date)

    dateNameList.some(item => {
      if(item.dateName == dateName){
        item.logs.push({date: logsList[i].date, weekend: getIsWeekend(date), time_start: logsList[i].time_start, time_over: logsList[i].time_over, time_plus: logsList[i].time_plus, username: logsList[i].username, status: logsList[i].status, sum_time: logsList[i].sum_time})
        item.sum_time += convertToMinutes(logsList[i].sum_time)
      }
    })
  }

  dateNameList.some(item => {
    item.sum_time = convertToHours(item.sum_time)
  })

  return dateNameList
}

function startBackup() {
  Log.find((err, logDocs) => {
    createBackup(getLogsByStatus(logDocs, 'overed'))
  })
}

function getWorkplacesSchema(logDocs, userDocs){
  var schemaList = []

  userDocs.forEach((item)=>{
    if(item.workplace!=0)
      schemaList.push({
        username: item.username,
        workplace: item.workplace,
        workTimeStart: getPersonalLastLogTime(logDocs, item.username) || (getPersonalLastLogTimeStart(logDocs, item.username) || ''),
        workTimePlus: getPersonalLastLogTimePlus(logDocs, item.username) || '',
        workTimeOver: getPersonalLastLogTimeOver(logDocs, item.username) || '',
        isWorkOvered: getPersonalLastLogStatus(logDocs, item.username) || '',
        isWorkStarted: getPersonalLastLogStatus(logDocs, item.username)?getPersonalLastLogStatus(logDocs, item.username):false
      })
  })

  return schemaList
}


module.exports = {
  checkLenght, closeAllLogs, getUsersByUsername, getSumTimeByMonth,
  getLogsByStatus, getTimeString, convertDate, getSumTime, getDateString,
  getPersonalLastLogTime, getPersonalLastLog, getAllLogs, getLogsByUsername,
  getPersonalLogs, createEmptyLogs, setLogsByStatus, getPersonalLastLogTimePlus,
  getPersonalLastLogTimeDesc, convertToMinutes, startBackup, convertToHours,
  capitalizeFirstLetter, checkIp, ifEqualsLog, getUsers, getYears, getMonths,
  getLogsByDate, getTitleCSV, convertToCSV, getMonthNames, getLogsSummary,
  checkLogStatus, getWorkplacesSchema, getPersonalLastLogTimeOver,
  getPersonalLastLogStatus, getPersonalLastLogTimeStart
}