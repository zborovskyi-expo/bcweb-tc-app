$(window).load(function(){

  var time_save = $("#clock_content .clock_start").html()
  var time_plus = $("#clock_content .clock_plus").html()

  function checkLenght(text) {
    return (text < 10)?('0' + text):text
  }

  function convertToMinutes(time) {
    return Number(time.split(':')[0]) * 60 + Number(time.split(':')[1])
  }

  function convertToString(time) {
    return checkLenght(Math.floor(time/60))+':'+checkLenght(time%60)
  }

  function getTimeNowString() {
    return checkLenght(new Date().getHours())+':'+checkLenght(new Date().getMinutes())
  }

  function getSumTime(time_start, time_over, time_plus) {

    var sum_time = convertToMinutes(time_over) - convertToMinutes(time_start) + convertToMinutes(time_plus)

    if(sum_time>=60)
      return checkLenght(Math.floor(sum_time/60))+':'+checkLenght(sum_time%60)
    return '00:'+checkLenght(sum_time)

  }

  function myTimer() {

    var time_now = getTimeNowString()

    if(time_save != time_now)
      $("#clock_content .clock_start").html(getSumTime(time_save, time_now, time_plus))

  }

  function checkNavi() {
    var res_url = $('#res_url').text()
    $('#left_navi li').each(function(){
      if($(this).find('a').attr('href') == res_url)
        $(this).addClass('active')
    })
  }

  function initSelectUsername(){
    if($('select#username'))
      $('select#username').selectpicker()

    if($('select#language'))
      $('select#language').selectpicker()
  }

  function dateFormControlInit(){
    if($("#date.form-control").length)
      $("#date.form-control").val(new Date().getFullYear()+'-'+checkLenght(new Date().getMonth()+1)+'-'+checkLenght(new Date().getDate()))
  }

  function clockTimeContentInit(){
    if($("#clock_content").length)
      var myVar = setInterval(function() {
        myTimer()
        if(!$("#clock_content").hasClass('active'))
          $("#clock_content").addClass('active')
      }, 1000)
  }

  function initFocusSpecButton(){
    if($('.btn.spec-button') && !$('.btn.spec-button').hasClass('disabled'))
      $('.btn.spec-button').focus()
  }

  function initWorkplaceCounters(){
    $('.panel.panel-workplace').each(function(){
      if($(this).find('.body-time_left')){
        var time_start = $(this).find('.body-time_start .badge').text(),
          time_plus = $(this).find('.body-time_plus .badge').text() || '00:00',
          time_now = getTimeNowString()

        $(this).find('.body-time_left .badge').html(getSumTime(time_start, time_now, time_plus))
      }

      if($(this).find('.body-time_sum')){
        var time_start = $(this).find('.body-time_start .badge').text(),
          time_plus = $(this).find('.body-time_plus .badge').text() || '00:00',
          time_over = $(this).find('.body-time_over .badge').text()

        $(this).find('.body-time_sum .badge').html(getSumTime(time_start, time_over, time_plus))
      }
    })
  }

  initWorkplaceCounters()

  initFocusSpecButton()

  initSelectUsername()

  dateFormControlInit()

  clockTimeContentInit()

  checkNavi()

})

$(document).ready(function(){
  $('[data-toggle="popover"]').popover()
})
