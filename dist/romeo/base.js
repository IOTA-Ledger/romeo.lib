'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_OPTIONS = {
  silent: false,
  logIdent: 'BASE',
  logIdentWidth: 12,
  onLog: function onLog() {},
  onChange: function onChange(obj) {}
};

/**
 * Base class with generic functionality.
 * @class Base
 */

var Base = function () {
  function Base(options) {
    _classCallCheck(this, Base);

    this.opts = _extends({}, DEFAULT_OPTIONS, options);
    this.onChange = this.onChange.bind(this);
  }

  _createClass(Base, [{
    key: 'log',
    value: function log() {
      if (!this.opts || !this.opts.silent || arguments[0] === '!!') {
        var _console;

        var date = new Date();
        var timeString = date.toLocaleTimeString() + '.' + this.formatMilliseconds(date.getMilliseconds());
        var space = this.opts.logIdent.length > this.opts.logIdentWidth ? '\n' + ' '.repeat(this.opts.logIdentWidth) : ' '.repeat(this.opts.logIdentWidth - this.opts.logIdent.length);
        var logIdent = '' + this.opts.logIdent + space;
        (_console = console).log.apply(_console, [timeString + '\t' + logIdent].concat(Array.prototype.slice.call(arguments)));
      }
      this.opts.onLog && this.opts.onLog(Array.from(arguments).join(' '));
    }
  }, {
    key: 'formatMilliseconds',
    value: function formatMilliseconds(milliseconds) {
      var formatted = milliseconds / 1000;
      formatted = formatted.toFixed(3);
      formatted = formatted.toString();
      return formatted.slice(2);
    }
  }, {
    key: 'onChange',
    value: function onChange() {
      this.opts.onChange && this.opts.onChange(this);
    }
  }]);

  return Base;
}();

module.exports = {
  DEFAULT_OPTIONS: DEFAULT_OPTIONS,
  Base: Base
};