const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const mongoose = require('mongoose');

// ============================================
// STABLEI BLOCKCHAIN SERVER v2.0
// With MongoDB Persistent Storage
// Founded by: Abhi | GitHub: stablei
// ============================================

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// ============================================
// MONGODB CONNECTION
// ============================================

const MONGODB_URI = 'mongodb+srv://Abhi:stablei123@cluster0.carucjo.mongodb.net/stablei?appName=Cluster0';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected! StableI data is now permanent!'))
  .catch(err => console.log('❌ MongoDB Error:', err));

// ============================================
// DATABASE SCHEMAS
// ============================================

const WalletSchema = new mongoose.Schema({
  address: { type: String, unique: true, required: true },
  name: String,
  privateKey: String,
  balance: {
    SI: { type: Number, default: 0 },
    SIR: { type: Number, default: 0 },
    SID: { type: Number, default: 0 }
  },
  faucetClaimed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
  txId: { type: String, unique: true },
  from: String,
  to: String,
  coin: String,
  amount: Number,
  fee: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'confirmed' }
});

const BlockSchema = new mongoose.Schema({
  index: { type: Number, unique: true },
  timestamp: Date,
  transactions: Array,
  previousHash: String,
  hash: String,
  miner: String,
  data: Object
});

const Wallet = mongoose.model('Wallet', WalletSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Block = mongoose.model('Block', BlockSchema);

// ============================================
// HELPER FUNCTIONS
// ============================================

function createHash(data) {
  return crypto
    .createHash('sha3-256')
    .update(JSON.stringify(data))
    .digest('hex');
}

async function initGenesis() {
  const existing = await Block.findOne({ index: 0 });
  if (!existing) {
    const genesis = new Block({
      index: 0,
      timestamp: new Date('2026-04-02T00:00:00.000Z'),
      transactions: [],
      previousHash: '0000000000000000',
      hash: '',
      miner: 'Abhi',
      data: {
        message: 'StableI Genesis Block',
        founder: 'Abhi',
        coins: ['SI', 'SIR', 'SID'],
        security: 'SHA3-256 Quantum Safe',
        vision: 'Your Money. Stable. Always.',
        github: 'stablei/stablei-chain'
      }
    });
    genesis.hash = createHash(genesis);
    await genesis.save();
    console.log('⛓️  Genesis Block created and saved to MongoDB!');
  } else {
    console.log('⛓️  Genesis Block already exists!');
  }
}

async function initFounder() {
  const existing = await Wallet.findOne({ address: '0xSIABHIFOUNDER000000000000000000000' });
  if (!existing) {
    const founder = new Wallet({
      address: '0xSIABHIFOUNDER000000000000000000000',
      name: 'Abhi - Founder',
      privateKey: 'founder-private-key-abhi-stablei-2026',
      balance: { SI: 1000000, SIR: 100000, SID: 10000 }
    });
    await founder.save();
    console.log('👑 Founder wallet created!');
  } else {
    console.log('👑 Founder wallet already exists!');
  }
}

async function mineBlock(transactions) {
  const lastBlock = await Block.findOne().sort({ index: -1 });
  const newBlock = new Block({
    index: lastBlock.index + 1,
    timestamp: new Date(),
    transactions: transactions,
    previousHash: lastBlock.hash,
    hash: '',
    miner: 'StableI Network'
  });
  newBlock.hash = createHash(newBlock);
  await newBlock.save();
  console.log(`⛏️  Block #${newBlock.index} mined and saved!`);
  return newBlock;
}

async function init() {
  await initGenesis();
  await initFounder();
  console.log('🚀 StableI Blockchain initialized with MongoDB!');
}

// ============================================
// API ROUTES
// ============================================

app.get('/api/status', async (req, res) => {
  try {
    const blocks = await Block.countDocuments();
    const wallets = await Wallet.countDocuments();
    const transactions = await Transaction.countDocuments();
    res.json({
      status: 'running',
      name: 'StableI Chain',
      blocks,
      transactions,
      wallets,
      security: 'SHA3-256 Quantum Safe',
      founder: 'Abhi',
      github: 'stablei/stablei-chain',
      database: 'MongoDB Atlas ✅'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/wallet/create', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const seed = name + Date.now() + Math.random();
    const privateKey = crypto.createHash('sha3-256').update(seed).digest('hex');
    const address = '0xSI' + crypto
      .createHash('sha3-256')
      .update(privateKey + 'ADDRESS')
      .digest('hex')
      .substring(0, 32)
      .toUpperCase();

    const wallet = new Wallet({
      address,
      name,
      privateKey,
      balance: { SI: 0, SIR: 0, SID: 0 }
    });

    await wallet.save();
    console.log(`✅ Wallet created: ${name}`);

    res.json({
      success: true,
      address,
      privateKey,
      balance: { SI: 0, SIR: 0, SID: 0 },
      message: 'Wallet created and saved permanently!'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/wallet/:address', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ address: req.params.address });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    res.json({
      address: wallet.address,
      name: wallet.name,
      balance: wallet.balance,
      createdAt: wallet.createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/transaction/send', async (req, res) => {
  try {
    const { fromAddress, privateKey, toAddress, coin, amount } = req.body;

    if (!fromAddress || !privateKey || !toAddress || !coin || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const sender = await Wallet.findOne({ address: fromAddress });
    if (!sender) return res.status(404).json({ error: 'Sender wallet not found' });

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

    sender.balance[coin] -= total;
    await sender.save();

    const receiver = await Wallet.findOne({ address: toAddress });
    if (receiver) {
      receiver.balance[coin] += sendAmount;
      await receiver.save();
    }

    const txId = crypto
      .createHash('sha3-256')
      .update(fromAddress + toAddress + amount + Date.now())
      .digest('hex')
      .substring(0, 16);

    const tx = new Transaction({
      txId,
      from: fromAddress,
      to: toAddress,
      coin,
      amount: sendAmount,
      fee,
      status: 'confirmed'
    });
    await tx.save();

    await mineBlock([{
      txId,
      from: fromAddress,
      to: toAddress,
      coin,
      amount: sendAmount,
      fee
    }]);

    console.log(`💸 TX: ${sendAmount} ${coin}`);

    res.json({
      success: true,
      txId,
      amount: sendAmount,
      coin,
      fee,
      timestamp: tx.timestamp,
      message: 'Transaction confirmed and saved permanently!'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const txs = await Transaction.find().sort({ timestamp: -1 }).limit(50);
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/transactions/:address', async (req, res) => {
  try {
    const txs = await Transaction.find({
      $or: [{ from: req.params.address }, { to: req.params.address }]
    }).sort({ timestamp: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/blocks', async (req, res) => {
  try {
    const blocks = await Block.find().sort({ index: -1 }).limit(20);
    res.json(blocks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/blocks/:index', async (req, res) => {
  try {
    const block = await Block.findOne({ index: parseInt(req.params.index) });
    if (!block) return res.status(404).json({ error: 'Block not found' });
    res.json(block);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/faucet', async (req, res) => {
  try {
    const { address } = req.body;
    const wallet = await Wallet.findOne({ address });
    if (!wallet) return res.status(404).json({ error: 'Wallet not found' });
    if (wallet.faucetClaimed) {
      return res.status(400).json({ error: 'Already claimed! One per wallet.' });
    }

    wallet.balance.SI += 1000;
    wallet.balance.SIR += 100;
    wallet.balance.SID += 10;
    wallet.faucetClaimed = true;
    await wallet.save();

    const tx = new Transaction({
      txId: crypto
        .createHash('sha3-256')
        .update('faucet' + address + Date.now())
        .digest('hex')
        .substring(0, 16),
      from: 'StableI Faucet',
      to: address,
      coin: 'SI',
      amount: 1000,
      fee: 0,
      status: 'confirmed'
    });
    await tx.save();

    await mineBlock([{
      from: 'StableI Faucet',
      to: address,
      amount: '1000 SI + 100 SIR + 10 SID'
    }]);

    console.log(`🎁 Faucet: ${address.substring(0, 16)}...`);

    res.json({
      success: true,
      message: 'Received 1000 SI + 100 SIR + 10 SID!',
      balance: wallet.balance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log('');
  console.log('╔════════════════════════════════════╗');
  console.log('║   STABLEI SERVER v2.0 STARTED! 🚀  ║');
  console.log('║   Quantum Safe SHA3-256            ║');
  console.log('║   MongoDB Persistent Storage       ║');
  console.log('║   Founded by Abhi 🇮🇳              ║');
  console.log('╚════════════════════════════════════╝');
  console.log('');
  console.log(`🌍 Server: http://localhost:${PORT}`);
  console.log(`⛓️  Blocks: http://localhost:${PORT}/api/blocks`);
  console.log(`💰 Status: http://localhost:${PORT}/api/status`);
  console.log('');
  await init();
});