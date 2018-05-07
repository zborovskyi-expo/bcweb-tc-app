const mongoose = require('mongoose')
const config = require('../config/database')

const Log = require('../models/log')

mongoose.connect(config.database);

// On Connection
mongoose.connection.on('connected', () => {
  console.log('Connected to mongo server')
})

// On Error
mongoose.connection.on('error', (err) => {
  console.log('Database error: '+err)
})

function changeLog(){
  Log.find((err, logDocs) => {
    logDocs.forEach((item) => {
      item.time_plus = {time: '00:00', description: ''}
      item.save()
      console.log(item)
    })
  })
}

changeLog()