'use strict';

var passwordValidator = require('password-validator');

var passwordSchema = new passwordValidator().is().min(12).has().uppercase().has().lowercase().has().symbols().has().digits();

var usernameSchema = new passwordValidator().is().min(8).has().uppercase().has().lowercase();

var accountSchema = new passwordValidator().is().min(1).is().max(9).has().digits().not().letters().not().symbols().not().spaces();

function isPassword(password) {
  var result = passwordSchema.validate(password, { list: true });
  return {
    valid: !result.length,
    errors: result
  };
}
function isUsername(username) {
  var result = usernameSchema.validate(username, { list: true });
  return {
    valid: !result.length,
    errors: result
  };
}
function isAccount(account) {
  var result = accountSchema.validate(account, { list: true });
  return {
    valid: !result.length,
    errors: result
  };
}

module.exports = {
  isPassword: isPassword,
  isUsername: isUsername,
  isAccount: isAccount
};