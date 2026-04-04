const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');

// ============================================
// STABLEI BLOCKCHAIN SERVER v1.0
// Real Backend - Production Ready
// Founded by: Abhi | GitHub: stablei
// ============================================

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// ============================================
// DATABASE (In Memory - Real for now)
// ============================================

let wallets = {};
let transactions = [];
let blocks = [];
let pendingTransactions = [];

// ============================================
// STABLEI BLOCKCHAIN CORE
// ============================================

function createHash(data) {
  return crypto
    .createHash('sha3-256')
    .update(JSON.stringify(data))
    .digest('hex');
}

function createGenesisBlock() {
  const genesis = {
    index: 0,
    timestamp: '2026-04-02T00:00:00.000Z',
    transactions: [],
    previousHash: '0000000000000000',
    hash: '',
    miner: 'Abhi',
    data: {
      message: 'StableI Genesis Block',
      founder: 'Abhi',
      coins: ['SI', 'SIR', 'SID'],
      security: 'SHA3-256 Quantum Safe',
      vision: 'Your Money. Stable. Always.'
    }
  };
  genesis.hash = createHash(genesis);
  return genesis;
}

// Initialize blockchain
blocks.push(createGenesisBlock());

// Create founder wallet
const founderWallet = {
  address: '0xSIABHIFOUNDER000000000000000000000',
  name: 'Abhi - Founder',
  balance: { SI: 1000000, SIR: 100000, SID: 10000 },
  createdAt: new Date().toISOString()
};
wallets[founderWallet.address] = founderWallet;

// ============================================
// MINING
// ============================================

function mineBlock() {
  if (pendingTransactions.length === 0) return null;

  const block = {
    index: blocks.length,
    timestamp: new Date().toISOString(),
    transactions: [...pendingTransactions],
    previousHash: blocks[blocks.length - 1].hash,
    hash: '',
    miner: 'StableI Network'
  };

  block.hash = createHash(block);
  blocks.push(block);
  pendingTransactions = [];

  console.log(`⛏️  Block #${block.index} mined!`);
  return block;
}

// Auto mine every 30 seconds
setInterval(() => {
  if (pendingTransactions.length > 0) {
    const block = mineBlock();
    if (block) {
      console.log(`✅ Block #${block.index} added with ${block.transactions.length} transactions`);
    }
  }
}, 30000);

// ============================================
// API ROUTES
// ============================================

// Health check
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    name: 'StableI Chain',
    blocks: blocks.length,
    transactions: transactions.length,
    wallets: Object.keys(wallets).length,
    pending: pendingTransactions.length,
    security: 'SHA3-256 Quantum Safe',
    founder: 'Abhi',
    github: 'stablei/stablei-chain'
  });
});

// Create wallet
app.post('/api/wallet/create', (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name required' });
  }

  const seed = name + Date.now() + Math.random();
  const privateKey = crypto
    .createHash('sha3-256')
    .update(seed)
    .digest('hex');

  const address = '0xSI' + crypto
    .createHash('sha3-256')
    .update(privateKey + 'ADDRESS')
    .digest('hex')
    .substring(0, 32)
    .toUpperCase();

  const wallet = {
    address,
    name,
    privateKey,
    balance: { SI: 0, SIR: 0, SID: 0 },
    createdAt: new Date().toISOString()
  };

  wallets[address] = wallet;

  console.log(`✅ New wallet created: ${name} - ${address.substring(0, 20)}...`);

  res.json({
    success: true,
    address,
    privateKey,
    balance: wallet.balance,
    message: 'Wallet created successfully!'
  });
});

// Get wallet
app.get('/api/wallet/:address', (req, res) => {
  const wallet = wallets[req.params.address];
  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }
  res.json({
    address: wallet.address,
    name: wallet.name,
    balance: wallet.balance,
    createdAt: wallet.createdAt
  });
});

// Send transaction
app.post('/api/transaction/send', (req, res) => {
  const { fromAddress, privateKey, toAddress, coin, amount } = req.body;

  if (!fromAddress || !privateKey || !toAddress || !coin || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sender = wallets[fromAddress];
  if (!sender) {
    return res.status(404).json({ error: 'Sender wallet not found' });
  }

  // Verify private key
  if (sender.privateKey !== privateKey) {
    return res.status(401).json({ error: 'Invalid private key!' });
  }

  const sendAmount = parseFloat(amount);
  const fee = Math.max(parseFloat((sendAmount * 0.001).toFixed(6)), 0.001);
  const total = sendAmount + fee;

  if (sender.balance[coin] < total) {
    return res.status(400).json({
      error: `Insufficient ${coin}! Have: ${sender.balance[coin]}, Need: ${total}`
    });
  }

  // Process transaction
  sender.balance[coin] -= total;

  if (wallets[toAddress]) {
    wallets[toAddress].balance[coin] += sendAmount;
  }

  const tx = {
    txId: crypto
      .createHash('sha3-256')
      .update(fromAddress + toAddress + amount + Date.now())
      .digest('hex')
      .substring(0, 16),
    from: fromAddress,
    to: toAddress,
    coin,
    amount: sendAmount,
    fee,
    timestamp: new Date().toISOString(),
    status: 'confirmed'
  };

  transactions.push(tx);
  pendingTransactions.push(tx);

  console.log(`💸 TX: ${sendAmount} ${coin} from ${fromAddress.substring(0,16)}... to ${toAddress.substring(0,16)}...`);

  res.json({
    success: true,
    txId: tx.txId,
    amount: sendAmount,
    coin,
    fee,
    timestamp: tx.timestamp,
    message: 'Transaction confirmed!'
  });
});

// Get transactions
app.get('/api/transactions', (req, res) => {
  res.json(transactions.slice(-50).reverse());
});

// Get wallet transactions
app.get('/api/transactions/:address', (req, res) => {
  const address = req.params.address;
  const walletTxs = transactions.filter(
    tx => tx.from === address || tx.to === address
  );
  res.json(walletTxs.reverse());
});

// Get all blocks
app.get('/api/blocks', (req, res) => {
  res.json(blocks.slice(-20).reverse());
});

// Get block
app.get('/api/blocks/:index', (req, res) => {
  const block = blocks[parseInt(req.params.index)];
  if (!block) {
    return res.status(404).json({ error: 'Block not found' });
  }
  res.json(block);
});

// Faucet - get test coins
app.post('/api/faucet', (req, res) => {
  const { address } = req.body;
  const wallet = wallets[address];

  if (!wallet) {
    return res.status(404).json({ error: 'Wallet not found' });
  }

  // Check if already claimed
  if (wallet.faucetClaimed) {
    return res.status(400).json({ error: 'Already claimed! One claim per wallet.' });
  }

  wallet.balance.SI += 1000;
  wallet.balance.SIR += 100;
  wallet.balance.SID += 10;
  wallet.faucetClaimed = true;

  const tx = {
    txId: crypto.createHash('sha3-256').update('faucet' + address + Date.now()).digest('hex').substring(0, 16),
    from: 'StableI Faucet',
    to: address,
    coin: 'SI',
    amount: 1000,
    fee: 0,
    timestamp: new Date().toISOString(),
    status: 'confirmed'
  };

  transactions.push(tx);

  console.log(`🎁 Faucet: 1000 SI sent to ${address.substring(0,16)}...`);

  res.json({
    success: true,
    message: 'Received 1000 SI + 100 SIR + 10 SID!',
    balance: wallet.balance
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = 3000;
app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════╗');
  console.log('║     STABLEI SERVER STARTED! 🚀     ║');
  console.log('║     Quantum Safe SHA3-256          ║');
  console.log('║     Founded by Abhi 🇮🇳            ║');
  console.log('╚════════════════════════════════════╝');
  console.log('');
  console.log(`🌍 Server: http://localhost:${PORT}`);
  console.log(`⛓️  Blocks: http://localhost:${PORT}/api/blocks`);
  console.log(`💰 Status: http://localhost:${PORT}/api/status`);
  console.log('');
});