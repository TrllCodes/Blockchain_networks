import threading
import time
from Message import Message
from Utils import BlockchainUtils


class PeerDiscoveryHandler():

    def __init__(self, node):
        super(PeerDiscoveryHandler, self).__init__()
        self.socket_communication = node

    def start(self):
        status_thread = threading.Thread(target=self.status, args=())
        status_thread.start()
        discovery_thread = threading.Thread(target=self.discovery, args=())
        discovery_thread.start()

    def status(self):
        while True:
            print('Current connections: ')
            for peer in self.socket_communication.peers:
                print(str(peer.ip) + ':' + str(peer.port))
            time.sleep(10)

    def discovery(self):
        while True:
            handshake_message = self.handshake_message()
            self.socket_communication.broadcast(handshake_message)
            time.sleep(10)

    def handshake(self, connect_node):
        handshake_message = self.handshake_message()
        self.socket_communication.send(connect_node, handshake_message)

    def handshake_message(self):
        own_connector = self.socket_communication.socket_connector
        own_peers = self.socket_communication.peers
        data = own_peers
        message_type = 'DISCOVERY'
        message = Message(own_connector, message_type, data)
        encoded_message = BlockchainUtils.encode(message)
        return encoded_message

    def handle_message(self, message):
        peer_socket_connector = message.sender_connector
        peers_peer_list = message.data
        new_peer = True
        for peer in self.socket_communication.peers:
            if peer.equals(peer_socket_connector):
                new_peer = False
        if new_peer:
            self.socket_communication.peers.append(peer_socket_connector)

        for peers_peer in peers_peer_list:
            peer_known = False
            for peer in self.socket_communication.peers:
                if peer.equals(peers_peer):
                    peer_known = True
            if not peer_known and not peers_peer.equals(
                    self.socket_communication.socket_connector):
                self.socket_communication.connect_with_node(
                    peers_peer.ip, peers_peer.port)
