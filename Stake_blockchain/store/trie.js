/**
 * Package dependencies
 */
const _ = require('lodash');
/**
* Local dependencies
*/
const {keccakHash} = require('../utils');

/**
 * Node
 */
class Node {
  constructor() {
    this.value = null;
    this.childMap = {};
  }
}
/**
 * Trie
 */
class Trie {
  constructor() {
    this.head = new Node();
    this.generateRootHash();
  }
  //Generate Root Hash
  generateRootHash() {
    this.rootHash = keccakHash(this.head);
  }
  // Retrieve value from Trie
  get({key}) {
    let node = this.head;

    for (let character of key) {
      if (!node.childMap[character]) {
        return null;
      } else {
        node = node.childMap[character];
      }
    }

    return _.cloneDeep(node.value);
  }
  // Store value in Trie
  put({key, value}) {
    // Establish root node
    let node = this.head;
    //
    for (let character of key) {
      // Check if character already exists in a parent node
      if (!node.childMap[character]) {
        // If not, begin a new parent node at that position
        node.childMap[character] = new Node();
      }
      // Insert the character into the tree
      node = node.childMap[character];
    }
    // Once out of the for-loop, insert the remaining value at the last character
    node.value = value
    // generate a new root hash for the child node
    this.generateRootHash();
  }

  static buildTrie({items}) {
    const trie = new this();

    for (let item of items.sort((a, b) => keccakHash(a) > keccakHash(b))) {
      trie.put({key: keccakHash(item), value: item});
    }

    return trie;
  }
}

module.exports = Trie;
