

class SocketConnector():
    """docstring for SocketConnector."""

    def __init__(self, ip, port):
        super(SocketConnector, self).__init__()
        self.ip = ip
        self.port = port

    def equals(self, connector):
        if connector.ip == self.ip and connector.port == self.port:
            return True
        else:
            return False
