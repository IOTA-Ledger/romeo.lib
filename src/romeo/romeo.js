const { Base } = require('./base');
const createQueue = require('../queue');
const { Database } = require('../db');
const { Pages } = require('./pages');

const DEFAULT_OPTIONS = {
  syncInterval: 60000,
  dbPath: 'romeo',
  guard: null
};

class Romeo extends Base {
  constructor(options) {
    const opts = Object.assign(
      {},
      DEFAULT_OPTIONS,
      {
        logIdent: 'ROMEO'
      },
      options
    );
    super(opts);
    if (!this.opts.guard) throw new Error('No guard provided!');
    this.guard = this.opts.guard;
    this.ready = false;
    this.isOnline = 1;
    this.checkingOnline = false;
    this.addingPage = false;
    this.opts = opts;
    this.db = new Database({
      path: opts.dbPath,
      password: this.guard.getSymmetricKey()
    });
    this.iota = this.guard.setupIOTA({ database: this.db });
    this.queue = createQueue();
    this.pages = new Pages({
      guard: this.guard,
      queue: this.queue,
      iota: this.iota,
      db: this.db,
      onLog: log => console.log('onLog', log),
      onChange: this.onChange
    });
    this.updater = null;
    this.onlineUpdater = null;
    this.checkOnline = this.checkOnline.bind(this);
    this.checkOnline();
  }

  async init(restoreString) {
    if (restoreString) {
      await this.db.restore(restoreString, true);
    }
    await this.pages.init(false, 10000);
    this.updater = setInterval(
      () => this.pages.syncCurrentPage(),
      this.opts.syncInterval
    );
    this.onlineUpdater = setInterval(this.checkOnline, 30000);
    return this;
  }

  async terminate(returnBackup = false) {
    if (this.updater) {
      clearInterval(this.updater);
      this.updater = null;
    }
    if (this.onlineUpdater) {
      clearInterval(this.onlineUpdater);
      this.onlineUpdater = null;
    }
    this.queue.removeAll();
    if (returnBackup) {
      return this.backupDatabase();
    }
    return true;
  }

  asJson() {
    const { queue: { jobs }, pages, isOnline, checkingOnline, ready } = this;
    return {
      jobs: Object.values(jobs).map(j => Object.assign({}, j)),
      genericJobs: pages.getJobs().map(j => Object.assign({}, j)),
      pages: pages.asJson(),
      isOnline,
      checkingOnline,
      provider: this.iota.api.ext.provider,
      ready,
      addingPage: this.addingPage
    };
  }

  checkOnline() {
    const start = new Date();
    this.checkingOnline = true;
    this.iota.api.getNodeInfo(err => {
      this.checkingOnline = false;
      if (err) {
        this.isOnline = false;
        this.onChange();
        return;
      }
      this.isOnline = new Date() - start;
      this.onChange();
    });
  }

  async backupDatabase() {
    return await this.db.backup(true);
  }

  async newPage(opts = {}, onCreate) {
    this.addingPage = true;
    try {
      const { preventRetries, sourcePage, includeReuse = false } = opts;
      const currentPage = sourcePage || this.pages.getCurrent();

      const newPage = this.pages.getByAddress(
        (await this.pages.getNewPage())[0]
      ).page;

      if (!currentPage.isSynced()) {
        await currentPage.sync();
      }
      const address = newPage.getCurrentAddress().address;
      const inputs = currentPage.getInputs(includeReuse);
      const tag = '99ROMEO9NEW9PAGE9TRANSFER99';

      if (this.guard.opts.sequentialTransfers) {
        for (let input of inputs) {
          const value = input.balance;
          await currentPage.sendTransfers(
            [{ address, value, tag }],
            [input],
            'Moving funds to the new page sequentially.',
            'Failed moving all or some funds!',
            null,
            preventRetries
          );
        }
      } else {
        const value = inputs.reduce((t, i) => t + i.balance, 0);
        if (value > 0) {
          await currentPage.sendTransfers(
            [{ address, value, tag }],
            inputs,
            'Moving funds to the new page',
            'Failed moving funds!',
            null,
            preventRetries
          );
        }
      }

      newPage.syncTransactions();
      onCreate && onCreate(newPage);
      this.addingPage = false;

      currentPage.syncTransactions();
      this.onChange();
      return newPage;
    } catch (e) {
      this.addingPage = false;
      throw e;
    }
  }

  onChange() {
    if (!this.ready) {
      const current = this.pages.getCurrent();
      if (current && Object.keys(current.addresses).length) {
        this.ready = true;
      }
    }
    return super.onChange();
  }
}

module.exports = {
  DEFAULT_OPTIONS,
  Romeo
};
