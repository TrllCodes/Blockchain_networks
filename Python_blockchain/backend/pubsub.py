import time

from pubnub.pubnub import PubNub
from pubnub.pnconfiguration import PNConfiguration
from pubnub.callbacks import SubscribeCallback

from backend.blockchain.block import Block
from backend.wallet.transaction import Transaction

pnconfig = PNConfiguration()
pnconfig.subscribe_key = 'sub-c-5e7c720e-4fd0-11ec-b60b-aa41d66f579f'
pnconfig.publish_key = 'pub-c-fddf9692-43dd-4e9c-a129-39a5b83b25f5'

CHANNELS = {
    'TEST': 'TEST',
    'BLOCK': 'BLOCK',
    'TRANSACTION': 'TRANSACTION'
}

class Listener(SubscribeCallback):
    def __init__(self, blockchain, transaction_pool):
        self.blockchain = blockchain
        self.transaction_pool = transaction_pool

    def message(self, pubnub, message_object):
        print(f'\n-- Channel: {message_object.channel} | Message: {message_object.message}')

        if message_object.channel == CHANNELS['BLOCK']:
            block = Block.from_json(message_object.message)
            potential_chain = self.blockchain.chain[:]
            potential_chain.append(block)

            try:
                self.blockchain.replace_chain(potential_chain)
                self.transaction_pool.clear_blockchain_transactions(
                    self.blockchain
                )
                print('\n -- The local chain has been successfully updated and replaced!')
            except Exception as e:
                print(f'\n -- Did not replace chain: {e}')
        elif message_object.channel == CHANNELS['TRANSACTION']:
            transaction = Transaction.from_json(message_object.message)
            self.transaction_pool.set_transaction(transaction)
            print('\n -- Set the new transaction into the transaction pool')

class PubSub():
    """
    This class handles the publish/subscribe layer of the application.
    It also provides communication between the nodes of the blockchain network.
    """
    def __init__(self, blockchain, transaction_pool):
        super(PubSub, self).__init__()
        self.pubnub = PubNub(pnconfig)
        self.pubnub.subscribe().channels(CHANNELS.values()).execute()
        self.pubnub.add_listener(Listener(blockchain, transaction_pool))

    def publish(self, channel, message):
        """
        This method will take care of publishing messages to the channel.
        """
        self.pubnub.publish().channel(channel).message(message).sync()

    def broadcast_block(self, block):
        """
        This method will broadcast a block object to all nodes in the network.
        """
        self.publish(CHANNELS['BLOCK'], block.to_json())

    def broadcast_transaction(self, transaction):
        """
        This PubSub class method will broadcast a transaction to all nodes in
        the network.
        """
        self.publish(CHANNELS['TRANSACTION'], transaction.to_json())

def main():
    pubsub = PubSub()

    time.sleep(1)

    pubsub.publish(CHANNELS['TEST'], { 'foo': 'bar'})

if __name__ == '__main__':
    main()
