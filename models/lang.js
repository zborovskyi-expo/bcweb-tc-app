const mongoose = require('mongoose')

// Lang Schema
const LangSchema = mongoose.Schema({
  name_short: {
    type: String,
    index: true
  },
  name_full: {
    type: String
  },
  title: {
    type: String
  },
  home: {
    type: String
  },
  profile: {
    type: String
  },
  my_logs: {
    type: String
  },
  log_out: {
    type: String
  },
  log_in: {
    type: String
  },
  registration: {
    type: String
  },
  dashboard: {
    type: String
  },
  settings: {
    type: String
  },
  logs_operations: {
    type: String
  },
  log_added: {
    type: String
  },
  log_finished: {
    type: String
  },
  logs_limit: {
    type: String
  },
  not_logged_in: {
    type: String
  },
  logged_in: {
    type: String
  },
  logged_out: {
    type: String
  },
  click_start: {
    type: String
  },
  click_end: {
    type: String
  },
  unclickable: {
    type: String
  },
  profile_desc: {
    type: String
  },
  my_logs_desc: {
    type: String
  },
  all_logs: {
    type: String
  },
  logs_users: {
    type: String
  },
  logs_by_month: {
    type: String
  },
  logs_by_user: {
    type: String
  },
  logs_by_user_desc: {
    type: String
  },
  un_req: {
    type: String
  },
  pass_req: {
    type: String
  },
  pass_d_match: {
    type: String
  },
  date_req: {
    type: String
  },
  status_req: {
    type: String
  },
  time_start_req: {
    type: String
  },
  time_over_req: {
    type: String
  },
  user_exist: {
    type: String
  },
  registered: {
    type: String
  },
  user_unknown: {
    type: String
  },
  inv_pass: {
    type: String
  },
  log_exist: {
    type: String
  },
  log_export: {
    type: String
  },
  log_notexist: {
    type: String
  },
  log_changed: {
    type: String
  },
  username_changed: {
    type: String
  },
  error_username_change: {
    type: String
  },
  log_added_auto: {
    type: String
  },
  month_req: {
    type: String
  },
  year_req: {
    type: String
  },
  export_failed: {
    type: String
  },
  not_good_ip: {
    type: String
  },
  settings_desc: {
    type: String
  },
  edit_users: {
    type: String
  },
  edit_users_desc: {
    type: String
  },
  sign_up: {
    type: String
  },
  sign_in: {
    type: String
  },
  submit: {
    type: String
  },
  add_log_title: {
    type: String
  },
  add_log_desc: {
    type: String
  },
  edit_log_title: {
    type: String
  },
  edit_log_desc: {
    type: String
  },
  username: {
    type: String
  },
  select_username: {
    type: String
  },
  new_username: {
    type: String
  },
  status: {
    type: String
  },
  status_started: {
    type: String
  },
  status_overed: {
    type: String
  },
  date_text: {
    type: String
  },
  time_start: {
    type: String
  },
  time_over: {
    type: String
  },
  time_plus: {
    type: String
  },
  month: {
    type: String
  },
  year: {
    type: String
  },
  sum_time: {
    type: String
  },
  sum_hours: {
    type: String
  },
  export_logs_title: {
    type: String
  },
  export_logs_desc: {
    type: String
  },
  error_404_title: {
    type: String
  },
  error_404_desc: {
    type: String
  },
  logs: {
    type: String
  },
  logs_desc: {
    type: String
  },
  new_username_req: {
    type: String
  },
  edit_langs: {
    type: String
  },
  edit_langs_desc: {
    type: String
  },
  langs_changed: {
    type: String
  },
  error_langs_change: {
    type: String
  },
  language: {
    type: String
  },
  language_changed: {
    type: String
  },
  error_language_change: {
    type: String
  },
  edit_blocking: {
    type: String
  },
  edit_blocking_desc: {
    type: String
  },
  blocking_is_on: {
    type: String
  },
  blocking_is_off: {
    type: String
  },
  bloking_changed: {
    type: String
  },
  summary_logs: {
    type: String
  },
  add_time_plus: {
    type: String
  },
  add_time_plus_desc: {
    type: String
  },
  plus_time: {
    type: String
  },
  plus_desc: {
    type: String
  },
  time_plus_added: {
    type: String
  },
  time_plus_exist: {
    type: String
  },
  plus_time_req: {
    type: String
  },
  plus_desc_req: {
    type: String
  }
})

const Lang = module.exports = mongoose.model('Lang', LangSchema)

module.exports.createLang = (newLang, callback) =>
  newLang.save(callback)