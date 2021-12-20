from Transaction import Transaction
from Wallet import Wallet
from TransactionPool import TransactionPool
from Block import Block
from Blockchain import Blockchain
from Utils import BlockchainUtils
from Account import Account
from Node import Node
import pprint
import sys


if __name__ == '__main__':

    ip = sys.argv[1]
    port = int(sys.argv[2])
    api_port = int(sys.argv[3])

    node = Node(ip, port)
    node.start_p2p()
    node.start_api(api_port)
