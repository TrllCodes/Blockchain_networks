from backend.blockchain.block import Block
from backend.wallet.transaction import Transaction
from backend.wallet.wallet import Wallet
from backend.config import MINING_REWARD_INPUT

class Blockchain(object):
    """
    The Blockchain will be a public ledger of transactions. It will be
    implemented as a list of blocks, which are data sets of transactions.
    """
    def __init__(self, ):
        super(Blockchain, self).__init__()
        self.chain = [Block.genesis()]

    def add_block(self, data):
        self.chain.append(Block.mine_block(self.chain[-1], data))

    def __repr__(self):
        return f'Blockchain: {self.chain}'

    def replace_chain(self, chain):
        """
        This Blockchain class method replaces the local chain with a new
        incoming chain if the following applies:
        - The incoming chain must be longer than the local one.
        - The incoming chain is formatted properly.
        """
        if len(chain) <= len(self.chain):
            raise Exception('Cannot replace. The incoming chain must be longer.')
        try:
            Blockchain.is_valid_chain(chain)
        except Exception as e:
            raise Exception(f'Cannot replace. The incoming chain is invalid: {e}')

        self.chain = chain

    def to_json(self):
        """
        This Blockchain class method serializes the blockchain into a list of
        blocks so that Flask's JSONify method can effectively create a JSON
        from the existing blockchain data.
        """
        return list(map(lambda block: block.to_json(), self.chain))
        # serialized_chain = []
        #
        # for block in self.chain:
        #     serialized_chain.append(block.to_json())
        #
        # return serialized_chain

    @staticmethod
    def from_json(chain_json):
        """
        This static method deserializes the list of serialized blocks into a
        Blockchain instance. The result will contain a chain list of Block
        instances.
        """
        blockchain = Blockchain()
        blockchain.chain = list(
            map(lambda block_json: Block.from_json(block_json), chain_json)
        )

        return blockchain

    @staticmethod
    def is_valid_chain(chain):
        """
        This static method validates the incoming chain.
        It should enforce the following rules of the blockchain:
        - The chain must start with the genesis block.
        - Blocks must be formatted correctly.
        """
        if chain[0] != Block.genesis():
            raise Exception('The genesis block must be valid.')

        for i in range(1, len(chain)):
            block = chain[i]
            last_block = chain[i-1]
            Block.is_valid_block(last_block, block)

        Blockchain.is_valid_transaction_chain(chain)

    @staticmethod
    def is_valid_transaction_chain(chain):
        """
        This static method enforces the rules of a chain composed of blocks of
        transactions. The rules are as follows:
            - Each transaction must only appear once in the chain.
            - There can only be 1(one) mining reward per block.
            - Each transaction must be valid.
        """
        transaction_ids = set()

        for i in range(len(chain)):
            block = chain[i]
            has_mining_reward = False

            for transaction_json in block.data:
                transaction = Transaction.from_json(transaction_json)
                # Enforces the 1 transaction id per chain parameter
                if transaction.id in transaction_ids:
                    raise Exception(f'Transaction {transaction.id} is not unique')
                transaction_ids.add(transaction.id)
                # Enforces the mining reward parameter
                if transaction.input == MINING_REWARD_INPUT:
                    if has_mining_reward:
                        raise Exception(
                            'There can only be one mining reward per block. '\
                            f'Check block with hash: {block.hash}'
                        )

                    has_mining_reward = True
                else:
                    historic_blockchain = Blockchain()
                    historic_blockchain.chain = chain[:i]
                    historic_balance = Wallet.calculate_balance(
                        historic_blockchain,
                        transaction.input['address']
                    )
                    if historic_balance != transaction.input['amount']:
                        raise Exception(
                            f'Transaction {transaction.id} has an '\
                            'invalid input amount'
                        )
                # Enforces the valid transaction parameter
                Transaction.is_valid_transaction(transaction)
def main():
    blockchain = Blockchain()
    blockchain.add_block('one')
    blockchain.add_block('two')

    print(blockchain)
    print(f'blockchain.py __name__: {__name__}')
if __name__ == '__main__':
    main()
