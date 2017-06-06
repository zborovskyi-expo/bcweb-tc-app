$(window).load(function(){

  function startTime() {
    var time = convertToMinutes(getTimeNowString()) - convertToMinutes($('#clock_content').text());
    time = convertToString(time);
    return time;
  }

  function checkLenght(text) {
    if (text < 10) text = '0' + text;
    return text;
  }

  function convertToMinutes(time) {
    time = time.split(':');
    time = Number(time[0]) * 60 + Number(time[1]);

    return time;
  }

  function convertToString(time) {
    var hours = Math.floor(time/60);
    var minutes = time%60;

    hours = checkLenght(hours);
    minutes = checkLenght(minutes);
    
    time = hours+':'+minutes;
    
    return time;
  }

  function getTimeNowString() {
    var date_now = new Date();

    var hours = checkLenght(date_now.getHours());
    var minutes = checkLenght(date_now.getMinutes());

    var time = hours+':'+minutes;

    return time;
  }

  function getSumTime(time_start, time_over) {
    
    time_start = convertToMinutes(time_start);
    time_over = convertToMinutes(time_over);
    
    var sum_time = time_over - time_start;

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
  }

  if($("#clock_content").length) {
    var myVar = setInterval(function() {
      myTimer();
    }, 1000);
  }


  function myTimer() {
    var time_save = startTime();
    var time_now = getTimeNowString();

    if(time_save != time_now) {
      document.getElementById("clock_content").innerHTML = getSumTime(time_save, time_now);
    }
  }

  function checkNavi() {
    var res_url = $('#res_url').text();
    $('#left_navi li').each(function(){
      if($(this).find('a').attr('href') == res_url) {
        $(this).addClass('active');
      }
    });
  }

  checkNavi();

});