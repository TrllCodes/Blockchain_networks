

class TransactionPool():
    """
    The transaction pool serves as a placeholder for proposed transactions
    before they are added to any newly mined blocks in the blockchain.
    """

    def __init__(self):
        super(TransactionPool, self).__init__()
        self.transactions = []

    def add_transaction(self, transaction):
        """
        Adds a new transaction to the transaction pool list.

        Params:
        transaction - The proposed transaction to be added to the transaction
        pool.

        Returns: It appends the proposed transaction to the transaction pool.
        """
        self.transactions.append(transaction)

    def transaction_exists(self, transaction):
        """
        Ensures that the proposed transaction does not already exist in the
        blockchain or in the transaction pool.

        Params:
        transaction - The proposed transaction to be added to the transaction
        pool.

        Returns: A boolean verifying whether or not the proposed transaction
        already exists.
        """
        for pool_transaction in self.transactions:
            if pool_transaction.equals(transaction):
                return True
        return False

    def remove_from_pool(self, transactions):
        new_pool_transactions = []

        for pool_transaction in self.transactions:
            insert = True
            for transaction in transactions:
                if pool_transaction.equals(transaction):
                    insert = False
            if insert:
                new_pool_transactions.append(pool_transaction)
        self.transactions = new_pool_transactions
