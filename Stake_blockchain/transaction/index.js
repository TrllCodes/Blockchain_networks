/**
 * The Transaction class will help to record how the state of the decentralized
 * computer should change. The state can be changed in many ways, whether it
 * changes due to a currency exchange b/n 2 or more parties, or changes due to
 * the creation of a new account or execution of a smart contract. This class
 * will record and transmit changes in state b/n all nodes on the blockchain
 * network's decentralized computer. Its constructor method will create a
 * Transaction object using 6 objects: A transaction ID; the address that the
 * transaction is coming from; the address that the transaction is going to;
 * the value of the transaction in terms of the amount of currency being
 * used/spent; the type of data being transmitted by the transaction, which will
 * enable more that just simple currency exchanges to take place; and the private
 * signature needed to verify that the transaction is authentic.
 */
/**
 * Things to include and develop further:
 * Transaction fees - reserve a portion of every transaction's value as a
 * "sales tax", these fees are then paid out to miners who mine new blocks as a
 * part of their mining reward. It incentivizes miners to include larger
 * transactions in the blocks that they mine.
 * Gas Price - gasPrice would serve to multiply the price of the smart contract's
 * gas per instruction to a higher value. This price is determined by the sender.
 * Miner control over the transactionSeries -
 * Ommers - invalid blocks that miners still used CPU power to mine, even though
 * they are invalid, a small number of them are selected and a smaller mining
 * fee is paid to the miner(s) who mined them.
 * Patricia Trie Implementation instead of just regular Tries.
 * Directed Acyclic Graphs in mining algorithm.
 * Add more validations - Ensure that there are no duplicate transactions in a
 * block; Ensure that there are no transactions in a block that already exist in
 * the blockchain; 
 * Transaction Receipts Field - for the block object.
 */
/**
 * Package dependencies
 */
const {v4: uuid} = require('uuid');

/**
 * Local dependencies
 */
const Account = require('../account');
const Interpreter = require('../interpreter');
const {MINING_REWARD} = require('../config');

const TRANSACTION_TYPE_MAP = {
  CREATE_ACCOUNT: 'CREATE_ACCOUNT',
  TRANSACT: 'TRANSACT',
  MINING_REWARD: 'MINING_REWARD'
};

/**
 * Transaction Class
 */
class Transaction {
  constructor({id, from, to, value, data, signature, gasLimit}) {
    this.id = id || uuid();
    this.from = from || '-';
    this.to = to || '-';
    this.value = value || 0;
    this.data = data || '-';
    this.signature = signature || '-';
    this.gasLimit = gasLimit || 0;
  }

  /**
   * createTransaction
   *
   * @description
   * Creates a new Transaction
   *
   * @param account (sender)
   * @param to (recipient)
   * @param value (amount of currency being exhanged/used)
   *
   * @returns Transact Object || CreateAccount Object
   */
  static createTransaction({account, to, value, beneficiary, gasLimit}) {
    if (beneficiary) {
      return new Transaction({
        to: beneficiary,
        value: MINING_REWARD,
        gasLimit,
        data: {type: TRANSACTION_TYPE_MAP.MINING_REWARD}
      });
    }
    // Check if a recipient exists to determine transaction type
    if (to) {
      const transactionData = {
        id: uuid(),
        from: account.address,
        to,
        value: value || 0,
        gasLimit: gasLimit || 0,
        data: {type: TRANSACTION_TYPE_MAP.TRANSACT}
      }

      // If yes, return the signed transaction
      return new Transaction({
        ...transactionData,
        signature: account.sign(transactionData)
      });
    }

    // If not, return 'CREATE_ACCOUNT' transaction type.
    return new Transaction({
      data: {
        type: TRANSACTION_TYPE_MAP.CREATE_ACCOUNT,
        accountData: account.toJSON()
      }
    });
  }//createTransaction

  /**
   * validateStandardTransaction
   *
   * @description
   * Validates a standard transaction change of state in the blockchain
   *
   * @param {TransactionObject} transaction
   * @param {StateObject} state
   *
   * @returns {Boolean}
   */
  static validateStandardTransaction({state, transaction}) {
    return new Promise((resolve, reject) => {
      // Destructure {id, from, signature, value & to} fields from the transaction object
      const {id, from, signature, value, to, gasLimit} = transaction;
      // Retrieve original transaction data
      const transactionData = {...transaction};
      // Remove original signature
      delete transactionData.signature;
      // Ensure new signature is valid
      if (!Account.verifySignature({
        publicKey: from,
        data: transactionData,
        signature})
      ) {
        return reject(new Error(`Transaction: ${id} signature is invalid`));
      }

      // Retrieve the balance of the sender
      const fromBalance = state.getAccount({address: from}).balance;
      // Ensure transaction value does not exceed account balance of sender
      if ((value + gasLimit) > fromBalance) {
        return reject(new Error(
          `Transaction value and gasLimit: ${value + gasLimit} exceeds account balance: ${fromBalance}`
        ));
      }
      // Define the transaction recipient
      const toAccount = state.getAccount({address: to});
      // Ensure that the transaction recipient exists
      if (!toAccount) {
        return reject(new Error(
          `The "to" account field: ${to} does not exist`
        ));
      }

      if (toAccount.codeHash) {
        const {gasUsed} = new Interpreter({
          storageTrie: state.storageTrieMap[toAccount.codeHash]
        }).runCode(toAccount.code);

        if (gasUsed > gasLimit) {
          return reject(new Error(
            `Transaction needs more gas. Gas Provided: ${gasLimit}; Gas Needed: ${gasUsed}`
          ));
        }
      }
      // Return the resolved valid transaction
      return resolve();
    });
  }//validateStandardTransaction

  /**
   * validateCreateAccountTransaction
   *
   * @description
   * Validates an account creation transaction change of state in the blockchain
   *
   * @param transaction
   *
   * @returns {Boolean}
   */
  static validateCreateAccountTransaction({transaction}) {
    return new Promise((resolve, reject) => {
      // Retrieve and assign the expected fields for a valid new account instance
      const expectedAccountDataFields = Object.keys(new Account().toJSON());
      // Retrieve and assign the actual fields from the transaction object
      const fields = Object.keys(transaction.data.accountData);

      // Ensure the length of the fields array matches expectedAccountDataFields
      if (fields.length !== expectedAccountDataFields.length) {
        return reject(new Error(
          `The transaction account data has an incorrect number of fields`
        ));
      }

      // Ensure that each field in the array is valid
      fields.forEach(field => {
        if (!expectedAccountDataFields.includes(field)) {
          return reject(new Error(
            `The field: ${field}, is unexpected for account data`
          ));
        }
      });

      // Return the resolved valid account creation transaction
      return resolve();
    });
  }

  /**
   * validateMiningRewardTransaction
   *
   * @description
   * Validates the MINING_REWARD transaction
   *
   * @param {TransactionObject} transaction
   *
   * @returns {Boolean}
   */
  static validateMiningRewardTransaction({transaction}) {
    return new Promise((resolve, reject) => {
      const {value} = transaction;

      if (value !== MINING_REWARD) {
        return reject(new Error(
          `The provided mining reward value: ${value} does not equal ` +
          `the official mining reward value of: ${MINING_REWARD}`
        ));
      }

      return resolve();
    });
  }
  /**
   * validateTransactionSeries
   *
   * @description
   * Validates transactionSeries Objects
   *
   * @param {TransactionObject} transactionSeries
   *
   * @returns {Boolean}
   */
  static validateTransactionSeries({transactionSeries, state}) {
    return new Promise(async (resolve, reject) => {
      for (let transaction of transactionSeries) {
        try {
          switch (transaction.data.type) {
            case TRANSACTION_TYPE_MAP.CREATE_ACCOUNT:
              await Transaction.validateCreateAccountTransaction({transaction});
              break;
            case TRANSACTION_TYPE_MAP.TRANSACT:
              await Transaction.validateStandardTransaction({
                state,
                transaction
              });
              break;
            case TRANSACTION_TYPE_MAP.MINING_REWARD:
              await Transaction.validateMiningRewardTransaction({
                state,
                transaction
              });
              break;
            default:
              break;
          }
        } catch (error) {
          return reject(error);
        }
      }


      return resolve();
    });
  }
  /**
   * runTransaction
   *
   * @description
   *
   *
   * @param {StateObject} state
   * @param {TransactionObject} transaction
   *
   * @returns
   */
  static runTransaction({state, transaction}) {
    switch (transaction.data.type) {
      case TRANSACTION_TYPE_MAP.TRANSACT:
        Transaction.runStandardTransaction({state, transaction});
        console.log(
          ' -- Updated account data to reflect the standard transaction'
        );
        break;
      case TRANSACTION_TYPE_MAP.CREATE_ACCOUNT:
        Transaction.runCreateAccountTransaction({state, transaction});
        console.log(
          ' -- Stored the new account data'
        );
        break;
      case TRANSACTION_TYPE_MAP.MINING_REWARD:
        Transaction.runMiningRewardTransaction({state, transaction});
        console.log(
          ' -- Updated the account data to reflect the mining reward'
        );
        break;
      default:
        break;
    }
  }
  /**
   * runStandardTransaction
   *
   * @description
   * Changes/Updates the state by running a standard transaction
   *
   * @param {StateObject} state
   * @param {TransactionObject} transaction
   *
   * @returns Updated state w/ new account balances
   */
  static runStandardTransaction({state, transaction}) {
    // get account data for the accounts relevant to the transaction
    const fromAccount = state.getAccount({address: transaction.from});
    const toAccount = state.getAccount({address: transaction.to});

    let gasUsed = 0;
    let result;

    if (toAccount.codeHash) {
      const interpreter = new Interpreter({
        storageTrie: state.storageTrieMap[toAccount.codeHash]
      });

      ({gasUsed, result} = interpreter.runCode(toAccount.code));

      console.log(
        ` -*- Smart contract execution: ${transaction.id} - RESULT: ${result}`
      );
    }
    // destructure value object from the transaction object and assign it
    const {value, gasLimit} = transaction;
    const refund = gasLimit - gasUsed;
    // Update the account balances for the involved parties
    fromAccount.balance -= value;
    fromAccount.balance -= gasLimit;
    fromAccount.balance += refund;
    toAccount.balance += value;
    toAccount.balance += gasUsed;

    // Update the 'from' & 'to' accounts within the State object
    state.putAccount({address: transaction.from, accountData: fromAccount});
    state.putAccount({address: transaction.to, accountData: toAccount});
  }

  /**
   * runCreateAccountTransaction
   *
   * @description
   * Stores the account given in the transaction object within the state field
   *
   * @param {StateObject} state
   * @param {TransactionObject} transaction
   *
   * @returns Updated state w/ newly created account info
   */
  static runCreateAccountTransaction({state, transaction}) {
    // destructure accountData from the transaction object data
    const {accountData} = transaction.data;
    // destructure address from accountData object
    const {address, codeHash} = accountData;

    // Update the state with new address and accountData
    state.putAccount({address: codeHash ? codeHash : address, accountData});
  }

  /**
   * runMiningRewardTransaction
   *
   * @description
   * Sends the MINING_REWARD to the account address of the beneficiary that
   * has mined a new block
   *
   * @param {StateObject} state
   * @param {TransactionObject} transaction
   *
   * @returns Updated state reflecting the new account balance of the MINING_REWARD
   * beneficiary
   */
  static runMiningRewardTransaction({state, transaction}) {
    const {to, value} = transaction;
    const accountData = state.getAccount({address: to});

    accountData.balance += value;

    state.putAccount({address: to, accountData});
  }
}//Transaction

/**
* Export
*/
module.exports = Transaction;
