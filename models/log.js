const mongoose = require('mongoose')

// User Schema
const LogSchema = mongoose.Schema({
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
  time_plus: {
    time: {
      type: String
    },
    description: {
      type: String
    }
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
})

const Log = module.exports = mongoose.model('Log', LogSchema)

module.exports.createLog = (newLog, callback) =>
  newLog.save(callback)