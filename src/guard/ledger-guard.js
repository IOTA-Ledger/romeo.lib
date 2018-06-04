import Transport from '@ledgerhq/hw-transport-u2f';
import AppIota from 'hw-app-iota';
const { BaseGuard } = require('./base');
const { LEDGER_APP_MIN_VERSION } = require('../config');
const util = require('util');

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
    // wait 3s for result
    transport.setExchangeTimeout(3000);
    const hwapp = new AppIota(transport);

    const appConfig = await LedgerGuard._getAppConfig(hwapp);

    const appVersion = (appConfig.app_version_major << 16) | (appConfig.app_version_minor << 8) | appConfig.app_version_patch

    if (appVersion < LEDGER_APP_MIN_VERSION) {
      throw new Error(util.format('Your IOTA-Ledger app version is outdated (v%s.%s.%s)! You must update to version v%s.%s.%s before you can login!',
        appConfig.app_version_major,
        appConfig.app_version_minor,
        appConfig.app_version_patch,
        (LEDGER_APP_MIN_VERSION >> 16) & 0xFF,
        (LEDGER_APP_MIN_VERSION >> 8) & 0xFF,
        LEDGER_APP_MIN_VERSION & 0xFF));
    };

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

    if (this.opts.debug) {
      console.log(
        'prepareTransfers; #output=%i, #input=%i',
        transfers.length,
        inputs.length
      );
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

  static async _setInternalSeed(hwapp, index) {
    await hwapp.setActiveSeed(LedgerGuard._getBipPath(1, index), 1);
  }

  static _getBipPath(change, index) {
    return BIP44_PATH + '/' + change + '/' + index;
  }

  static async _getAppConfig(hwapp) {
    return await hwapp.getAppConfig();
  }
}

module.exports = LedgerGuard;
