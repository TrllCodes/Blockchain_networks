from Crypto.PublicKey import RSA
from Crypto.Signature import PKCS1_v1_5
from Utils import BlockchainUtils
from Transaction import Transaction
from Block import Block


class Wallet():
    """
    This class serves as the private point of access for nodes on the
    blockchain. It generates a signature that validates Transactions.

    Functions:
        sign(self, data)
            Returns a hexadecimal signature of given data.
    """

    def __init__(self):
        self.key_pair = RSA.generate(2048)

    def sign(self, data):
        """
        Signs a transaction on the behalf of the sender using a hash of the
        transaction data, combined with the public and private key pair of the
        sender's wallet address.

        Params:
        data - The data from the attempted transaction.

        Returns: A hexadecimal signature object.
        """
        data_hash = BlockchainUtils.hash(data)
        signature_scheme_object = PKCS1_v1_5.new(self.key_pair)
        signature = signature_scheme_object.sign(data_hash)
        return signature.hex()

    @staticmethod
    def signature_valid(data, signature, public_key_string):
        """
        Verifies the transaction signature provided by the sender.

        Params:
        data - the provided transaction data.
        signature - the sender's private key signature.
        public_key_string - the public key.

        Returns: A boolean verifying the validity of the sender's signature.
        """
        signature = bytes.fromhex(signature)
        data_hash = BlockchainUtils.hash(data)
        public_key = RSA.importKey(public_key_string)
        signature_scheme_object = PKCS1_v1_5.new(public_key)
        signature_valid = signature_scheme_object.verify(data_hash, signature)
        return signature_valid

    def public_key_string(self):
        public_key_string = self.key_pair.public_key().exportKey(
            'PEM').decode('utf-8')
        return public_key_string

    def create_transaction(self, receiver, amount, type):
        transaction = Transaction(
            self.public_key_string(), receiver, amount, type)
        signature = self.sign(transaction.payload())
        transaction.sign(signature)
        return transaction

    def create_block(self, transactions, last_hash, block_number):
        block = Block(transactions, last_hash,
                      self.public_key_string(), block_number)
        signature = self.sign(block.payload())
        block.sign(signature)
        return block
