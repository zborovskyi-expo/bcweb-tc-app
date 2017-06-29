var express = require('express');
var router = express.Router();
var sendmail = require('sendmail')();

var lang = require('../public/js/lang.js').lang;

var User = require('../models/user');
var Log = require('../models/log');


var monthNames = [0, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var monthNamesPL = [0, "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];

function checkLenght(text) {
  if (text < 10) text = '0' + text;
  return text;
}

function convertMinutes(time) {
  time = time.split(':');
  time = Number(time[0]) * 60 + Number(time[1]);

  return time;
}

function convertHours(time) {

  if(time>=60) {
    hours = Math.floor(time/60);
    minutes = time%60;

    hours = checkLenght(hours);
    minutes = checkLenght(minutes);

    time = hours+':'+minutes;
  } else {
    time = checkLenght(time);
    time = '00:'+time;
  }

  return time;
}

function getSumTime(time_start, time_over) {

  var chunkSize = 1;

  time_start = convertMinutes(time_start);
  time_over = convertMinutes(time_over);

  var sum_time = time_over - time_start;

  if(sum_time>=0) {
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
  } else {
    return '00:00';
  }
}

function convertDate(date) {
  date = date.split('-');
  return date = date[2]+'/'+date[1]+'/'+date[0];
}

function ifEqualsLog(docs, username, date) {
  var chunkSize = 1;
  var ifFind = true;

  for (var i = 0; i < docs.length; i += chunkSize) {
    if(docs[i].username == username && docs[i].date == date) {
      ifFind = false;
    }
  }

  return ifFind;
}

function getUsers(docs) {
  var chunkSize = 1;
  var userChunks = [];
  for (var i = 0; i < docs.length; i += chunkSize) {
    userChunks.push(docs[i].username);
  }

  return userChunks;
}

function getYears(docs) {
  var chunkSize = 1;
  var yearChunks = [];
  for (var i = 0; i < docs.length; i += chunkSize) {
    var date = docs[i].date;
    date = date.split('/');
    date = date[2];
    yearChunks.push(date);
  }

  yearChunks = yearChunks.filter(function(item, pos, self) {
    return self.indexOf(item) == pos;
  });

  return yearChunks;
}

function getMonths(docs) {
  var chunkSize = 1;
  var monthChunks = [];
  for (var i = 0; i < docs.length; i += chunkSize) {
    var date = docs[i].date;
    date = date.split('/');
    date = monthNamesPL[Number(date[1])];
    monthChunks.push(date);
  }

  monthChunks = monthChunks.filter(function(item, pos, self) {
    return self.indexOf(item) == pos;
  });

  return monthChunks;
}

function getLogsByDate(docs, month, year) {
  var chunkSize = 1;
  var logChunks = [];
  for (var i = 0; i < docs.length; i += chunkSize) {
    var date = docs[i].date.split('/');
    if(month == date[1] && year == date[2]) {
      logChunks.push(docs[i]);
    }
  }
  return logChunks;
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function getTitleCSV(username, month, year) {
  var title = '';
  username = username.split('.');
  username = capitalizeFirstLetter(username[0]) + ' ' + capitalizeFirstLetter(username[1]);
  month = monthNamesPL[Number(month)];
  month = month.toUpperCase();
  title = month+' '+year+' - '+username;
  return title;
}

//var csv_export = require('csv-export');
var json2csv = require('json2csv');
var fs = require('fs');

function convertToCSV(docs, title) {
  var fields = ['date', 'time_start', 'time_over', 'sum_time'];
  var fieldsNames = ['Data', 'Od', 'Do', 'Godziny'];
  var chunkSize = 1;
  var logChunks = [];

  docs.sort(function(a,b) {
    var date_f = a.date.split("/");
    var date_s = b.date.split("/");

    date_f = date_f[1]+'/'+date_f[0]+'/'+date_f[2];
    date_s = date_s[1]+'/'+date_s[0]+'/'+date_s[2];

    return new Date(date_f).getTime() - new Date(date_s).getTime();
  });
  var sum_time = 0;
  for (var i = 0; i < docs.length; i += chunkSize) {
    var object = {};
    object.date = docs[i].date;
    object.time_start = docs[i].time_start;
    object.time_over = docs[i].time_over;
    object.sum_time = docs[i].sum_time;
    logChunks.push(object);
    if(docs[i].sum_time != "") {
      sum_time += convertMinutes(docs[i].sum_time);
    }
  }

  sum_time = convertHours(sum_time);

  logChunks.push({date: '', time_start: '', time_over: '', sum_time: sum_time});

  docs = logChunks;

  var option = {
    data: docs,
    fields: fields,
    fieldsNames: fieldsNames,
    quotes: ''
  }

  var docs = json2csv(option);

  fs.writeFile('files/'+title+'.csv', docs, function(err) {
    if (err) throw err;
    console.log('file saved');
    var email_from = 'bcwebapp.backup@gmail.com';
    var email_to = 'bcwebapp.backup@gmail.com, pawel@bcweb.pl';
    //email_to = 'bohdan.zborovskyi@gmail.com';

    sendmail({
      from: email_from,
      to: email_to,
      subject: title,
      html: title,
      attachments: [
        {   // utf-8 string as an attachment
          filename: title+'.csv',
          path: 'files/'+title+'.csv',
          contentType: 'application/csv'
        },
      ]
    }, function(err, reply) {
      console.error("Error:");
      console.log(err);
    });
  });

  return docs;
}

// logs
router.get('/', function(req, res){
  if(req.isAuthenticated()) {
    var title = 'Operację nad logami';
    var desc = 'Tutaj możesz wykonywać operację nad logami';
    res.render('logs', { title: title, desc: desc });
  } else {
    res.redirect('/users/login');
  }
});

// get add logs
router.get('/add_log', function(req, res){
  if(req.isAuthenticated()) {
    var title = 'Dodawanie logów';
    var desc = 'Tutaj możesz dodać nowy log';

    Log.find(function(err, docs) {

      var chunkSize = 1;

      User.find(function(err, docs) {

        userChunks = getUsers(docs);

        res.render('add_log', { title: title, desc: desc, users: userChunks });

      });

    });
  } else {
    res.redirect('/users/login');
  }
});

// edit logs
router.get('/edit_log', function(req, res){
  if(req.isAuthenticated()) {
    var title = 'Zmienianie logów';
    var desc = 'Tutaj możesz zmienić dowolny log';

    Log.find(function(err, docs) {

      var chunkSize = 1;

      User.find(function(err, docs) {

        userChunks = getUsers(docs);

        res.render('edit_log', { title: title, desc: desc, users: userChunks });

      });

    });
  } else {
    res.redirect('/users/login');
  }
});

// export logs
router.get('/export_logs', function(req, res){
  if(req.isAuthenticated()) {
    var title = 'Exportowanie logów';
    var desc = 'Tutaj możesz wyeksportować logi według użytkownika i miesiąca';

    Log.find(function(err, docs) {

      var chunkSize = 1;

      yearChunks = getYears(docs);

      monthChunks = getMonths(docs);

      User.find(function(err, docs) {

        userChunks = getUsers(docs);

        res.render('export_logs', { title: title, desc: desc, users: userChunks, months: monthChunks, years: yearChunks });

      });

    });
  } else {
    res.redirect('/users/login');
  }
});


// post add logs
router.post('/add_log', function(req, res){
  if(req.isAuthenticated()) {

    var sum_time = '';

    var username = req.body.username;
    var status = req.body.status;
    var date = convertDate(req.body.date);
    var time_start = req.body.time_start;
    var time_over = req.body.time_over;

    // Validation
    req.checkBody('username', lang['un_req']).notEmpty();
    req.checkBody('status', lang['status_req']).notEmpty();
    req.checkBody('date', lang['date_req']).notEmpty();
    req.checkBody('time_start', lang['time_start_req']).notEmpty();
    if(status == 'overed') {
      req.checkBody('time_over', lang['time_over_req']).notEmpty();
    }

    var errors = req.validationErrors();

    if(errors){
      for (error in errors) {
        req.flash('error_msg', ' '+errors[error].msg);
      }
      res.redirect('/logs/add_log');

    } else {

      Log.find(function(err, docs) {

        var option = {};

        if(status == 'started') {
          var option = {
            date: date,
            time_start: time_start,
            time_over: '',
            status: status,
            username: username,
            sum_time: ''
          }
        }

        if(status == 'overed') {
          var sum_time = getSumTime(time_start, time_over);

          var option = {
            date: date,
            time_start: time_start,
            time_over: time_over,
            status: status,
            username: username,
            sum_time: sum_time
          }

        }

        if(status == 'started' || status == 'overed') {
          if(ifEqualsLog(docs, username, date)) {
            if(status == 'overed') {

            }
            var newLog = new Log(option);

            Log.createLog(newLog, function(err, log){
              if(err) throw err;
              console.log(log);
            });

            req.flash('success_msg', lang['log_added_auto']);
            res.redirect('/logs');

          } else {
            req.flash('error_msg', lang['log_exist']);
            res.redirect('/logs/add_log');
          }

        }
      });
    }
  } else {
    res.redirect('/users/login');
  }
});

// post edit logs
router.post('/edit_log', function(req, res){
  if(req.isAuthenticated()) {

    var sum_time = '';

    var username = req.body.username;
    var status = req.body.status;
    var date = convertDate(req.body.date);
    var time_start = req.body.time_start;
    var time_over = req.body.time_over;

    // Validation
    req.checkBody('username', lang['un_req']).notEmpty();
    req.checkBody('date', lang['date_req']).notEmpty();

    var errors = req.validationErrors();

    if(errors){
      for (error in errors) {
        req.flash('error_msg', ' '+errors[error].msg);
      }
      res.redirect('/logs/edit_log');

    } else {

      var criteria = {
        username: username,
        date: date
      };

      Log.find(criteria, function (err, docs) {
        if(err) console.log(err);

        if(docs[0] != undefined) {

          if(time_start != '') {
            docs[0].time_start = time_start;
          }

          if(time_over != '') {
            docs[0].time_over = time_over;
          }

          if(status != '') {
            docs[0].status = status;
          }

          if(docs[0].status == 'overed' && docs[0].time_start != '' && docs[0].time_over != '') {
            docs[0].sum_time = getSumTime(docs[0].time_start, docs[0].time_over);
          }

          docs[0].save();

          req.flash('success_msg', lang['log_changed']);
          res.redirect('/logs');

        } else {
          req.flash('error_msg', lang['log_notexist']);
          res.redirect('/logs/edit_log');
        }
      });


    }
  } else {
    res.redirect('/users/login');
  }
});

// post edit logs
router.post('/export_logs', function(req, res){
  if(req.isAuthenticated()) {

    var username = req.body.username;
    var month = req.body.month;
    var year = req.body.year;

    // Validation
    req.checkBody('username', lang['un_req']).notEmpty();
    req.checkBody('month', lang['month_req']).notEmpty();
    req.checkBody('year', lang['year_req']).notEmpty();

    function arraySearch(arr, val) {
      for (var i=0; i<arr.length; i++)
        if (arr[i] === val)
          return i;
      return false;
    }

    month = checkLenght(arraySearch(monthNamesPL, month));

    var errors = req.validationErrors();

    if(errors){
      for (error in errors) {
        req.flash('error_msg', ' '+errors[error].msg);
      }
      res.redirect('/logs/export_logs');

    } else {

      var criteria = {
        username: username
      };

      Log.find(criteria, function (err, docs) {
        if(err) console.log(err);

        docs = getLogsByDate(docs, month, year);

        if(docs.length != 0) {
          var title = getTitleCSV(username, month, year);
          docs = convertToCSV(docs, title);
          //console.log(docs);
          req.flash('success_msg', lang['log_export']);
          res.redirect('/logs');

        } else {
          req.flash('error_msg', lang['export_failed']);
          res.redirect('/logs/export_logs');
        }
      });

    }
  } else {
    res.redirect('/users/login');
  }
});

module.exports = router;
