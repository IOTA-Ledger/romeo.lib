const { BaseGuard } = require('./base');
const Transport = require('@ledgerhq/hw-transport-u2f').default;
const AppIota = require('hw-app-iota').default;
const semver = require('semver');
const { LEDGER_APP_VERSION_RANGE } = require('../config');

// use testnet path for now
const BIP44_PATH = "44'/1'/0'";
const DUMMY_SEED = '9'.repeat(81);

const DEFAULT_OPTIONS = {
  concurrent: 1,
  security: 2,
  debug: false
};

class LedgerGuard extends BaseGuard {
  constructor(hwapp, key, options) {
    super(
      Object.assign({}, options, {
        name: 'ledger',
        sequentialTransfers: true
      })
    );
    this.opts = options;

    this.hwapp = hwapp;
    this.key = key;
  }

  static async build(options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options);
    const transport = await Transport.create();
    if (opts.debug) {
      transport.setDebugMode(true);
    }
    // wait 3s for result
    transport.setExchangeTimeout(3000);
    const hwapp = new AppIota(transport);

    await LedgerGuard._checkVersion(hwapp);
    await LedgerGuard._setInternalSeed(hwapp, 2);
    const keyAddress = await hwapp.getAddress(0);

    return new LedgerGuard(hwapp, keyAddress.substr(0, 32), opts);
  }

  getMaxOutputs() {
    return 1;
  }

  getMaxInputs() {
    return 2;
  }

  getSymmetricKey() {
    return this.key;
  }

  ///////// Private methods should not be called directly! /////////

  async _setActivePage(pageIndex) {
    await this._setPageSeed(pageIndex);
  }

  async _getPages(index, total) {
    await this._setPageSeed(-1);
    return await this._getGenericAddresses(index, total);
  }

  async _getAddresses(index, total) {
    return await this._getGenericAddresses(index, total);
  }

  async _getSignedTransactions(transfers, inputs, remainder) {
    // filter unnecessary inputs
    inputs = inputs || [];
    inputs = inputs.filter(input => input.balance > 0);
    // hw-app-iota requires a tag to be present
    transfers.forEach(t => (t.tag = t.tag ? t.tag : ''));

    if (this.opts.debug) {
      console.log('getSignedTransactions;', transfers, inputs, remainder);
    }

    // the ledger is only needed, if there are proper inputs
    if (Array.isArray(inputs) && inputs.length) {
      return await this.hwapp.signTransaction(transfers, inputs, remainder);
    }

    // no inputs use the regular iota lib with a dummy seed
    const options = {
      inputs,
      address: remainder
    };
    return await (() =>
      new Promise((resolve, reject) => {
        this.iota.api.prepareTransfers(
          DUMMY_SEED,
          transfers,
          options,
          (err, result) => {
            if (err) return reject(err);
            resolve(result);
          }
        );
      }))();
  }

  async _getGenericAddresses(index, total) {
    var addresses = [];
    for (var i = 0; i < total; i++) {
      const keyIndex = index + i;
      const address = await this.hwapp.getAddress(keyIndex);
      if (this.opts.debug) {
        console.log('getGenericAddress; index=%i, key=%s', keyIndex, address);
      }
      addresses.push(address);
    }

    return addresses;
  }

  async _setPageSeed(pageIndex) {
    if (this.activePageIndex != pageIndex) {
      if (pageIndex < 0) {
        if (this.opts.debug) {
          console.log('setInternalSeed; index=%i', 1);
        }
        await LedgerGuard._setInternalSeed(this.hwapp, 1);
      } else {
        if (this.opts.debug) {
          console.log('setExternalSeed; index=%i', pageIndex);
        }
        await this.hwapp.setActiveSeed(
          LedgerGuard._getBipPath(0, pageIndex),
          this.opts.security
        );
      }

      this.activePageIndex = pageIndex;
    }
  }

  static async _checkVersion(hwapp) {
    const appVersion = semver.clean(await hwapp.getAppVersion());
    if (!semver.satisfies(appVersion, LEDGER_APP_VERSION_RANGE)) {
      const message =
        'Your IOTA-Ledger app version ' +
        appVersion +
        ' is outdated! You must update to a version satisfying "' +
        LEDGER_APP_VERSION_RANGE +
        '"  before you can login!';
      throw new Error(message);
    }
  }

  static async _setInternalSeed(hwapp, index) {
    await hwapp.setActiveSeed(LedgerGuard._getBipPath(1, index), 1);
  }

  static _getBipPath(change, index) {
    return BIP44_PATH + '/' + change + '/' + index;
  }
}

module.exports = LedgerGuard;
