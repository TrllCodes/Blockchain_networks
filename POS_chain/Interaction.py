from Wallet import Wallet
from Utils import BlockchainUtils
import requests

URL_BASE = 'http://localhost:5000'

if __name__ == '__main__':
    bob = Wallet()
    alice = Wallet()
    exchange = Wallet()

    transaction = exchange.create_transaction(
        alice.public_key_string(), 10, 'EXCHANGE')

    url = f'{URL_BASE}/transaction'
    package = {'transaction': BlockchainUtils.encode(transaction)}
    request = requests.post(url, json=package)
    print(request.text)
