
function getMonthNames(lang){

  var monthNames = []

  switch (lang) {
    case 'en':
      monthNames = [0, "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
      break
    case 'pl':
      monthNames = [0, "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"]
      break
  }

  return monthNames
}

function getDateString(option) {
  if(option == 'slash')
    return checkLenght(new Date().getDate())+'/'+checkLenght(new Date().getMonth()+1)+'/'+new Date().getFullYear()
  return checkLenght(new Date().getDate())+'_'+checkLenght(new Date().getMonth()+1)+'_'+new Date().getFullYear()
}

function convertDate(date) {
  return date.split('-')[2]+'/'+date.split('-')[1]+'/'+date.split('-')[0]
}

function checkLenght(text) {
  return (text < 10)?('0'+text):text
}

function getYear(date){
  return date.split('/')[2]
}

function getMonth(date){
  return date.split('/')[1]
}

function getDay(date){
  return date.split('/')[0]
}

function getMonthSlashYear(date){
  return date.split('/')[1] + '/' + date.split('/')[2]
}

function getIsWeekend(date){
  var _date = new Date(getYear(date), getMonth(date)-1, getDay(date))
  if(_date.getDay() == 0 || _date.getDay() == 6)
    return true
  return false
}

function convertToMinutes(time){
  if(time!='')
    return Number(time.split(':')[0]) * 60 + Number(time.split(':')[1])
  return 0
}

function convertToHours(time){
  if(time>=60)
    return checkLenght(Math.floor(time/60))+':'+checkLenght(time%60)
  return '00:'+checkLenght(time)
}

function getSumTime(time_start, time_over, time_plus){
  var sum_time = convertToMinutes(time_over) - convertToMinutes(time_start) + convertToMinutes(time_plus)
  if(sum_time>=0)
    return convertToHours(sum_time)
  return '00:00'
}

function sortByDate(docs){
  docs.sort((a,b) => {
    var date_f = a.date.split('/')
    var date_s = b.date.split('/')

    date_f = date_f[1]+'/'+date_f[0]+'/'+date_f[2]
    date_s = date_s[1]+'/'+date_s[0]+'/'+date_s[2]

    return new Date(date_s).getTime() - new Date(date_f).getTime()
  })

  return docs
}

function getTimeString(){
  return checkLenght(new Date().getHours())+':'+checkLenght(new Date().getMinutes())
}

module.exports = {
  getMonthNames, checkLenght, getYear, getMonth, getDay, getMonthSlashYear,
  getIsWeekend, convertToMinutes, convertToHours, sortByDate, convertDate,
  getSumTime, getDateString, getTimeString
}