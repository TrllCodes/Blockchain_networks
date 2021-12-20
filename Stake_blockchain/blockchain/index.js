/**
 * Local dependencies
 */
const Block = require('./block');

/**
 * Blockchain
 */
class Blockchain {
  constructor({state}) {
    this.chain = [Block.genesis()];
    this.state = state;
  }

  addBlock({block, transactionQueue}) {
    // Validate all new incoming blocks before adding them to the blockchain.
    return new Promise((resolve, reject) => {
      Block.validateBlock({
        lastBlock: this.chain[this.chain.length -1],
        block,
        state: this.state
      }).then(() => {
        this.chain.push(block);

        Block.runBlock({block, state: this.state});

        transactionQueue.clearBlockTransactions({
          transactionSeries: block.transactionSeries
        });

        return resolve();
      }).catch(reject);
    });
  }

  /**
   * replaceChain
   *
   * @description
   * Replaces blockchain when new peer node starts
   *
   * @param {chainObject} chain
   *
   * @returns New blockchain.chain object
   */
  replaceChain({chain}) {
    return new Promise(async (resolve, reject) => { // async is nec. for await to work.
      // Iterate through the entire blockchain.//
      for (let i = 0; i < chain.length; i++) {
        const block = chain[i];
        const lastBlockIndex = i - 1;
        /** To ensure that the index in the loop never goes past the genesis
        * block to -1, set a check within the for loop. If the lastBlockIndex is
        * greater than or equal to 0, then the lastBlock index variable will
        * calculate normally, otherwise it will return a null value. */
        const lastBlock = lastBlockIndex >= 0 ? chain[i - 1] : null;
        /** Use the await keyword within a try/catch statement so that the
        * promise behaves in a synchronous manner and does not try to validate
        * multiple blocks at once. */
        try {
          await Block.validateBlock({lastBlock, block, state: this.state});
          Block.runBlock({block, state: this.state});
        } catch (error) {
          return reject(error);
        }

        console.log(`*-- Validated block number: ${block.blockHeaders.number}`);
      }

      this.chain = chain;

      return resolve();
    });
  }
}


module.exports = Blockchain;
