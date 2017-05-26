var mongoose = require('mongoose');

// User Schema
var LogSchema = mongoose.Schema({
  date: {
    type: String,
    index: true
  },
  time_start: {
    type: String
  },
  time_over: {
    type: String
  },
  status: {
    type: String
  },
  username: {
    type: String
  },
  sum_time: {
    type: String
  }
});

var Log = module.exports = mongoose.model('Log', LogSchema);

module.exports.createLog = function(newLog, callback){
  newLog.save(callback);
}