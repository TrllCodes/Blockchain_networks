/**
 * Local dependencies
 */
const {ec, keccakHash} = require('../utils');
const {STARTING_BALANCE} = require('../config');

/** The Account class
* It has two main methods, sign, which generates the private key signature; and
* verifySignature, which will validate given data based on the account's public
* key and its private signature.
*/
class Account {
  constructor({code} = {}) {
    this.keyPair = ec.genKeyPair();
    this.address = this.keyPair.getPublic().encode('hex');
    this.balance = STARTING_BALANCE;
    this.code = code || [];
    this.generateCodeHash();
  }

  /**
   * generateCodeHash
   *
   * @description
   * Generates a hash value for a given code array
   *
   * @param {}
   *
   * @returns
   */
  generateCodeHash() {
    this.codeHash = this.code.length > 0
      ? keccakHash(this.address + this.code)
      : null; // Think about incorporating date.now() into the hash algorithm.
  }

  /**
   * sign
   *
   * @description
   * Signs account data to verify transactions
   *
   * @param {} data
   *
   * @returns Signed hash of given data
   */
  sign(data) {
    return this.keyPair.sign(keccakHash(data));
  }

  toJSON() {
    return {
      address: this.address,
      balance: this.balance,
      code: this.code,
      codeHash: this.codeHash
    };
  }

  static verifySignature({publicKey, data, signature}) {
    const keyFromPublic = ec.keyFromPublic(publicKey, 'hex');

    return keyFromPublic.verify(keccakHash(data), signature);
  }

  /**
   * calculateBalance
   *
   * @description
   * Calculates the balance of the account address
   *
   * @param {AccountObject} address
   * @param {StateObject} state
   *
   * @returns The up-to-date balance within the state machine for the given address
   */
  static calculateBalance({address, state}) {
    return state.getAccount({address}).balance;
  }
}

module.exports = Account;
