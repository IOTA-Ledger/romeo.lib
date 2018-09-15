const { BaseGuard } = require('./base');
const Transport = require('@ledgerhq/hw-transport-u2f').default;
const AppIota = require('hw-app-iota').default;
const semver = require('semver');
const {
  LEDGER_APP_VERSION_RANGE,
  LEDGER_PAGE_BIP32_PATH
} = require('../config');

// the iota lib needs a seed even for 0-value transactions
const DUMMY_SEED = '9'.repeat(81);

const ADDRESS_DERIVATION = (account, pageIndex, keyIndex) => ({
  path: LEDGER_PAGE_BIP32_PATH(account, pageIndex),
  keyIndex
});
const PAGE_ADDRESS_DERIVATION = (account, pageIndex) => ({
  path: LEDGER_PAGE_BIP32_PATH(account, pageIndex),
  keyIndex: 0
});
const KEY_ADDRESS_DERIVATION = account => ({
  path: LEDGER_PAGE_BIP32_PATH(account, 0),
  keyIndex: 0xffffffff
});

const DEFAULT_OPTIONS = {
  concurrent: 1,
  account: 0,
  security: 2,
  debug: false
};

class LedgerGuard extends BaseGuard {
  constructor(hwapp, key, options) {
    super(options);
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

    const hwapp = new AppIota(transport);
    await LedgerGuard._checkVersion(hwapp);

    const { path, keyIndex } = KEY_ADDRESS_DERIVATION(opts.account);
    await hwapp.setActiveSeed(path, 1);
    const keyAddress = await hwapp.getAddress(keyIndex);

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

  async _getPages(pageIndex, total) {
    this._setActivePage(-1);
    return await this._getAddresses(pageIndex, total);
  }

  async _getAddresses(index, total) {
    const addresses = [];
    for (let i = 0; i < total; i++) {
      addresses.push(await this._getGenericAddress(index + i));
    }
    return addresses;
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

  async _setActiveSeed(path) {
    const { debug, security } = this.opts;
    // only pass the command, if the path has indeed changed
    if (this.activePath !== path) {
      if (debug) {
        console.log('setActiveSeed; path=%s, security=%i', path, security);
      }
      await this.hwapp.setActiveSeed(path, security);
      this.activePath = path;
    }
  }

  async _getGenericAddress(index) {
    const { debug, account } = this.opts;
    // get the corresponding address derivation
    const { path, keyIndex } =
      this.activePageIndex < 0
        ? PAGE_ADDRESS_DERIVATION(account, index)
        : ADDRESS_DERIVATION(account, this.activePageIndex, index);

    await this._setActiveSeed(path);
    const address = await this.hwapp.getAddress(keyIndex);
    if (debug) {
      console.log('getAddress; index=%i, key=%s', keyIndex, address);
    }
    return address;
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
}

module.exports = LedgerGuard;
