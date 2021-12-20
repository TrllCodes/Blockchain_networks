

class Account():
    """The individual account for each node/user wihtin the blockchain network.
    It keeps track of their token balance as well as allows them to execute
    transactions.

    Attributes
    ----------
    arg

    """

    def __init__(self):
        super(Account, self).__init__()
        self.accounts = []
        self.balances = {}

    def add_acount(self, public_key_string):
        if public_key_string not in self.accounts:
            self.accounts.append(public_key_string)
            self.balances[public_key_string] = 0

    def get_balance(self, public_key_string):
        if public_key_string not in self.accounts:
            self.add_acount(public_key_string)
        return self.balances[public_key_string]

    def update_balance(self, public_key_string, amount):
        if public_key_string not in self.accounts:
            self.add_acount(public_key_string)
        self.balances[public_key_string] += amount
