const mongoose = require('mongoose'),
      bcrypt = require('bcryptjs')

// User Schema
const UserSchema = mongoose.Schema({
  username: {
    type: String,
    index: true
  },
  password: {
    type: String
  },
  status: {
    type: String
  },
  blockedByIp: {
    type: Boolean
  }
});

const User = module.exports = mongoose.model('User', UserSchema)

module.exports.createUser = (newUser, callback) =>
  bcrypt.genSalt(10, (err, salt) =>
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      newUser.password = hash
      newUser.save(callback)
    }))

module.exports.getUserByUsername = (username, callback) =>
  User.findOne({username: username}, callback)

module.exports.getUserById = (id, callback) =>
  User.findById(id, callback)

module.exports.comparePassword = (candidatePassword, hash, callback) =>
  bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
    if(err) throw err
    callback(null, isMatch)
  })