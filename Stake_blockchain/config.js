const GENESIS_DATA = {
  blockHeaders: {
    parentHash: '--genesis-parent-hash--', // The hash of the previous block in the chain.
    beneficiary: '--genesis-beneficiary--',
    difficulty: 1,
    number: 0, //position of the block in the chain.
    timestamp: '--genesis-timestamp--',
    nonce: 0,
    transactionsRoot: '--genesis-transactions-root-',
    stateRoot: '--genesis-state-root--'
  },
  transactionSeries: []
};

const MILLISECONDS = 1;
const SECONDS = 1000 * MILLISECONDS;
const MINUTES = 60 * SECONDS;

const MINE_RATE = 10 * SECONDS;

const STARTING_BALANCE = 500;

const MINING_REWARD = 12.5;

module.exports = {
  GENESIS_DATA,
  MINE_RATE,
  STARTING_BALANCE,
  MINING_REWARD
};
