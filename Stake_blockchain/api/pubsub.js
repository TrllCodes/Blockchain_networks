/**
 * Package dependencies
 */
const PubNub = require('pubnub');
const Transaction = require('../transaction');


/**
 * Local dependencies
 */
const credentials = {
  publishKey: "pub-c-b9f3f4dd-1828-404a-92a2-ea9b430e9b3c",
  subscribeKey: "sub-c-e465ab84-579f-11ec-b00e-6a3ab292cab1",
  secretKey: "sec-c-YjdkMWZiNmYtZjhlYi00YjFlLWI5MGMtMWU2OWVlMzYxZjBm"
};
const CHANNELS_MAP = {
  TEST: 'TEST',
  BLOCK: 'BLOCK',
  TRANSACTION: 'TRANSACTION'
};

class PubSub {
  constructor({blockchain, transactionQueue}) {
    this.pubnub = new PubNub(credentials);
    this.blockchain = blockchain;
    this.transactionQueue = transactionQueue;
    this.subscribeToChannels();
    this.listen();
  }
  // Create the channel subscriptiion function.
  subscribeToChannels() {
    this.pubnub.subscribe({
      channels: Object.values(CHANNELS_MAP)
    });
  }
  // Publish the message/change-in-state to all nodes in the network
  publish({channel, message}) {
    this.pubnub.publish({channel, message});
  }

  listen() {
    this.pubnub.addListener({
      message: messageObject => {
        const {channel, message} = messageObject;
        const parsedMessage = JSON.parse(message);

        console.log('Message received. Channel:', channel);

        switch (channel) {
          // This code is executed when the incoming message is coming on the 'BLOCK' channel.
          case CHANNELS_MAP.BLOCK:
            console.log('block message', message);
            
            this.blockchain.addBlock({
              block: parsedMessage,
              transactionQueue: this.transactionQueue
            }).then(() => console.log('New block accepted', parsedMessage))
              .catch(error => console.error('New block rejected', error.message));
            break;
          case CHANNELS_MAP.TRANSACTION:
            console.log(`Received transaction: ${parsedMessage.id}`);
            // Add each new transaction to the transaction queue
            this.transactionQueue.add(new Transaction(parsedMessage));

            break;
          default:
            return;
        }
      }
    });
  }

  broadcastBlock(block) {
    this.publish({
      channel: CHANNELS_MAP.BLOCK,
      // The stringify method is used below b/c pubnub only accepts strings as messages.
      message: JSON.stringify(block)
    });
  }

  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS_MAP.TRANSACTION,
      message: JSON.stringify(transaction)
    })
  }
}

module.exports = PubSub;
