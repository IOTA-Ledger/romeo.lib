'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _hwTransportU2f = require('@ledgerhq/hw-transport-u2f');

var _hwTransportU2f2 = _interopRequireDefault(_hwTransportU2f);

var _hwAppIota = require('hw-app-iota');

var _hwAppIota2 = _interopRequireDefault(_hwAppIota);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('./base'),
    BaseGuard = _require.BaseGuard;

var _require2 = require('../config'),
    LEDGER_APP_MIN_VERSION = _require2.LEDGER_APP_MIN_VERSION;

var util = require('util');

// use testnet path for now
var BIP44_PATH = "44'/1'/0'";
var DUMMY_SEED = '9'.repeat(81);

var DEFAULT_OPTIONS = {
  concurrent: 1,
  security: 2,
  debug: false
};

var LedgerGuard = function (_BaseGuard) {
  _inherits(LedgerGuard, _BaseGuard);

  function LedgerGuard(hwapp, key, options) {
    _classCallCheck(this, LedgerGuard);

    var _this = _possibleConstructorReturn(this, (LedgerGuard.__proto__ || Object.getPrototypeOf(LedgerGuard)).call(this, options));

    _this.opts = options;

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

    ///////// Private methods should not be called directly! /////////

  }, {
    key: '_setActivePage',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(pageIndex) {
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this._setPageSeed(pageIndex);

              case 2:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function _setActivePage(_x) {
        return _ref.apply(this, arguments);
      }

      return _setActivePage;
    }()
  }, {
    key: '_getPages',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(index, total) {
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.next = 2;
                return this._setPageSeed(-1);

              case 2:
                _context2.next = 4;
                return this._getGenericAddresses(index, total);

              case 4:
                return _context2.abrupt('return', _context2.sent);

              case 5:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function _getPages(_x2, _x3) {
        return _ref2.apply(this, arguments);
      }

      return _getPages;
    }()
  }, {
    key: '_getAddresses',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(index, total) {
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this._getGenericAddresses(index, total);

              case 2:
                return _context3.abrupt('return', _context3.sent);

              case 3:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function _getAddresses(_x4, _x5) {
        return _ref3.apply(this, arguments);
      }

      return _getAddresses;
    }()
  }, {
    key: '_getSignedTransactions',
    value: function () {
      var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(transfers, inputs, remainder) {
        var _this2 = this;

        var options;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                // filter unnecessary inputs
                inputs = inputs || [];
                inputs = inputs.filter(function (input) {
                  return input.balance > 0;
                });

                if (this.opts.debug) {
                  console.log('getSignedTransactions;', transfers, inputs, remainder);
                }

                // the ledger is only needed, if there are proper inputs

                if (!(Array.isArray(inputs) && inputs.length)) {
                  _context4.next = 7;
                  break;
                }

                _context4.next = 6;
                return this.hwapp.signTransaction(transfers, inputs, remainder);

              case 6:
                return _context4.abrupt('return', _context4.sent);

              case 7:

                // no inputs use the regular iota lib with a dummy seed
                options = {
                  inputs: inputs,
                  address: remainder
                };
                _context4.next = 10;
                return function () {
                  return new Promise(function (resolve, reject) {
                    _this2.iota.api.prepareTransfers(DUMMY_SEED, transfers, options, function (err, result) {
                      if (err) return reject(err);
                      resolve(result);
                    });
                  });
                }();

              case 10:
                return _context4.abrupt('return', _context4.sent);

              case 11:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function _getSignedTransactions(_x6, _x7, _x8) {
        return _ref4.apply(this, arguments);
      }

      return _getSignedTransactions;
    }()
  }, {
    key: '_getGenericAddresses',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(index, total) {
        var addresses, i, keyIndex, address;
        return regeneratorRuntime.wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                addresses = [];
                i = 0;

              case 2:
                if (!(i < total)) {
                  _context5.next = 12;
                  break;
                }

                keyIndex = index + i;
                _context5.next = 6;
                return this.hwapp.getAddress(keyIndex);

              case 6:
                address = _context5.sent;

                if (this.opts.debug) {
                  console.log('getGenericAddress; index=%i, key=%s', keyIndex, address);
                }
                addresses.push(address);

              case 9:
                i++;
                _context5.next = 2;
                break;

              case 12:
                return _context5.abrupt('return', addresses);

              case 13:
              case 'end':
                return _context5.stop();
            }
          }
        }, _callee5, this);
      }));

      function _getGenericAddresses(_x9, _x10) {
        return _ref5.apply(this, arguments);
      }

      return _getGenericAddresses;
    }()
  }, {
    key: '_setPageSeed',
    value: function () {
      var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(pageIndex) {
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                if (!(this.activePageIndex != pageIndex)) {
                  _context6.next = 11;
                  break;
                }

                if (!(pageIndex < 0)) {
                  _context6.next = 7;
                  break;
                }

                if (this.opts.debug) {
                  console.log('setInternalSeed; index=%i', 1);
                }
                _context6.next = 5;
                return LedgerGuard._setInternalSeed(this.hwapp, 1);

              case 5:
                _context6.next = 10;
                break;

              case 7:
                if (this.opts.debug) {
                  console.log('setExternalSeed; index=%i', pageIndex);
                }
                _context6.next = 10;
                return this.hwapp.setActiveSeed(LedgerGuard._getBipPath(0, pageIndex), this.opts.security);

              case 10:

                this.activePageIndex = pageIndex;

              case 11:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function _setPageSeed(_x11) {
        return _ref6.apply(this, arguments);
      }

      return _setPageSeed;
    }()
  }], [{
    key: 'build',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(options) {
        var opts, transport, hwapp, keyAddress;
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                opts = Object.assign({}, DEFAULT_OPTIONS, options);
                _context7.next = 3;
                return _hwTransportU2f2.default.create();

              case 3:
                transport = _context7.sent;

                if (opts.debug) {
                  transport.setDebugMode(true);
                }
                // wait 3s for result
                transport.setExchangeTimeout(3000);
                hwapp = new _hwAppIota2.default(transport);
                _context7.next = 9;
                return LedgerGuard._checkVersion(hwapp);

              case 9:
                _context7.next = 11;
                return LedgerGuard._setInternalSeed(hwapp, 2);

              case 11:
                _context7.next = 13;
                return hwapp.getAddress(0);

              case 13:
                keyAddress = _context7.sent;
                return _context7.abrupt('return', new LedgerGuard(hwapp, keyAddress.substr(0, 32), opts));

              case 15:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function build(_x12) {
        return _ref7.apply(this, arguments);
      }

      return build;
    }()
  }, {
    key: '_checkVersion',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(hwapp) {
        var appConfig, appVersion;
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return LedgerGuard._getAppConfig(hwapp);

              case 2:
                appConfig = _context8.sent;
                appVersion = appConfig.app_version_major << 16 | appConfig.app_version_minor << 8 | appConfig.app_version_patch;

                if (!(appVersion < LEDGER_APP_MIN_VERSION)) {
                  _context8.next = 6;
                  break;
                }

                throw new Error(util.format('Your IOTA-Ledger app version is outdated (v%s.%s.%s)! You must update to version v%s.%s.%s before you can login!', appConfig.app_version_major, appConfig.app_version_minor, appConfig.app_version_patch, LEDGER_APP_MIN_VERSION >> 16 & 0xff, LEDGER_APP_MIN_VERSION >> 8 & 0xff, LEDGER_APP_MIN_VERSION & 0xff));

              case 6:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function _checkVersion(_x13) {
        return _ref8.apply(this, arguments);
      }

      return _checkVersion;
    }()
  }, {
    key: '_setInternalSeed',
    value: function () {
      var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(hwapp, index) {
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return hwapp.setActiveSeed(LedgerGuard._getBipPath(1, index), 1);

              case 2:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function _setInternalSeed(_x14, _x15) {
        return _ref9.apply(this, arguments);
      }

      return _setInternalSeed;
    }()
  }, {
    key: '_getBipPath',
    value: function _getBipPath(change, index) {
      return BIP44_PATH + '/' + change + '/' + index;
    }
  }, {
    key: '_getAppConfig',
    value: function () {
      var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(hwapp) {
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _context10.next = 2;
                return hwapp.getAppConfig();

              case 2:
                return _context10.abrupt('return', _context10.sent);

              case 3:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function _getAppConfig(_x16) {
        return _ref10.apply(this, arguments);
      }

      return _getAppConfig;
    }()
  }]);

  return LedgerGuard;
}(BaseGuard);

module.exports = LedgerGuard;