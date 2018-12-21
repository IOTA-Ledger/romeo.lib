'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var IOTA = require('iota.lib.js');
var usePowSrvIO = require('iota.lib.js.powsrvio');
var async = require('async');

var _require = require('./db'),
    Database = _require.Database;

var _require2 = require('./config'),
    IOTA_API_ENDPOINT = _require2.IOTA_API_ENDPOINT;

function createAPI(_ref) {
  var path = _ref.path,
      password = _ref.password,
      provider = _ref.provider,
      database = _ref.database,
      guard = _ref.guard;

  var db = database || new Database({ path: path, password: password });
  var iota = new IOTA({ provider: provider || IOTA_API_ENDPOINT });
  var account = guard.opts.account;

  usePowSrvIO(iota, 5000, null);

  var getTrytes = iota.api.getTrytes.bind(iota.api);

  iota.api.getTrytes = function (hashes, callback) {
    // First, get trytes from db
    db.getMany(hashes.map(function (h) {
      return 'tryte-' + account + '-' + h;
    })).then(function (result) {
      // See what we don't have
      var requestHashes = result.map(function (r, i) {
        return r ? null : hashes[i];
      }).filter(function (h) {
        return h;
      });

      if (requestHashes.length) {
        // Request from backend:
        getTrytes(requestHashes, function (err, trytes) {
          if (err) {
            callback(err, null);
          }
          // Save all returned hashes
          Promise.all(trytes.map(function (tryte, i) {
            return db.put('tryte-' + account + '-' + requestHashes[i], tryte);
          })).then(function () {
            // Mixin new returned trytes to previous results:
            callback(null, result.map(function (r) {
              return r || trytes.splice(0, 1)[0];
            }));
          });
        });
      } else {
        // If we have everything, return:
        callback(null, result);
      }
    });
  };

  function getBalances(addresses, threshold, onCache, onLive) {
    var cachedOnly = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

    var callback = function callback(error, results) {
      if (error) {
        return onLive(error, null);
      }
      Promise.all(addresses.map(function (address, i) {
        return db.put('balance-' + account + '-' + address, results.balances[i]);
      })).then(function () {
        return onLive(null, results.balances.map(function (b) {
          return parseInt(b);
        }));
      });
    };

    db.getMany(addresses.map(function (address) {
      return 'balance-' + account + '-' + address;
    })).then(function (result) {
      var balances = result.map(function (r) {
        return parseInt(r || 0);
      });
      onCache(null, balances);
      if (cachedOnly) {
        onLive(null, balances);
      } else {
        iota.api.getBalances(addresses, threshold, callback);
      }
    }).catch(function (error) {
      onCache(error, null);
      !cachedOnly && iota.api.getBalances(addresses, threshold, callback);
    });
  }

  function getSpent(addresses, onCache, onLive) {
    var cachedOnly = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    var callback = function callback(error, results) {
      if (error) {
        return onLive(error, null);
      }
      Promise.all(addresses.map(function (address, i) {
        return db.put('spent-' + account + '-' + address, results[i]);
      })).then(function () {
        return onLive(null, results);
      });
    };

    db.getMany(addresses.map(function (address) {
      return 'spent-' + account + '-' + address;
    })).then(function (result) {
      onCache(null, result);
      if (cachedOnly) {
        onLive(null, result);
      } else {
        iota.api.wereAddressesSpentFrom(addresses, callback);
      }
    }).catch(function (error) {
      onCache(error, null);
      iota.api.wereAddressesSpentFrom(addresses, callback);
    });
  }

  function setAddresses(seed, addresses) {
    return db.put('addresses-' + account + '-' + seed, addresses);
  }

  function getAddresses(seed, onCache, onLive) {
    var cachedOnly = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var total = arguments[4];

    var cached = [];
    var callback = function callback(error, results) {
      if (error) {
        return onLive(error, null);
      }
      var addresses = cached.concat(results.slice(0, -1));
      db.put('addresses-' + account + '-' + seed, addresses).then(function () {
        return onLive(null, addresses);
      });
    };

    db.get('addresses-' + account + '-' + seed).then(function (result) {
      onCache(null, result ? result : []);
      if (cachedOnly) {
        onLive(null, result ? result : []);
      } else {
        cached = result ? result : [];
        _getNewAddress(iota.api, guard, seed, cached.length, total, callback, true);
      }
    }).catch(function (error) {
      onCache(error, null);
      _getNewAddress(iota.api, guard, seed, 0, total, callback, true);
    });
  }

  function getTransactions(address, onCache, onLive) {
    var cachedOnly = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    var callback = function callback(error, hashes, inclusions) {
      if (error) {
        return onLive(error, null);
      }
      db.put('transactions-' + account + '-' + address, hashes).then(function () {
        return db.put('inclusions-' + account + '-' + address, inclusions);
      }).then(function () {
        return onLive(null, { hashes: hashes, inclusions: inclusions });
      });
    };

    var findTransactions = function findTransactions() {
      var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      if (cachedOnly && !force) {
        return;
      }
      iota.api.findTransactions({ addresses: [address] }, function (error, hashes) {
        if (error) {
          return callback(error, null, null);
        }
        iota.api.getLatestInclusion(hashes, function (error, inclusions) {
          callback(error, hashes, inclusions);
        });
      });
    };

    var dbError = function dbError(error) {
      onCache(error, null, null);
      findTransactions();
    };

    db.get('transactions-' + account + '-' + address).then(function (hashes) {
      hashes = hashes ? hashes : [];
      return db.get('inclusions-' + account + '-' + address).then(function (inclusions) {
        var result = {
          hashes: hashes,
          inclusions: inclusions || hashes.map(function () {
            return false;
          })
        };
        onCache(null, result);
        if (cachedOnly && inclusions && inclusions.length) {
          onLive(null, result);
        } else {
          findTransactions(true);
        }
      }).catch(dbError);
    }).catch(dbError);
  }

  // TODO: find a way to get Transactions for multiple addresses at once.
  function getTransactionObjects(address, onCache, onLive) {
    var cachedOnly = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

    var liveDone = false;

    var process = function process(live) {
      return function (error, result) {
        var cb = live ? onLive : onCache;

        if (error) {
          return cb(error, null);
        }
        if (!live && liveDone) {
          return;
        }

        var hashes = result.hashes,
            inclusions = result.inclusions;


        iota.api.getTrytes(hashes, function (error, trytes) {
          if (error) {
            return cb(error, null);
          }

          if (!live && liveDone) {
            return;
          }

          if (live) {
            liveDone = true;
          }

          cb(null, trytes.map(function (tryte, i) {
            return Object.assign({}, iota.utils.transactionObject(tryte), {
              persistence: inclusions[i]
            });
          }));
        });
      };
    };

    getTransactions(address, process(), process(true), cachedOnly);
  }

  function getNewAddress(pageIndex, index, total, callback) {
    if (!guard) throw new Error('guard has not been set up!');
    _getNewAddress(iota.api, guard, pageIndex, index, total, callback, false);
  }

  function sendTransfer(pageIndex, depth, minWeightMagnitude, transfers, options, callback) {
    if (!guard) throw new Error('guard has not been set up!');
    _sendTransfer(iota.api, guard, pageIndex, depth, minWeightMagnitude, transfers, options, callback);
  }

  iota.api.ext = {
    sendTransfer: sendTransfer,
    getNewAddress: getNewAddress,
    getBalances: getBalances,
    setAddresses: setAddresses,
    getAddresses: getAddresses,
    getTransactions: getTransactions,
    getTransactionObjects: getTransactionObjects,
    getSpent: getSpent,
    provider: IOTA_API_ENDPOINT
  };

  return iota;
}

function _getNewAddress(api, guard, seedOrPageIndex, index, total, callback) {
  var _this = this;

  var returnAll = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : true;

  if (!guard) {
    api.getNewAddress(seedOrPageIndex, { returnAll: returnAll, total: total }, callback);
  } else {
    var getter = seedOrPageIndex < 0 ? function (i, t) {
      return guard.getPages(i, t);
    } : function (i, t) {
      return guard.getAddresses(seedOrPageIndex, i, t);
    };
    _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var allAddresses;
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              allAddresses = [];

              // Case 1: total
              //
              // If total number of addresses to generate is supplied, simply generate
              // and return the list of all addresses

              if (!total) {
                _context.next = 15;
                break;
              }

              _context.prev = 2;
              _context.t0 = callback;
              _context.next = 6;
              return getter(index, total);

            case 6:
              _context.t1 = _context.sent;
              return _context.abrupt('return', (0, _context.t0)(null, _context.t1));

            case 10:
              _context.prev = 10;
              _context.t2 = _context['catch'](2);
              return _context.abrupt('return', callback(_context.t2));

            case 13:
              _context.next = 16;
              break;

            case 15:
              //  Case 2: no total provided
              //
              //  Continue calling wasAddressSpenFrom & findTransactions to see if address was already created
              //  if null, return list of addresses
              //
              async.doWhilst(function (callback) {
                // Iteratee function
                getter(index, 1).then(function (addresses) {
                  var newAddress = addresses[0];

                  if (returnAll) {
                    allAddresses.push(newAddress);
                  }

                  // Increase the index
                  index += 1;

                  api.wereAddressesSpentFrom(newAddress, function (err, res) {
                    if (err) {
                      return callback(err);
                    }

                    // Validity check
                    if (res[0]) {
                      callback(null, newAddress, true, index - 1);
                    } else {
                      // Check for txs if address isn't spent
                      api.findTransactions({ addresses: [newAddress] }, function (err, transactions) {
                        if (err) {
                          return callback(err);
                        }
                        callback(err, newAddress, transactions.length > 0, index - 1);
                      });
                    }
                  });
                }).catch(function (err) {
                  return callback(err);
                });
              }, function (address, isUsed) {
                return isUsed;
              }, function (err, address, isUsed, index) {
                if (err) {
                  return callback(err);
                } else {
                  return callback(null, returnAll ? allAddresses : address, index);
                }
              });

            case 16:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this, [[2, 10]]);
    }))();
  }
}

function _sendTransfer(api, guard, seedOrPageIndex, depth, minWeightMagnitude, transfers, options, callback) {
  var _this2 = this;

  if (!guard) {
    return api.sendTransfer(seedOrPageIndex, depth, minWeightMagnitude, transfers, options, callback);
  }

  _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var index, inputs, totalValue, remainder, trytes;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            index = options.addressIndex;
            _context2.prev = 1;
            inputs = options.inputs;
            totalValue = transfers.reduce(function (t, i) {
              return t + i.value;
            }, 0);

            if (!(totalValue > 0 && !options.inputs)) {
              _context2.next = 6;
              break;
            }

            return _context2.abrupt('return', callback(new Error('No inputs for guard send provided!')));

          case 6:
            if (!(totalValue > 0)) {
              _context2.next = 15;
              break;
            }

            _context2.t1 = options.address;

            if (_context2.t1) {
              _context2.next = 12;
              break;
            }

            _context2.next = 11;
            return function () {
              return new Promise(function (resolve) {
                _getNewAddress(api, guard, seedOrPageIndex, index, null, function (error, address, addressIndex) {
                  if (error) throw error;
                  index = addressIndex;
                  resolve(address);
                }, false);
              });
            }();

          case 11:
            _context2.t1 = _context2.sent;

          case 12:
            _context2.t0 = _context2.t1;
            _context2.next = 16;
            break;

          case 15:
            _context2.t0 = null;

          case 16:
            remainder = _context2.t0;
            _context2.next = 19;
            return guard.getSignedTransactions(seedOrPageIndex, transfers, inputs, { address: remainder, keyIndex: index });

          case 19:
            trytes = _context2.sent;


            api.sendTrytes(trytes, depth, minWeightMagnitude, options, callback);
            _context2.next = 26;
            break;

          case 23:
            _context2.prev = 23;
            _context2.t2 = _context2['catch'](1);

            callback(_context2.t2);

          case 26:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this2, [[1, 23]]);
  }))();
}

module.exports = createAPI;