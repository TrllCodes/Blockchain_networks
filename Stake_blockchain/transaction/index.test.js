/**
 * Package dependencies
 */
const Transaction = require('./index');
const Account = require('../account');
const State = require('../store/state');

/**
 * Transaction Class tests
 */
describe('Transaction', () => {
  // Assign all relevant testing var
  let account;
  let standardTransaction;
  let createAccountTransaction;
  let state;
  let toAccount;
  let miningRewardTransaction;

  // Create test conditions before each test iteration
  beforeEach(() => {
    // Instantiate a new Account object
    account = new Account();
    // Instantiate a new "to" Account object
    toAccount = new Account();
    // Instantiate a new State object
    state = new State();
    //Place the new accounts into the State object
    state.putAccount({address: account.address, accountData: account});
    state.putAccount({address: toAccount.address, accountData: toAccount});
    // Instantiate a new Transaction object
    standardTransaction = Transaction.createTransaction({
      account,
      to: toAccount.address,
      value: 50,
    });
    // Instantiate a new createTransaction object
    createAccountTransaction = Transaction.createTransaction({
      account
    });
    // Instantiate a new miningRewardTransaction object
    miningRewardTransaction = Transaction.createTransaction({
      beneficiary: account.address
    })
  });

  /**
   * validateStandardTransaction Test
   */
  describe('validateStandardTransaction()', () => {
    // Expected behavior if transaction is valid
    it('validates a valid transaction', () => {
      expect(Transaction.validateStandardTransaction({
        transaction: standardTransaction,
        state
      })).resolves;
    });
    // Expected behavior if transaction is invalid
    it('does not validate a malformed transaction', () => {
      // Insert malevolent recipient
      standardTransaction.to = 'different-recipient';

      expect(Transaction.validateStandardTransaction({
        transaction: standardTransaction,
        state
      })).rejects.toMatchObject({message: /invalid/});
    });

    it('does not validate when transaction value exceeds account balance', () => {
      standardTransaction = Transaction.createTransaction({
        account,
        to: toAccount.address,
        value: 9001
      });

      expect(Transaction.validateStandardTransaction({
        transaction: standardTransaction,
        state
      })).rejects.toMatchObject({message: /exceeds/});
    });

    it('does not validate when the `to` address does not exist', () => {
      standardTransaction = Transaction.createTransaction({
        account,
        to: 'foo-recipient',
        value: 50
      });

      expect(Transaction.validateStandardTransaction({
        transaction: standardTransaction,
        state
      })).rejects.toMatchObject({message: /does not exist/});
    });

    it('does not validate when the gasLimit exceeds the balance', () => {
      standardTransaction = Transaction.createTransaction({
        account,
        to: 'foo-recipient',
        gasLimit: 9001
      });

      expect(Transaction.validateStandardTransaction({
        transaction: standardTransaction,
        state
      })).rejects.toMatchObject({message: /exceeds/});
    });

    it('does not validate when the gasUsed for the code exceeds the gasLimit', () => {
      const codeHash = 'foo-codeHash';
      const code = ['PUSH', 1, 'PUSH', 2, 'ADD', 'STOP'];

      state.putAccount({
        address: codeHash,
        accountData: {code, codeHash}
      });

      standardTransaction = Transaction.createTransaction({
        account,
        to: codeHash,
        gasLimit: 0
      });

      expect(Transaction.validateStandardTransaction({
        transaction: standardTransaction,
        state
      })).rejects.toMatchObject({message: /Transaction needs more gas/});
    });
  });

  /**
   * validateCreateAccountTransaction Test
   */
  describe('validateCreateAccountTransaction', () => {
    // Expected behavior if createAccountTransaction is valid
    it('validates a CreateAccount transaction', () => {
      expect(Transaction.validateCreateAccountTransaction({
        transaction: createAccountTransaction
      })).resolves;
    });
    // Test invalid createAccountTransaction w/ incorrect number of fields
    it('does not validate a non-CreateAccount transaction', () => {
      expect(Transaction.validateCreateAccountTransaction({
        transaction: standardTransaction
      })).rejects.toMatchObject({message: /incorrect/});
    });

    // Test invalid createAccountTransaction w/ unexpected field(s)
    // it('does not validate a non-CreateAccount transaction', () => {
    //   expect(Transaction.validateCreateAccountTransaction({
    //     transaction: standardTransaction
    //   })).rejects.toMatchObject({message: /invalid/});
    // });
  });

  describe('validateMiningRewardTransaction()', () => {

    it('validates a mining reward transaction', () => {
      expect(Transaction.validateMiningRewardTransaction({
        transaction: miningRewardTransaction
      })).resolves;
    });

    it('does not validate a tampered-with mining reward transaction', () => {
      miningRewardTransaction.value = 9001;

      expect(Transaction.validateMiningRewardTransaction({
        transaction: miningRewardTransaction
      })).rejects.toMatchObject({message: /does not equal the official/});
    });
  });
});
