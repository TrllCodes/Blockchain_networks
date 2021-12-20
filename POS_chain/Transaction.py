import uuid
import time
import copy


class Transaction():
    """docstring for Transaction."""

    def __init__(self, sender_public_key, receiver_public_key, amount, type):
        super(Transaction, self).__init__()
        self.sender_public_key = sender_public_key
        self.receiver_public_key = receiver_public_key
        self.amount = amount
        self.type = type
        self.id = uuid.uuid4().hex
        self.timestamp = time.time_ns()
        self.signature = ''

    def to_json(self):
        return self.__dict__

    def sign(self, signature):
        self.signature = signature

    def payload(self):
        json_representation = copy.deepcopy(self.to_json())
        json_representation['signature'] = ''
        return json_representation

    def equals(self, transaction):
        """
        Checks to see if a transaction is the same as another transaction,
        preventing the double spending problem from happening.
        """
        if self.id == transaction.id:
            return True
        else:
            return False
