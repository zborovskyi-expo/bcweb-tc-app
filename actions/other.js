const getIP = require('ipware')().get_ip,
      fs = require('fs'),
      json2csv = require('json2csv'),
      backup = require('mongodb-backup'),
      sendmail = require('sendmail')(),
      config = require('../config/database')

function checkIp(req, res, next) {

  var const_ip = '80.55.43.241'
  var ipInfo = getIP(req)

  if(ipInfo.clientIp == const_ip || (res.locals.user!=null && !res.locals.user.blockedByIp)) {
    return next()
  } else {
    req.flash('error_msg', res.locals.lang.not_good_ip)
    res.redirect('../../../error_404')
  }
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function sortByUsername(docs){

  docs.sort((a, b) => {
    if(a.username < b.username) return -1
    if(a.username > b.username) return 1
    return 0
  })

  return docs
}

function sortByAlphabet(users){
  users.sort((a, b) => {
    if(a < b) return -1
    if(a > b) return 1
    return 0
  })

  return users
}

function convertToCSV(docs, title) {
  var fields = ['date', 'time_start', 'time_over', 'sum_time'],
    fieldsNames = ['Data', 'Od', 'Do', 'Godziny'],
    list = [],
    sum_time = 0

  docs = sortByDate(docs)

  for (var i = 0; i < docs.length; i++) {
    var object = {}
    object.date = docs[i].date
    object.time_start = docs[i].time_start
    object.time_over = docs[i].time_over
    object.sum_time = docs[i].sum_time
    logChunks.push(object)
    if(docs[i].sum_time != "")
      sum_time += convertToMinutes(docs[i].sum_time)
  }

  sum_time = convertToHours(sum_time)

  list.push({date: '', time_start: '', time_over: '', sum_time: sum_time})

  var option = {
    data: list,
    fields: fields,
    fieldsNames: fieldsNames,
    quotes: ''
  }

  fs.writeFile('files/'+title+'.csv', docs, (err) => {
    if (err) throw err
    var email_from = 'bcwebapp.backup@gmail.com'
    var email_to = 'bcwebapp.backup@gmail.com, pawel@bcweb.pl'
    //email_to = 'bohdan.zborovskyi@gmail.com'

    sendmail({
      from: email_from,
      to: email_to,
      subject: title,
      html: title,
      attachments: [{   // utf-8 string as an attachment
        filename: title+'.csv',
        path: 'files/'+title+'.csv',
        contentType: 'application/csv'
      }]
    }, (err, reply) => {
      if(err) throw err
    })
  })

  return json2csv(option)
}

function getTitleCSV(username, month, year) {

  if(username.split('.').length>1)
    username = capitalizeFirstLetter(username.split('.')[0]) + ' ' + capitalizeFirstLetter(username.split('.')[1])
  else
    username = capitalizeFirstLetter(username.split('.')[0])

  month = getMonthNames('pl')[Number(month)].toUpperCase()
  return month+' '+year+' - '+username
}

function createBackup(database) {
  var date = new Date().getDate()+'_'+(new Date().getMonth()+1)+'_'+new Date().getFullYear()

  var backup_root = 'backup'
  var backup_name = 'backup_'+date
  var email_from = 'bohdan.blabla@blabla.com'
  var email_to = 'bcwebapp.backup@gmail.com, backup@biuro.bcweb.pl'
  // email_to = 'bcwebapp.backup@gmail.com'
  // email_to = 'bohdan.zborovskyi@gmail.com'

  backup({
    uri: config.database,
    root: backup_root,
    parser: 'json',
    tar: backup_name+'.tar',
    callback: (err) => {
      if(err) throw err
      else {
        console.log('Created database`s backup')

        sendmail({
          from: email_from,
          to: email_to,
          subject: 'Backup bazy danych',
          html: 'Backup bazy danych '+date,
          attachments: [{   // utf-8 string as an attachment
            filename: backup_name+'.tar',
            path: backup_root+'/'+backup_name+'.tar',
            contentType: 'application/x-compressed'
          }]
        }, (err, reply) => {
          if(err) console.log(err)
        })

      }
    }
  })

}



module.exports = {
  checkIp, capitalizeFirstLetter, sortByAlphabet,
  convertToCSV, getTitleCSV, sortByUsername, createBackup
}