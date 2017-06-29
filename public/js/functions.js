$(window).load(function(){

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
      if(!$("#clock_content").hasClass('active')) {
        $("#clock_content").addClass('active');
      }
    }, 1000);
  }

  if($("#date.form-control").length) {
    var date_now = new Date();

    var day = checkLenght(date_now.getDate());
    var month = checkLenght(date_now.getMonth()+1);
    var year = date_now.getFullYear();

    var date = year+'-'+month+'-'+day;

    $("#date.form-control").val(date);
  }

  const time_save = $("#clock_content").html();

  function myTimer() {
    var time_now = getTimeNowString();

    if(time_save != time_now) {
      $("#clock_content").html(getSumTime(time_save, time_now));
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
