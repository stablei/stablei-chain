const crypto = require('crypto');

// ============================================
// STABLEI BLOCKCHAIN CORE v1.0
// QUANTUM SAFE - Built from scratch
// Founded by: Abhi | GitHub: stablei
// Encryption: SHA3-256 (Quantum Safe)
// Date: 2026
// ============================================

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  // SHA3-256 = Quantum Safe (unlike Bitcoin's SHA256)
  calculateHash() {
    return crypto
      .createHash('sha3-256')
      .update(
        this.index +
        this.timestamp +
        this.previousHash +
        this.nonce +
        JSON.stringify(this.data)
      )
      .digest('hex');
  }

  // Proof of Work mining
  mineBlock(difficulty) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')
    ) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
    console.log(`⛏️  Block mined! Hash: ${this.hash}`);
  }
}

class StableIChain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 2;
    this.pendingTransactions = [];
    this.miningReward = 50;
    console.log('');
    console.log('╔════════════════════════════════════╗');
    console.log('║     STABLEI BLOCKCHAIN STARTED     ║');
    console.log('║     Quantum Safe SHA3-256          ║');
    console.log('║     Founded by Abhi 🇮🇳            ║');
    console.log('╚════════════════════════════════════╝');
    console.log('');
  }

  createGenesisBlock() {
    const genesis = new Block(
      0,
      '2026-04-02T00:00:00.000Z',
      {
        message  : 'StableI Genesis Block',
        founder  : 'Abhi',
        github   : 'stablei',
        mainCoin : 'SI  - StableI Coin',
        stable1  : 'SIR - StableI Rupee (₹1 always)',
        stable2  : 'SID - StableI Dollar ($1 always)',
        standard : 'SI20 - Our token standard',
        security : 'SHA3-256 Quantum Safe',
        vision   : 'Your Money. Stable. Always.',
        tagline  : 'India ka apna blockchain 🇮🇳'
      },
      '0000000000000000000000000000000000000000'
    );
    return genesis;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(transaction) {
    this.pendingTransactions.push({
      ...transaction,
      timestamp: new Date().toISOString(),
      txId: crypto
        .createHash('sha3-256')
        .update(JSON.stringify(transaction) + Date.now())
        .digest('hex')
        .substring(0, 16)
    });
    console.log(`📝 Transaction added: ${transaction.type}`);
  }

  minePendingTransactions(minerAddress) {
    const block = new Block(
      this.chain.length,
      new Date().toISOString(),
      this.pendingTransactions,
      this.getLatestBlock().hash
    );

    console.log(`⛏️  Mining Block ${block.index}...`);
    block.mineBlock(this.difficulty);

    this.chain.push(block);
    this.pendingTransactions = [
      {
        type: 'MINING_REWARD',
        from: 'StableI Network',
        to: minerAddress,
        amount: this.miningReward,
        coin: 'SI'
      }
    ];
    console.log(`✅ Block ${block.index} successfully added!\n`);
  }

  getBalance(address) {
    let balance = 0;
    for (const block of this.chain) {
      if (!Array.isArray(block.data)) continue;
      for (const tx of block.data) {
        if (tx.from === address) balance -= tx.amount;
        if (tx.to   === address) balance += tx.amount;
      }
    }
    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current  = this.chain[i];
      const previous = this.chain[i - 1];
      if (current.hash !== current.calculateHash()) return false;
      if (current.previousHash !== previous.hash)   return false;
    }
    return true;
  }

  printChain() {
    console.log('\n══════════════════════════════════════');
    console.log('         STABLEI CHAIN EXPLORER       ');
    console.log('══════════════════════════════════════');
    this.chain.forEach(block => {
      console.log(`\nBlock #${block.index}`);
      console.log(`Time     : ${block.timestamp}`);
      console.log(`Hash     : ${block.hash.substring(0, 32)}...`);
      console.log(`PrevHash : ${block.previousHash.substring(0, 32)}...`);
      console.log(`Data     :`, JSON.stringify(block.data, null, 2));
    });
  }
}

// ============================================
// LAUNCH STABLEI BLOCKCHAIN
// ============================================

const StableI = new StableIChain();

// First Transactions
StableI.addTransaction({
  type   : 'GENESIS_TRANSFER',
  from   : 'Abhi',
  to     : 'World',
  amount : 1000000,
  coin   : 'SI',
  message: 'StableI is born! Revolution starts now 🇮🇳'
});

StableI.addTransaction({
  type   : 'MINT_SIR',
  from   : 'StableI Reserve',
  to     : 'Genesis Wallet',
  amount : 1000,
  coin   : 'SIR',
  pegged : '1 SIR = ₹1 always',
  message: 'First Indian Rupee Stablecoin ever!'
});

StableI.addTransaction({
  type   : 'MINT_SID',
  from   : 'StableI Reserve',
  to     : 'Genesis Wallet',
  amount : 1000,
  coin   : 'SID',
  pegged : '1 SID = $1 always',
  message: 'StableI Dollar launched!'
});

// Mine first block
StableI.minePendingTransactions('Abhi');

// Mine second block
StableI.addTransaction({
  type   : 'TRANSFER',
  from   : 'Genesis Wallet',
  to     : 'Early Adopter',
  amount : 100,
  coin   : 'SI',
  fee    : 0.1,
  message: 'First SI transfer on StableI Chain'
});

StableI.minePendingTransactions('Abhi');

// Print results
StableI.printChain();

console.log('\n══════════════════════════════════════');
console.log('CHAIN VALID    :', StableI.isChainValid());
console.log('TOTAL BLOCKS   :', StableI.chain.length);
console.log('ABHI BALANCE   :', StableI.getBalance('Abhi'), 'SI');
console.log('══════════════════════════════════════');
console.log('\n🚀 StableI Blockchain Running!');
console.log('🔒 Quantum Safe SHA3-256 Active!');
console.log('🇮🇳 India ka apna blockchain!\n');