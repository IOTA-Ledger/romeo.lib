'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Queue = require('better-queue');
var MemoryStore = require('better-queue-memory');

var _require = require('../utils'),
    createIdentifier = _require.createIdentifier;

var createAPI = require('../iota');

var DEFAULT_OPTIONS = {
  concurrent: 1
};

var BaseGuard = function () {
  function BaseGuard(options) {
    var _this = this;

    _classCallCheck(this, BaseGuard);

    this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
    // The guard queue will manage all the requests.
    // This allows setting a 1-lane concurrency, for example.
    this.queue = new Queue(function (input, cb) {
      input.promise().then(function (result) {
        return cb(null, result);
      }).catch(function (error) {
        return cb(error, null);
      });
    }, {
      store: new MemoryStore({}),
      id: 'id',
      priority: function priority(job, cb) {
        return cb(null, job.priority || 1);
      },
      concurrent: this.opts.concurrent
    });
    this.queue.addJob = function (promise, priority, opts) {
      var id = createIdentifier();
      var job = _this.queue.push({ id: id, promise: promise, priority: priority });
      job.opts = opts;
      job.id = id;
      job.priority = priority;
      return job;
    };
    this.activePageIndex = null;
    this.iota = null;
  }

  /**
   * Sets up the iota interface.
   * This might be useful if the guard wants to configure how
   * the IOTA API interface behaves, for example.
   * @param {Object} options
   * @returns {*}
   */


  _createClass(BaseGuard, [{
    key: 'setupIOTA',
    value: function setupIOTA(options) {
      this.iota = createAPI(Object.assign({}, options, {
        password: this.getSymmetricKey(),
        guard: this
      }));
      return this.iota;
    }

    /**
     * For guards that allow returning seeds.
     * Otherwise, do not override.
     * @param pageIndex
     * @returns {string|null}
     */

  }, {
    key: 'getPageSeed',
    value: function getPageSeed(pageIndex) {
      return null;
    }

    /**
     * Return max number of outputs, apart of inputs, that the guard supports for transfers.
     * 0 = unlimited
     * @returns {number}
     */

  }, {
    key: 'getMaxOutputs',
    value: function getMaxOutputs() {
      return 6;
    }

    /**
     * Return max number of outputs, apart of inputs, that the guard supports for transfers.
     * 0 = unlimited
     * @returns {number}
     */

  }, {
    key: 'getMaxInputs',
    value: function getMaxInputs() {
      return 6;
    }

    /**
     * For guards that return a 3-char checksum.
     * Otherwise, do not override.
     * @param pageIndex
     * @returns {string|null}
     */

  }, {
    key: 'getChecksum',
    value: function getChecksum() {
      return null;
    }

    /**
     * Returns symmetric key for encoding/decoding arbitrary data.
     * Should be overridden!
     * @returns {String}
     */

  }, {
    key: 'getSymmetricKey',
    value: function getSymmetricKey() {
      throw new Error('not implemented!');
    }

    /**
     * Resolves to array of addresses representing pages
     * @param {int} index
     * @param {int} total
     * @param {int} priority
     * @returns {Promise<String[]>}
     */

  }, {
    key: 'getPages',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(index, total) {
        var _this2 = this;

        var priority = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
        var promiseFactory;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                promiseFactory = function promiseFactory() {
                  return new Promise(function () {
                    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(resolve, reject) {
                      return regeneratorRuntime.wrap(function _callee$(_context) {
                        while (1) {
                          switch (_context.prev = _context.next) {
                            case 0:
                              _context.prev = 0;
                              _context.t0 = resolve;
                              _context.next = 4;
                              return _this2._getPages(index, total);

                            case 4:
                              _context.t1 = _context.sent;
                              (0, _context.t0)(_context.t1);
                              _context.next = 11;
                              break;

                            case 8:
                              _context.prev = 8;
                              _context.t2 = _context['catch'](0);

                              reject(_context.t2);

                            case 11:
                            case 'end':
                              return _context.stop();
                          }
                        }
                      }, _callee, _this2, [[0, 8]]);
                    }));

                    return function (_x4, _x5) {
                      return _ref2.apply(this, arguments);
                    };
                  }());
                };

                return _context2.abrupt('return', new Promise(function (resolve, reject) {
                  var job = _this2.queue.addJob(promiseFactory, priority, {
                    type: 'GET_PAGES'
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

      function getPages(_x2, _x3) {
        return _ref.apply(this, arguments);
      }

      return getPages;
    }()

    /**
     * Resolves to array of addresses of a specific pages
     * @param {int} pageIndex
     * @param {int} index
     * @param {int} total
     * @param {int} priority
     * @returns {Promise<String[]>}
     */

  }, {
    key: 'getAddresses',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(pageIndex, index, total) {
        var _this3 = this;

        var priority = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
        var promiseFactory;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                promiseFactory = function promiseFactory() {
                  return new Promise(function () {
                    var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(resolve, reject) {
                      return regeneratorRuntime.wrap(function _callee3$(_context3) {
                        while (1) {
                          switch (_context3.prev = _context3.next) {
                            case 0:
                              _context3.prev = 0;
                              _context3.next = 3;
                              return _this3._setActivePage(pageIndex);

                            case 3:
                              _context3.t0 = resolve;
                              _context3.next = 6;
                              return _this3._getAddresses(index, total);

                            case 6:
                              _context3.t1 = _context3.sent;
                              (0, _context3.t0)(_context3.t1);
                              _context3.next = 13;
                              break;

                            case 10:
                              _context3.prev = 10;
                              _context3.t2 = _context3['catch'](0);

                              reject(_context3.t2);

                            case 13:
                            case 'end':
                              return _context3.stop();
                          }
                        }
                      }, _callee3, _this3, [[0, 10]]);
                    }));

                    return function (_x10, _x11) {
                      return _ref4.apply(this, arguments);
                    };
                  }());
                };

                return _context4.abrupt('return', new Promise(function (resolve, reject) {
                  var job = _this3.queue.addJob(promiseFactory, priority, {
                    page: pageIndex,
                    type: 'GET_ADDRESSES'
                  });
                  job.on('finish', resolve);
                  job.on('failed', reject);
                }));

              case 2:
              case 'end':
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function getAddresses(_x7, _x8, _x9) {
        return _ref3.apply(this, arguments);
      }

      return getAddresses;
    }()

    /**
     * Returns a list of signed trytes.
     * @param {int} pageIndex
     * @param {Object[]} transfers
     * @param {Object[]} inputs
     * @param {Object} remainder
     * @param {int} priority
     * @returns {Promise<string[]>}
     */

  }, {
    key: 'getSignedTransactions',
    value: function () {
      var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(pageIndex, transfers, inputs, remainder) {
        var _this4 = this;

        var priority = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
        var promiseFactory;
        return regeneratorRuntime.wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                promiseFactory = function promiseFactory() {
                  return new Promise(function () {
                    var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(resolve, reject) {
                      return regeneratorRuntime.wrap(function _callee5$(_context5) {
                        while (1) {
                          switch (_context5.prev = _context5.next) {
                            case 0:
                              _context5.prev = 0;
                              _context5.next = 3;
                              return _this4._setActivePage(pageIndex);

                            case 3:
                              _context5.t0 = resolve;
                              _context5.next = 6;
                              return _this4._getSignedTransactions(transfers, inputs, remainder);

                            case 6:
                              _context5.t1 = _context5.sent;
                              (0, _context5.t0)(_context5.t1);
                              _context5.next = 13;
                              break;

                            case 10:
                              _context5.prev = 10;
                              _context5.t2 = _context5['catch'](0);

                              reject(_context5.t2);

                            case 13:
                            case 'end':
                              return _context5.stop();
                          }
                        }
                      }, _callee5, _this4, [[0, 10]]);
                    }));

                    return function (_x17, _x18) {
                      return _ref6.apply(this, arguments);
                    };
                  }());
                };

                return _context6.abrupt('return', new Promise(function (resolve, reject) {
                  var job = _this4.queue.addJob(promiseFactory, priority, {
                    page: pageIndex,
                    type: 'GET_SIGNED_TRANSACTIONS'
                  });
                  job.on('finish', resolve);
                  job.on('failed', reject);
                }));

              case 2:
              case 'end':
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function getSignedTransactions(_x13, _x14, _x15, _x16) {
        return _ref5.apply(this, arguments);
      }

      return getSignedTransactions;
    }()

    ///////// Private methods should not be called directly! /////////

    /**
     * Sets active page to be used.
     * @param {int} pageIndex
     * @private
     */

  }, {
    key: '_setActivePage',
    value: function () {
      var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(pageIndex) {
        return regeneratorRuntime.wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                this.activePageIndex = pageIndex;

              case 1:
              case 'end':
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function _setActivePage(_x19) {
        return _ref7.apply(this, arguments);
      }

      return _setActivePage;
    }()

    /**
     * Actual method to get page-addresses.
     * Should be overridden!
     * @param {int} index
     * @param {int} total
     * @returns {Promise<string[]>}
     * @private
     */

  }, {
    key: '_getPages',
    value: function () {
      var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(index, total) {
        return regeneratorRuntime.wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                throw new Error('not implemented!');

              case 1:
              case 'end':
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function _getPages(_x20, _x21) {
        return _ref8.apply(this, arguments);
      }

      return _getPages;
    }()

    /**
     * Actual method to get page-addresses.
     * Should be overridden!
     * @param {int} index
     * @param {int} total
     * @returns {Promise<string[]>}
     * @private
     */

  }, {
    key: '_getAddresses',
    value: function () {
      var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(index, total) {
        return regeneratorRuntime.wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                throw new Error('not implemented!');

              case 1:
              case 'end':
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function _getAddresses(_x22, _x23) {
        return _ref9.apply(this, arguments);
      }

      return _getAddresses;
    }()

    /**
     * Actual method to get page-addresses.
     * Should be overridden!
     * @param {Object[]} transfers
     * @param {Object[]} inputs
     * @param {Object} remainder: { address, keyIndex }
     * @returns {Promise<string[]>}
     * @private
     */

  }, {
    key: '_getSignedTransactions',
    value: function () {
      var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(transfers, inputs, remainder) {
        return regeneratorRuntime.wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                throw new Error('not implemented!');

              case 1:
              case 'end':
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function _getSignedTransactions(_x24, _x25, _x26) {
        return _ref10.apply(this, arguments);
      }

      return _getSignedTransactions;
    }()
  }]);

  return BaseGuard;
}();

module.exports = {
  DEFAULT_OPTIONS: DEFAULT_OPTIONS,
  BaseGuard: BaseGuard
};