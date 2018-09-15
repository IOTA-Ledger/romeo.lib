const value = (key, defaultValue) =>
  (process && process.env && process.env[key]) || defaultValue;

const IOTA_BALANCE_TRESHOLD = value('IOTA_BALANCE_TRESHOLD', 100);

const IOTA_API_ENDPOINT = value(
  'IOTA_API_ENDPOINT',
  'https://field.deviota.com'
);

const IOTA_DEPTH = value('IOTA_DEPTH', 4);

const IOTA_MWM = value('IOTA_MWM', 14);

const PAGE_RESYNC_SECONDS = value('PAGE_RESYNC_SECONDS', 180);

// allowed version range for the Ledger Nano app
const LEDGER_APP_VERSION_RANGE = '^0.4.0';

// BIP32 path to derive the page seed on the Ledger Nano
const LEDGER_PAGE_BIP32_PATH = (account, pageIndex) =>
  `44'/4218'/${account}'/${pageIndex}'`;

module.exports = {
  IOTA_API_ENDPOINT,
  IOTA_DEPTH,
  IOTA_MWM,
  IOTA_BALANCE_TRESHOLD,
  PAGE_RESYNC_SECONDS,
  LEDGER_APP_VERSION_RANGE,
  LEDGER_PAGE_BIP32_PATH
};
