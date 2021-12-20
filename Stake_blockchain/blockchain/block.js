/**
 * Add a Transaction Receipts Field - it keeps track of the results of an applied
 * transaction.
 * Add a logsBloom function that keeps track of print statements that have
 * occured in smart contracts.
 */


/**
 * Package dependencies
 */
const {GENESIS_DATA, MINE_RATE} = require('../config');
const {keccakHash} = require('../utils');
const Transaction = require('../transaction');
const Trie = require('../store/trie');

/**
 * Local dependencies
 */
const HASH_LENGTH = 64;
const MAX_HASH_VALUE = parseInt('f'.repeat(HASH_LENGTH), 16);
const MAX_NONCE_VALUE = 2 ** 64;

/**
 * Block
 */
class Block {
  constructor({blockHeaders, transactionSeries}) {
    this.blockHeaders = blockHeaders;
    this.transactionSeries = transactionSeries;
  }

  static calculateBlockTargetHash({lastBlock}) { //divide the max hash value by the last block's difficulty.
    const value = (MAX_HASH_VALUE / lastBlock.blockHeaders.difficulty).toString(16);

    if (value.length > HASH_LENGTH) {
      return 'f'.repeat(HASH_LENGTH);
    }

    return '0'.repeat(HASH_LENGTH - value.length) + value;
  }

  static adjustDifficulty({lastBlock, timestamp}) { //takes in two object params, lastBlock & timestamp.
    const {difficulty} = lastBlock.blockHeaders;

    if ((timestamp - lastBlock.blockHeaders.timestamp) > MINE_RATE) {
      return difficulty - 1;
    }

    if (difficulty < 1) {
      return 1;
    }
    return difficulty + 1;
  }
  /**
   * mineBlock
   *
   * @description
   * Mines a new block to add to the blockchain
   *
   * @param {BlockObject} lastBlock
   * @param {AccountObject} beneficiary
   * @param {BlockObject} transactionSeries
   * @param {StateObject} stateRoot
   *
   * @returns New Block object w/ updated transactionSeries and blockHeaders
   */
  static mineBlock({
    lastBlock,
    beneficiary,
    transactionSeries,
    stateRoot
  }) {
    // Retrieve the new target hash
    const target = Block.calculateBlockTargetHash({lastBlock});
    // Assign the miningRewardTransaction & send it to beneficiary node
    const miningRewardTransaction = Transaction.createTransaction({
      beneficiary
    });
    // Push the miningRewardTransaction into the transactionSeries
    transactionSeries.push(miningRewardTransaction);
    // Create a new transactionsTrie using the items in transactionSeries
    const transactionsTrie = Trie.buildTrie({items: transactionSeries});
    // Define the new block's values
    let timestamp, truncatedBlockHeaders, header, nonce, underTargetHash;
    // Assign the new block's values
    do {
      timestamp = Date.now();
      truncatedBlockHeaders = {
        parentHash: keccakHash(lastBlock.blockHeaders),
        beneficiary,
        difficulty: Block.adjustDifficulty({lastBlock, timestamp}),
        number: lastBlock.blockHeaders.number + 1,
        timestamp,
         // Ensure that attackers can't modify transactions that already exist
         // within older blocks in the blockchain
         transactionsRoot: transactionsTrie.rootHash,
         stateRoot
      };
      header = keccakHash(truncatedBlockHeaders);
      nonce = Math.floor(Math.random() * MAX_NONCE_VALUE);

      underTargetHash = keccakHash(header + nonce);
    } while (underTargetHash > target);


    return new this({
      blockHeaders: {...truncatedBlockHeaders, nonce},
      transactionSeries
    });
  }

  static genesis() {
    return new this(GENESIS_DATA);
  }

  /** The validateBlock function will serve to provide a measure of security
  * for new blocks being added to the blockchain. It has two parameters, lastBlock
  * and block. It will return a Promise that will enforce the rules for
  * how a new block should look. To start, it will ensure that the blockHeaders
  * have been properly formatted. The first check will ensure that the parentHash
  * value for the new block is a matching hash of the hash within the
  * blockHeaders from the lastBlock. The second check will verify that the
  * number of the new block is only 1 greater than the number of the lastBlock
  * in the blockchain. The third check will verify that the mining difficulty
  * is increasing/decreasing by only 1. This will be accomplished by checking
  * for the absolute value of the difference b/n the last block's difficulty
  * and the new block's difficulty. The final check will ensure that the block
  * meets the PoW requirement. This is accomplished by recalculating the target
  * for the block based on the given lastBlock; Then recalculating the
  * underTargetHash based on the blockHeaders from the new block; Then verifying
  * that the underTargetHash actually falls underneath the calculated target hash.
   */
  static validateBlock({lastBlock, block, state}) {
    return new Promise((resolve, reject) => {
      // Ensure that the block isn't the genesis block.
      if (keccakHash(block) === keccakHash(Block.genesis())) {
        return resolve();
      }

      if (keccakHash(lastBlock.blockHeaders) !== block.blockHeaders.parentHash) {
        return reject(
          new Error("The parent hash must be a hash of the last block's headers")
        );
      }

      if (block.blockHeaders.number !== lastBlock.blockHeaders.number + 1) {
        return reject(new Error("The block must increment the number by 1"));
      }

      if (
        Math.abs(lastBlock.blockHeaders.difficulty - block.blockHeaders.difficulty) > 1
      ) {
        return reject(new Error("The difficulty must only adjust by 1"));
      }

      const rebuiltTransactionsTrie = Trie.buildTrie({
        items: block.transactionSeries
      });

      if (rebuiltTransactionsTrie.rootHash !== block.blockHeaders.transactionsRoot) {
        return reject(new Error(
          `The rebuilt transactions root does not match the block's ` +
          `transactions root: ${block.blockHeaders.transactionsRoot}`
        ));
      }
      const target = Block.calculateBlockTargetHash({lastBlock}); // calculates target hash.
      const {blockHeaders} = block; // grabs the blockHeaders object from the given block.
      const {nonce} = blockHeaders; // grabs the nonce value from the blockHeaders object.
      const truncatedBlockHeaders = {...blockHeaders}; // creates a truncatedBlockHeaders constant from the blockHeaders object.
      delete truncatedBlockHeaders.nonce; // deletes the nonce value from the truncatedBlockHeaders constant.
      const header = keccakHash(truncatedBlockHeaders); // creates a temp blockHeaders object from the truncatedBlockHeaders constant.
      const underTargetHash = keccakHash(header + nonce); // creates a new underTargetHash from the header + the grabbed nonce value.

      if (underTargetHash > target) {
        return reject(new Error(
            "The block does not meet the proof of work requirement"
          ));
      }

      Transaction.validateTransactionSeries({
        state, transactionSeries: block.transactionSeries
      }).then(resolve)
        .catch(reject);
    });
  }

  static runBlock({block, state}) {
    for (let transaction of block.transactionSeries) {
      Transaction.runTransaction({transaction, state});
    }
  }
}

module.exports = Block;
