const mongoose = require('mongoose')
const config = require('../config/database')

const User = require('../models/user')

mongoose.connect(config.database);

// On Connection
mongoose.connection.on('connected', () => {
  console.log('Connected to mongo server')
})

// On Error
mongoose.connection.on('error', (err) => {
  console.log('Database error: '+err)
})

function changeUser(){
  User.find((err, docs) => {
    docs.forEach((item) => {
      item.blockedByIp = true
      if(item.username=='bohdan.zborovskyi')
        item.blockedByIp = false
      item.save()
      console.log(item)
    })
  })
}

changeUser()
