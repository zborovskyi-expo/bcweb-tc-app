$(window).load(function(){

  function checkLenght(text) {
    if (text < 10) text = '0' + text;
    return text;
  }

  function convertMinutes(time) {
    time = time.split(':');
    time = Number(time[0]) * 60 + Number(time[1]);

    return time;
  }
  
  function getTimeString(time) {
    time = convertMinutes(time) + 1;

    var hours = Math.floor(time/60);
    var minutes = time%60;

    hours = checkLenght(hours);
    minutes = checkLenght(minutes);

    time = hours+':'+minutes;

    return time;
  }

  var myVar = setInterval(function() {
    myTimer();
  }, 60000);

  function myTimer() {
    var time = $('#clock_content').text();
    var d = getTimeString(time);
    document.getElementById("clock_content").innerHTML = d;
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