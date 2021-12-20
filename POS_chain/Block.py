import time
import copy


class Block():

    def __init__(self, transactions, last_hash, forger, block_number):
        super(Block, self).__init__()
        self.transactions = transactions
        self.last_hash = last_hash
        self.forger = forger
        self.block_number = block_number
        self.timestamp = time.time_ns()
        self.signature = ''

    @staticmethod
    def genesis():
        genesis_block = Block([], 'genesis_hash', 'genesis_forger', 0)
        genesis_block.timestamp = 0
        return genesis_block

    def to_json(self):
        data = {}

        data['last_hash'] = self.last_hash
        data['forger'] = self.forger
        data['block_number'] = self.block_number
        data['timestamp'] = self.timestamp
        data['signature'] = self.signature
        json_transactions = []
        for transaction in self.transactions:
            json_transactions.append(transaction.to_json())
        data['transactions'] = json_transactions
        return data

    def payload(self):
        json_representation = copy.deepcopy(self.to_json())
        json_representation['signature'] = ''
        return json_representation

    def sign(self, signature):
        self.signature = signature
