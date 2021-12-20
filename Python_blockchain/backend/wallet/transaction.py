import time
import uuid

from backend.wallet.wallet import Wallet
from backend.config import MINING_REWARD, MINING_REWARD_INPUT

class Transaction:
    """
    This class will serve to document an exchange in currency from a sender to
    one or more recipients.
    - It is comprised of an initialization function, an output creation method,
    an input creation method and an update method for wallet owners who perform
    multiple transactions in rapid succession.
    """
    def __init__(
        self,
        sender_wallet=None,
        recipient=None,
        amount=None,
        id=None,
        output=None,
        input=None
    ):
        super(Transaction, self).__init__()
        self.id = id or str(uuid.uuid4())[:8]
        self.output = output or self.create_output(
            sender_wallet,
            recipient,
            amount
        )
        self.input = input or self.create_input(sender_wallet, self.output)

    def create_output(self, sender_wallet, recipient, amount):
        """
        This Transaction class method structures the output data for the transaction.
        First, it checks to make sure that the senders wallet has enough currency
        to complete the transaction. Then it creates an empty output dictionary,
        places the 'amount' value in the 'recipient' key, and sends the "change"
        back to the original sender's wallet address.
        """
        if amount > sender_wallet.balance:
            raise Exception('Amount exceeds wallet balance')

        output = {}
        output[recipient] = amount
        output[sender_wallet.address] = sender_wallet.balance - amount

        return output
    def create_input(self, sender_wallet, output):
        """
        This Transaction class method structures the input data for the transaction.
        - It also signs the transaction and includes the sender's public key
        and address, which will allow other wallet holders in the network to
        verify new transaction signatures by using the public key as an input.
        - It returns a dictionary object containing the timestamp of the
        transaction, the amount being sent, the sender's wallet address, the
        public key of the blockchain network, and the signature created by the
        private key of the sender's wallet.
        """
        return {
            'timestamp': time.time_ns(),
            'amount': sender_wallet.balance,
            'address': sender_wallet.address,
            'public_key': sender_wallet.public_key,
            'signature': sender_wallet.sign(output)
        }

    def update(self, sender_wallet, recipient, amount):
        """
        This Transaction class method will update the transaction with an
        existing or new recipient.
        - First it checks to make sure that there is enough currency in the
        sender's wallet to complete a new transaction, if there isn't, it raises
        an exception.
        - Then it runs a check to see if the recipient will remain the same or
        if there is a different recipient for the new transaction.
        - If the recipient remains the same, then it adds the new amount to the
        recipient listed in the self.output key of the output dictionary.
        - Otherwise, it will send the new amount to a new recipient in the
        output dictionary.
        - Afterwards, it creates the "change" by subtracting the amount sent to
        the recipient from the sender's wallet address.
        - Finally, it creates a new input dictionary using the create_input
        function with the sender_wallet and the self.output (with its replaced
        parameters) as function variables.
        """
        if amount > self.output[sender_wallet.address]:
            raise Exception('Amount exceeds wallet balance')

        if recipient in self.output:
            self.output[recipient] = self.output[recipient] + amount
        else:
            self.output[recipient] = amount

        self.output[sender_wallet.address] = \
            self.output[sender_wallet.address] - amount

        self.input = self.create_input(sender_wallet, self.output)

    def to_json(self):
        """
        This Transaction class method will serialize the transaction so that web
        APIs can more eaily parse the transaction data. It simply takes the
        Transaction object and returns it as a dictionary.
        """
        return self.__dict__

    @staticmethod
    def from_json(transaction_json):
        """
        This Transaction class method will deserialize a transaction's json back
        into a Transaction instance.
        """
        return Transaction(**transaction_json)


    @staticmethod
    def is_valid_transaction(transaction):
        """
        This Transaction class method validates transactions.
        - It will raise an exception for invalid transactions.
        - First, an output_value is created by summing together all of the
        values from the transaction output.
        - Then it performs a check to make sure that the sender's wallet balance
        at the time of the transaction is equal to the output total.
        - Lastly, it performs a check to make sure that the Wallet.verify()
        function for the given data returns True, otherwise it raises an
        exception.
        """
        if transaction.input == MINING_REWARD_INPUT:
            if list(transaction.output.values()) != [MINING_REWARD]:
                raise Exception('Invalid mining reward')
            return

        output_total = sum(transaction.output.values())

        if transaction.input['amount'] != output_total:
            raise Exception('Invalid transaction output values')

        if not Wallet.verify(
            transaction.input['public_key'],
            transaction.output,
            transaction.input['signature']
        ):
            raise Exception('Invalid signature')

    @staticmethod
    def reward_transaction(miner_wallet):
        """
        This Transaction class static method generates a reward transaction that
        awards miners for mining new blocks.
        """
        output = {}
        output[miner_wallet.address] = MINING_REWARD

        return Transaction(input=MINING_REWARD_INPUT, output=output)

def main():
    transaction = Transaction(Wallet(), 'recipient', 15)
    print(f'transaction.__dict__: {transaction.__dict__}')

    transaction_json = transaction.to_json()
    restored_transaction = Transaction.from_json(transaction_json)
    print(f'restored_transaction.__dict__: {restored_transaction.__dict__}')
if __name__ == '__main__':
    main()
