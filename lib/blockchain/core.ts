import crypto from 'crypto';

// Types
export interface Transaction {
  id: string;
  type: 'CREATE_MEDICINE' | 'VERIFY_MEDICINE' | 'TRANSFER_MEDICINE' | 'REGISTER_USER';
  data: any;
  timestamp: number;
  signature: string;
}

export interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  merkleRoot: string;
}

export interface BlockchainState {
  chain: Block[];
  pendingTransactions: Transaction[];
  difficulty: number;
  miningReward: number;
  totalTransactions: number;
}

class LocalBlockchain {
  private chain: Block[];
  private pendingTransactions: Transaction[];
  private difficulty: number;
  private miningReward: number;
  private isMining: boolean;
  private totalTransactions: number;

  constructor() {
    this.chain = [];
    this.pendingTransactions = [];
    this.difficulty = 4; // Number of leading zeros required
    this.miningReward = 100;
    this.isMining = false;
    this.totalTransactions = 0;

    // Initialize with genesis block
    this.createGenesisBlock();
    
    // Load saved state if exists
    this.loadState();
  }

  // Create genesis block
  private createGenesisBlock(): void {
    const genesisBlock: Block = {
      index: 0,
      timestamp: Date.now(),
      transactions: [],
      previousHash: '0',
      hash: '',
      nonce: 0,
      merkleRoot: this.calculateMerkleRoot([])
    };
    genesisBlock.hash = this.calculateHash(genesisBlock);
    this.chain.push(genesisBlock);
    this.saveState();
  }

  // Calculate SHA-256 hash
  private calculateHash(block: Block): string {
    const data = block.index + block.timestamp + JSON.stringify(block.transactions) + 
                 block.previousHash + block.nonce + block.merkleRoot;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Calculate Merkle Root
  private calculateMerkleRoot(transactions: Transaction[]): string {
    if (transactions.length === 0) {
      return crypto.createHash('sha256').update('empty').digest('hex');
    }
    // Simple implementation - hash all transaction IDs together
    const txHashes = transactions.map(tx => tx.id).join('');
    return crypto.createHash('sha256').update(txHashes).digest('hex');
  }

  // Mine a block (Proof of Work)
  private mineBlock(block: Block): string {
    let hash = this.calculateHash(block);
    while (hash.substring(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
      block.nonce++;
      hash = this.calculateHash(block);
    }
    return hash;
  }

  private getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  // Create a new transaction
  createTransaction(transaction: Omit<Transaction, 'id' | 'timestamp' | 'signature'>): Transaction {
    const newTransaction: Transaction = {
      id: crypto.randomBytes(16).toString('hex'),
      type: transaction.type,
      data: transaction.data,
      timestamp: Date.now(),
      signature: this.signTransaction(transaction.data)
    };

    this.pendingTransactions.push(newTransaction);
    this.saveState();
    return newTransaction;
  }

  // Sign transaction
  private signTransaction(data: any): string {
    const message = JSON.stringify(data) + Date.now();
    return crypto.createHash('sha256').update(message + 'pharmachain-secret-key').digest('hex');
  }

  // Mine pending transactions
  async minePendingTransactions(): Promise<Block> {
    if (this.isMining) {
      throw new Error('Already mining');
    }

    if (this.pendingTransactions.length === 0) {
      throw new Error('No pending transactions to mine');
    }

    this.isMining = true;

    try {
      const block: Block = {
        index: this.chain.length,
        timestamp: Date.now(),
        transactions: [...this.pendingTransactions],
        previousHash: this.getLatestBlock().hash,
        nonce: 0,
        hash: '',
        merkleRoot: this.calculateMerkleRoot(this.pendingTransactions)
      };

      // Proof of Work
      block.hash = this.mineBlock(block);
      
      // Add block to chain
      this.chain.push(block);
      this.totalTransactions += block.transactions.length;
      
      // Clear pending transactions
      this.pendingTransactions = [];
      
      // Save state
      this.saveState();
      
      this.isMining = false;
      return block;
    } catch (error) {
      this.isMining = false;
      throw error;
    }
  }

  // Get transaction by ID
  getTransaction(txId: string): Transaction | null {
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.id === txId) {
          return tx;
        }
      }
    }
    return this.pendingTransactions.find(tx => tx.id === txId) || null;
  }

  // Get block by index
  getBlock(index: number): Block | null {
    return this.chain[index] || null;
  }

  // Get all transactions for a medicine
  getMedicineTransactions(batchNo: string): Transaction[] {
    const transactions: Transaction[] = [];
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.data.batchNo === batchNo || tx.data.batch_no === batchNo) {
          transactions.push(tx);
        }
      }
    }
    return transactions;
  }

  // Get blockchain info
  getBlockchainInfo() {
    return {
      chainLength: this.chain.length,
      totalTransactions: this.totalTransactions,
      pendingTransactions: this.pendingTransactions.length,
      difficulty: this.difficulty,
      miningReward: this.miningReward,
      isMining: this.isMining,
      lastBlock: this.getLatestBlock(),
      isValid: this.validateChain()
    };
  }

  // Validate blockchain integrity
  validateChain(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Check previous hash
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      // Check hash validity
      const hash = this.calculateHash(currentBlock);
      if (hash !== currentBlock.hash) {
        return false;
      }

      // Check difficulty
      if (hash.substring(0, this.difficulty) !== '0'.repeat(this.difficulty)) {
        return false;
      }

      // Check merkle root
      const merkleRoot = this.calculateMerkleRoot(currentBlock.transactions);
      if (merkleRoot !== currentBlock.merkleRoot) {
        return false;
      }
    }
    return true;
  }

  // Get chain for explorer
  getChain(limit: number = 100): Block[] {
    return this.chain.slice(-limit);
  }

  // Save blockchain state to file
  private saveState(): void {
    if (typeof window !== 'undefined') {
      // Browser - save to localStorage
      try {
        const state: BlockchainState = {
          chain: this.chain,
          pendingTransactions: this.pendingTransactions,
          difficulty: this.difficulty,
          miningReward: this.miningReward,
          totalTransactions: this.totalTransactions
        };
        localStorage.setItem('blockchainState', JSON.stringify(state));
      } catch (error) {
        console.error('Error saving blockchain state:', error);
      }
    } else {
      // Server - save to file (implement if needed)
    }
  }

  // Load blockchain state
  private loadState(): void {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('blockchainState');
        if (saved) {
          const state: BlockchainState = JSON.parse(saved);
          this.chain = state.chain;
          this.pendingTransactions = state.pendingTransactions;
          this.difficulty = state.difficulty;
          this.miningReward = state.miningReward;
          this.totalTransactions = state.totalTransactions || 0;
          console.log(`✅ Blockchain loaded: ${this.chain.length} blocks, ${this.totalTransactions} transactions`);
        }
      } catch (error) {
        console.error('Error loading blockchain state:', error);
      }
    }
  }

  // Reset blockchain
  resetChain(): void {
    this.chain = [];
    this.pendingTransactions = [];
    this.totalTransactions = 0;
    this.createGenesisBlock();
    this.saveState();
    console.log('🔄 Blockchain reset to genesis block');
  }

  // Get pending transactions count
  getPendingCount(): number {
    return this.pendingTransactions.length;
  }

  // Get total blocks
  getTotalBlocks(): number {
    return this.chain.length;
  }
}

// Singleton instance
let blockchainInstance: LocalBlockchain | null = null;

export function getBlockchain(): LocalBlockchain {
  if (!blockchainInstance) {
    blockchainInstance = new LocalBlockchain();
  }
  return blockchainInstance;
}

export default LocalBlockchain;