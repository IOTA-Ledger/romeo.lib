'use strict';

var crypto = require('crypto');
var XXH = require('xxhashjs');
var validate = require('./validate');

/**
 * Creates a random 24-char-long hexadecimal identifier.
 * @returns {string}
 */
function createIdentifier() {
  return crypto.randomBytes(12).toString('hex');
}

/**
 * Returns number of seconds that passed starting from a given time.
 * @param time
 * @returns {number}
 */
function getSecondsPassed(time) {
  if (!time) {
    return 0;
  }
  return (new Date().getTime() - time.getTime()) / 1000;
}

function isNormalInteger(str) {
  var n = Math.floor(Number(str));
  return n !== Infinity && String(n) === str && n >= 0;
}

function getAccountNumber(accountName) {
  if (isNormalInteger(accountName)) {
    return accountName.substring(0, 9);
  }
  var H = XXH.h32(0xabcd);
  return H.update(accountName).digest().toString(10).substring(0, 9);
}

module.exports = {
  validate: validate,
  createIdentifier: createIdentifier,
  getSecondsPassed: getSecondsPassed,
  getAccountNumber: getAccountNumber
};