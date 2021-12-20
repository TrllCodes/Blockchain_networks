/**
 * Package dependencies
 */
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const Account = require('../account');
const Blockchain = require('../blockchain');
const Block = require('../blockchain/block');
const PubSub = require('./pubsub');
const State = require('../store/state');
const Transaction = require('../transaction');
const TransactionQueue = require('../transaction/transaction-queue');

/**
 * Local dependencies
 */
const app = express();
app.use(bodyParser.json());
const state = new State();
const blockchain = new Blockchain({state});
const transactionQueue = new TransactionQueue();
const pubsub = new PubSub({blockchain, transactionQueue});
const account = new Account();
const transaction = Transaction.createTransaction({account});

setTimeout(() => {
  pubsub.broadcastTransaction(transaction);
}, 500);


app.get('/blockchain', (req, res, next) => {
  const {chain} = blockchain; // create a deconstructed chain object

  res.json({chain}); //responds to the request with a json of the chain object
});

app.get('/blockchain/mine', (req, res, next) => {
  // Retrieve and assign the last block in the chain
  const lastBlock = blockchain.chain[blockchain.chain.length - 1];
  // Mine it and assign it to the block constant
  const block = Block.mineBlock({
    lastBlock,
    beneficiary: account.address,
    transactionSeries: transactionQueue.getTransactionSeries(),
    stateRoot: state.getStateRoot()
  });
  // Add the mined block to the blockchain if it is valid, if not, return a catch error
  blockchain.addBlock({block, transactionQueue})
    .then(() => {
      pubsub.broadcastBlock(block);

      res.json({block})
    })
    .catch(next);
});

app.post('/account/transact', (req, res, next) => {
  // Extract the 'to' & 'value' fields from the body of the request
  const {code, gasLimit, to, value} = req.body;
  // Instantiate and assign a new transaction object
  const transaction = Transaction.createTransaction({
    // Check if a new account is being created, or if a regular transaction is being created
    account: !to ? new Account({code}) : account,
    gasLimit,
    to,
    value
  });
  pubsub.broadcastTransaction(transaction);
  // Respond to the requester with the new transaction object
  res.json({transaction});
});

app.get('/account/balance', (req, res, next) => {
  // Allow client to input addresses via request query
  const {address} = req.query;
  // Calculate balance either for the queried address or for the default user address
  const balance = Account.calculateBalance({
    address: address || account.address,
    state
  });

  res.json({balance});
});

app.use((err, req, res, next) => {
  console.error('Internal server error:', err);

  res.status(500).json({message: err.message});
  });

const peer = process.argv.includes('--peer');

const PORT = peer
  ? Math.floor(2000 + Math.random() * 2000)
  : 3000;

if (peer) {
  request('http://localhost:3000/blockchain', (error, response, body) => {
    const {chain} = JSON.parse(body);

    blockchain.replaceChain({chain})
      .then(() => console.log('Synchronized blockchain with the root node'))
      .catch(error => console.error('Synchronization error:', error.message));
  });
}

app.listen(PORT, () => console.log(`listening at PORT: ${PORT}`));
