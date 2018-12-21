'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./base'),
    BaseGuard = _require.BaseGuard;

var Transport = require('@ledgerhq/hw-transport-u2f').default;
var AppIota = require('hw-app-iota').default;
var semver = require('semver');

// allowed version range for the Ledger Nano app
var APP_VERSION_RANGE = '^0.4.0';

// BIP32 path to derive the page seed on the Ledger Nano
var PAGE_BIP32_PATH = function PAGE_BIP32_PATH(account, pageIndex) {
  return '44\'/4218\'/' + account + '\'/' + pageIndex + '\'';
};

// the iota lib needs a seed even for transactions without inputs
var DUMMY_SEED = '9'.repeat(81);

// derivation rules for the different type of addresses
var ADDRESS_DERIVATION = function ADDRESS_DERIVATION(account, pageIndex, keyIndex) {
  return {
    path: PAGE_BIP32_PATH(account, pageIndex),
    keyIndex: keyIndex
  };
};
var PAGE_ADDRESS_DERIVATION = function PAGE_ADDRESS_DERIVATION(account, pageIndex) {
  return {
    path: PAGE_BIP32_PATH(account, pageIndex),
    keyIndex: 0
  };
};
var KEY_ADDRESS_DERIVATION = function KEY_ADDRESS_DERIVATION(account) {
  return {
    path: PAGE_BIP32_PATH(account, 0),
    keyIndex: 0xffffffff
  };
};

var DEFAULT_OPTIONS = {
  concurrent: 1,
  account: 0,
  security: 2,
  debug: false
};

var LedgerGuard = function (_BaseGuard) {
  _inherits(LedgerGuard, _BaseGuard);

  function LedgerGuard(hwapp, key, options) {
    _classCallCheck(this, LedgerGuard);

    var _this = _possibleConstructorReturn(this, (LedgerGuard.__proto__ || Object.getPrototypeOf(LedgerGuard)).call(this, Object.assign({}, options, {
      name: 'ledger',
      sequentialTransfers: true
    })));

    _this.hwapp = hwapp;
    _this.key = key;
    return _this;
  }

  _createClass(LedgerGuard, [{
    key: 'getMaxOutputs',
    value: function getMaxOutputs() {
      return 1;
    }
  }, {
    key: 'getMaxInputs',
    value: function getMaxInputs() {
      return 2;
    }
  }, {
    key: 'getSymmetricKey',
    value: function getSymmetricKey() {
      return this.key;
    }
  }, {
    key: 'displayAddress',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(pageIndex, index, priority) {
        var _this2 = this;

        var promiseFactory;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                promiseFactory = function promiseFactory() {
                  return new Promise(function () {
                    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(resolve, reject) {
                      var account, _ref3, path, keyIndex;

                      return regeneratorRuntime.wrap(function _callee$(_context) {
                        while (1) {
                          switch (_context.prev = _context.next) {
                            case 0:
                              _context.prev = 0;
                              _context.next = 3;
                              return _this2._setActivePage(pageIndex);

                            case 3:
                              account = _this2.opts.account;
                              // get the corresponding address derivation

                              _ref3 = _this2.activePageIndex < 0 ? PAGE_ADDRESS_DERIVATION(account, index) : ADDRESS_DERIVATION(account, _this2.activePageIndex, index), path = _ref3.path, keyIndex = _ref3.keyIndex;
                              _context.next = 7;
                              return _this2._setActiveSeed(path);

                            case 7:
                              _context.t0 = resolve;
                              _context.next = 10;
                              return _this2.hwapp.getAddress(keyIndex, { display: true });

                            case 10:
                              _context.t1 = _context.sent;
                              (0, _context.t0)(_context.t1);
                              _context.next = 17;
                              break;

                            case 14:
                              _context.prev = 14;
                              _context.t2 = _context['catch'](0);

                              reject(_context.t2);

                            case 17:
                            case 'end':
                              return _context.stop();
                          }
                        }
                      }, _callee, _this2, [[0, 14]]);
                    }));

                    return function (_x4, _x5) {
                      return _ref2.apply(this, arguments);
                    };
                  }());
                };

                return _context2.abrupt('return', new Promise(function (resolve, reject) {
                  var job = _this2.queue.addJob(promiseFactory, priority, {
                    page: pageIndex,
                    type: 'DISPLAY_ADDRESS'
                  });
                  job.on('finish', resolve);
                  job.on('failed', reject);
                }));

              case 2:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function displayAddress(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return displayAddress;
    }()

    ///////// Private methods should not be called directly! /////////

  }, {
    key: '_getPages',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(pageIndex, total) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                this._setActivePage(-1);
                _context3.next = 3;
                return this._getAddresses(pageIndex, total);

              case 3:
                return _context3.abrupt('return', _context3.sent);

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _getPages(_x6, _x7) {
        return _ref4.apply(this, arguments);
      }

      return _getPages;
    }()
  }, {
    key: '_getAddresses',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(index, total) {
        var addresses, i;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                addresses = [];
                i = 0;

              case 2:
                if (!(i < total)) {
                  _context4.next = 11;
                  break;
                }

                _context4.t0 = addresses;
                _context4.next = 6;
                return this._getGenericAddress(index + i);

              case 6:
                _context4.t1 = _context4.sent;

                _context4.t0.push.call(_context4.t0, _context4.t1);

              case 8:
                i++;
                _context4.next = 2;
                break;

              case 11:
                return _context4.abrupt('return', addresses);

              case 12:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function _getAddresses(_x8, _x9) {
        return _ref5.apply(this, arguments);
      }

      return _getAddresses;
    }()
  }, {
    key: '_getSignedTransactions',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(transfers, inputs, remainder) {
        var _this3 = this;

        var options;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                // filter unnecessary inputs
                inputs = inputs || [];
                inputs = inputs.filter(function (input) {
                  return input.balance > 0;
                });
                // hw-app-iota requires a tag to be present
                transfers.forEach(function (t) {
                  return t.tag = t.tag ? t.tag : '';
                });

                if (this.opts.debug) {
                  console.log('getSignedTransactions;', transfers, inputs, remainder);
                }

                // the ledger is only needed, if there are proper inputs

                if (!(Array.isArray(inputs) && inputs.length)) {
                  _context5.next = 8;
                  break;
                }

                _context5.next = 7;
                return this.hwapp.signTransaction(transfers, inputs, remainder);

              case 7:
                return _context5.abrupt('return', _context5.sent);

              case 8:

                // no inputs use the regular iota lib with a dummy seed
                options = {
                  inputs: inputs,
                  address: remainder
                };
                _context5.next = 11;
                return function () {
                  return new Promise(function (resolve, reject) {
                    _this3.iota.api.prepareTransfers(DUMMY_SEED, transfers, options, function (err, result) {
                      if (err) return reject(err);
                      resolve(result);
                    });
                  });
                }();

              case 11:
                return _context5.abrupt('return', _context5.sent);

              case 12:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function _getSignedTransactions(_x10, _x11, _x12) {
        return _ref6.apply(this, arguments);
      }

      return _getSignedTransactions;
    }()
  }, {
    key: '_setActiveSeed',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(path) {
        var _opts, debug, security;

        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _opts = this.opts, debug = _opts.debug, security = _opts.security;
                // only pass the command, if the path has indeed changed

                if (!(this.activePath !== path)) {
                  _context6.next = 6;
                  break;
                }

                if (debug) {
                  console.log('setActiveSeed; path=%s, security=%i', path, security);
                }
                _context6.next = 5;
                return this.hwapp.setActiveSeed(path, security);

              case 5:
                this.activePath = path;

              case 6:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function _setActiveSeed(_x13) {
        return _ref7.apply(this, arguments);
      }

      return _setActiveSeed;
    }()
  }, {
    key: '_getGenericAddress',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(index) {
        var _opts2, debug, account, _ref9, path, keyIndex, address;

        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _opts2 = this.opts, debug = _opts2.debug, account = _opts2.account;
                // get the corresponding address derivation

                _ref9 = this.activePageIndex < 0 ? PAGE_ADDRESS_DERIVATION(account, index) : ADDRESS_DERIVATION(account, this.activePageIndex, index), path = _ref9.path, keyIndex = _ref9.keyIndex;
                _context7.next = 4;
                return this._setActiveSeed(path);

              case 4:
                _context7.next = 6;
                return this.hwapp.getAddress(keyIndex);

              case 6:
                address = _context7.sent;

                if (debug) {
                  console.log('getAddress; index=%i, key=%s', keyIndex, address);
                }
                return _context7.abrupt('return', address);

              case 9:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function _getGenericAddress(_x14) {
        return _ref8.apply(this, arguments);
      }

      return _getGenericAddress;
    }()
  }], [{
    key: 'build',
    value: function () {
      var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(options) {
        var opts, transport, hwapp, _KEY_ADDRESS_DERIVATI, path, keyIndex, keyAddress;

        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                opts = Object.assign({}, DEFAULT_OPTIONS, options);
                _context8.next = 3;
                return Transport.create();

              case 3:
                transport = _context8.sent;

                if (opts.debug) {
                  transport.setDebugMode(true);
                }

                hwapp = new AppIota(transport);
                _context8.next = 8;
                return LedgerGuard._checkVersion(hwapp);

              case 8:
                _KEY_ADDRESS_DERIVATI = KEY_ADDRESS_DERIVATION(opts.account), path = _KEY_ADDRESS_DERIVATI.path, keyIndex = _KEY_ADDRESS_DERIVATI.keyIndex;
                _context8.next = 11;
                return hwapp.setActiveSeed(path, 1);

              case 11:
                _context8.next = 13;
                return hwapp.getAddress(keyIndex);

              case 13:
                keyAddress = _context8.sent;
                return _context8.abrupt('return', new LedgerGuard(hwapp, keyAddress.substr(0, 32), opts));

              case 15:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function build(_x15) {
        return _ref10.apply(this, arguments);
      }

      return build;
    }()
  }, {
    key: '_checkVersion',
    value: function () {
      var _ref11 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(hwapp) {
        var appVersion, message;
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.t0 = semver;
                _context9.next = 3;
                return hwapp.getAppVersion();

              case 3:
                _context9.t1 = _context9.sent;
                appVersion = _context9.t0.clean.call(_context9.t0, _context9.t1);

                if (semver.satisfies(appVersion, APP_VERSION_RANGE)) {
                  _context9.next = 8;
                  break;
                }

                message = 'Your IOTA-Ledger app version ' + appVersion + ' is outdated! You must update to a version satisfying "' + APP_VERSION_RANGE + '"  before you can login!';
                throw new Error(message);

              case 8:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function _checkVersion(_x16) {
        return _ref11.apply(this, arguments);
      }

      return _checkVersion;
    }()
  }]);

  return LedgerGuard;
}(BaseGuard);

module.exports = LedgerGuard;