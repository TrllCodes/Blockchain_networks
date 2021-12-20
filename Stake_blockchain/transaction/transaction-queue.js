/**
 * Transaction Queue class
 */
class TransactionQueue {
  constructor() {
    this.transactionMap = {};
  }

  /**
   * add
   *
   * @description
   * Adds a transaction to the transactionMap object
   *
   * @param transaction
   *
   * @returns transactionMap object value
   */
  add(transaction) {
    // Add transaction to map at transaction ID index
    this.transactionMap[transaction.id] = transaction;
  }

  /**
   * getTransactionSeries
   *
   * @description
   * Returns all values contained within the transactionMap object
   *
   * @returns Array of all values in the transactionMap object
   */
  getTransactionSeries() {
    // Return the array of I values in the transactionMap Object
    return Object.values(this.transactionMap);
  }

  /**
   * clearBlockTransactions
   *
   * @description
   * Clears transactions from blocks
   */
  clearBlockTransactions({transactionSeries}) {
    for (let transaction of transactionSeries) {
      delete this.transactionMap[transaction.id];
    }
  }
}

module.exports = TransactionQueue;
