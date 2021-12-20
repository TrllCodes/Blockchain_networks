/**
 * Package dependencies
 */
const request = require('request');

 /**
  * Local dependencies
  */
const {OPCODE_MAP} = require('./interpreter');
const {STOP, ADD, PUSH, STORE, LOAD} = OPCODE_MAP;

const BASE_URL = 'http://localhost:3000';


const postTransact = ({code, to, value, gasLimit}) => {
  // Make POST request to /account/transact/ endpoint
  return new Promise((resolve, reject) => {
    request(`${BASE_URL}/account/transact`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({code, to, value, gasLimit})
      }, (error, response, body) => {
        // if request is successful, return a parse of the JSON string in the body
        return resolve(JSON.parse(body));
      });
  });
}

const getMine = () => {
  return new Promise((resolve, reject) => {
    // Delay request to allow new transactions to join transactionQueue
    setTimeout(() => {
      request(`${BASE_URL}/blockchain/mine`, (error, response, body) => {
        return resolve(JSON.parse(body));
      });
    }, 1000);
  });
}

const getAccountBalance = ({address} = {}) => {
  return new Promise((resolve, reject) => {
    request(                          // Check if address is defined
      `${BASE_URL}/account/balance` + (address ? `?address=${address}` : ''),
      (error, response, body) => {
        return resolve(JSON.parse(body));
      }
    );
  });
}

let toAccountData;
let smartContractAccountData;

postTransact({})
  // Create new account
  .then(postTransactResponse => {
    console.log(
      'postTransactResponse (Create Account Transaction)',
      postTransactResponse
    );
    // Store the newly created account's data in a constant
    toAccountData = postTransactResponse.transaction.data.accountData;

    // Register account within the state
    return getMine();
  }).then(getMineResponse => {
      console.log('getMineResponse', getMineResponse);
    return postTransact({to: toAccountData.address, value: 20})
  })
  .then(postTransactResponse2 => {
    console.log(
      'postTransactResponse2 (Standard Transaction)',
      postTransactResponse2
    );

    const key = 'foo';
    const value = 'bar';
    const code = [PUSH, value, PUSH, key, STORE, PUSH, key, LOAD, STOP];

    return postTransact({code});
  })
  .then(postTransactResponse3 => {
    console.log(
      'postTransactResponse3 (Smart Contract)',
      postTransactResponse3
    );

    smartContractAccountData = postTransactResponse3
      .transaction
      .data
      .accountData;

    return getMine();
  })
  .then(getMineResponse2 => {
    console.log('getMineResponse2', getMineResponse2);

    return postTransact({
      to: smartContractAccountData.codeHash,
      value: 0,
      gasLimit: 100
    });
  })
  .then(postTransactResponse4 => {
    console.log(
      'postTransactResponse4 (to the Smart Contract)',
      postTransactResponse4
    );
    return getMine();
  })
  .then(getMineResponse3 => {
    console.log('getMineResponse3', getMineResponse3);

    return getAccountBalance();
  })
  .then(getAccountBalanceResponse => {
    console.log('getAccountBalanceResponse', getAccountBalanceResponse);

    return getAccountBalance({address: toAccountData.address});
  })
  .then((getAccountBalanceResponse2) => {
    console.log('getAccountBalanceResponse2', getAccountBalanceResponse2);
  });
