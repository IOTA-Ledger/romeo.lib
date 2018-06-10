const value = (key, defaultValue) =>
  (process && process.env && process.env[key]) || defaultValue;

const IOTA_BALANCE_TRESHOLD = value('IOTA_BALANCE_TRESHOLD', 100);

const IOTA_API_ENDPOINT = value(
  'IOTA_API_ENDPOINT',
  'https://field.carriota.com'
);

const IOTA_DEPTH = value('IOTA_DEPTH', 4);

const IOTA_MWM = value('IOTA_MWM', 14);

const PAGE_RESYNC_SECONDS = value('PAGE_RESYNC_SECONDS', 180);

const LEDGER_APP_MIN_VERSION = 0x000200; // 1 Byte Major, 1 Byte Minor, 1 Byte Patch

module.exports = {
  IOTA_API_ENDPOINT,
  IOTA_DEPTH,
  IOTA_MWM,
  IOTA_BALANCE_TRESHOLD,
  PAGE_RESYNC_SECONDS,
  LEDGER_APP_MIN_VERSION
};
