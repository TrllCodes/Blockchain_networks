/** This module will help to generate the hashes for each Block in the blockchain.
* It contains several constant functions, the first of which is sortCharacters,
* which is described below in its docstring. The second is the hash generation
* function keccakHash, which employs the sortCharacters function to ensure that
* identical data, even if presented in a different order, will generate the
* exact same hash. */

/**
 * Package dependencies
 */
const keccak256 = require('js-sha3').keccak256;
const EC = require('elliptic').ec;

/**
 * Local dependencies
 */
const ec = new EC('secp256k1');
/** The sortCharacters function creates a constant string of the same values
* even if items are in a different order. It takes data as input, stringifies it,
* splits the stringified string into its constituent characters, and then sorts
* them. */
const sortCharacters = data => {
  return JSON.stringify(data).split('').sort().join('');
}

/** The keccakHash function generates a keccak256 hash by first creating
* a hash object, then updating it with a string of the data to be encrypted,
* and finally it returns a hexadecimal formatted hash based on the sorted data. */
const keccakHash = data => {
  const hash = keccak256.create();

  hash.update(sortCharacters(data)); //update requires a string, so sortCharacters works perfectly here.

  return hash.hex();
}

// Export the functions as objects for use in other modules.
module.exports = {
  sortCharacters,
  keccakHash,
  ec
};
