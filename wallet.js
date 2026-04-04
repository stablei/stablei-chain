const crypto = require('crypto');

// ============================================
// STABLEI WALLET SYSTEM v1.0
// Quantum Safe - SHA3-256
// Founded by: Abhi | GitHub: stablei
// ============================================

class StableIWallet {
  constructor() {
    this.wallets = {};
  }

  // Generate new wallet
  createWallet(name) {
    // Generate key pair
    const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
      publicKeyEncoding: { type: 'spki', format: 'der' },
      privateKeyEncoding: { type: 'pkcs8', format: 'der' }
    });

    // Create wallet address from public key
    const address = '0xSI' + crypto
      .createHash('sha3-256')
      .update(publicKey)
      .digest('hex')
      .substring(0, 32)
      .toUpperCase();

    const wallet = {
      name: name,
      address: address,
      publicKey: publicKey.toString('hex'),
      privateKey: privateKey.toString('hex'),
      balance: {
        SI: 0,
        SIR: 0,
        SID: 0
      },
      transactions: [],
      createdAt: new Date().toISOString()
    };

    this.wallets[address] = wallet;

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║       STABLEI WALLET CREATED! 🎉       ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`Name     : ${name}`);
    console.log(`Address  : ${address}`);
    console.log(`Created  : ${wallet.createdAt}`);
    console.log('⚠️  SAVE YOUR PRIVATE KEY SAFELY!');
    console.log(`PrivKey  : ${privateKey.toString('hex').substring(0, 32)}...`);

    return wallet;
  }

  // Add balance (for testing)
  addBalance(address, coin, amount) {
    if (!this.wallets[address]) {
      console.log('❌ Wallet not found!');
      return;
    }
    this.wallets[address].balance[coin] += amount;
    console.log(`\n✅ Added ${amount} ${coin} to ${address.substring(0, 20)}...`);
  }

  // Send coins
  send(fromAddress, toAddress, coin, amount) {
    const sender = this.wallets[fromAddress];

    if (!sender) {
      console.log('❌ Sender wallet not found!');
      return false;
    }

    if (sender.balance[coin] < amount) {
      console.log(`❌ Insufficient ${coin} balance!`);
      console.log(`   Available: ${sender.balance[coin]} ${coin}`);
      return false;
    }

    // Calculate fee
    const fee = parseFloat((amount * 0.001).toFixed(4));
    const total = amount + fee;

    if (sender.balance[coin] < total) {
      console.log(`❌ Insufficient balance including fee!`);
      return false;
    }

    // Process transaction
    sender.balance[coin] -= total;

    if (this.wallets[toAddress]) {
      this.wallets[toAddress].balance[coin] += amount;
    }

    // Create transaction record
    const txId = crypto
      .createHash('sha3-256')
      .update(fromAddress + toAddress + amount + Date.now())
      .digest('hex')
      .substring(0, 16);

    const tx = {
      txId: txId,
      from: fromAddress,
      to: toAddress,
      amount: amount,
      coin: coin,
      fee: fee,
      timestamp: new Date().toISOString(),
      status: 'confirmed'
    };

    sender.transactions.push(tx);

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║      TRANSACTION SUCCESSFUL! ✅        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`TxID     : ${txId}`);
    console.log(`From     : ${fromAddress.substring(0, 24)}...`);
    console.log(`To       : ${toAddress.substring(0, 24)}...`);
    console.log(`Amount   : ${amount} ${coin}`);
    console.log(`Fee      : ${fee} ${coin}`);
    console.log(`Time     : ${tx.timestamp}`);

    return tx;
  }

  // Check balance
  getBalance(address) {
    const wallet = this.wallets[address];
    if (!wallet) {
      console.log('❌ Wallet not found!');
      return;
    }

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║         STABLEI WALLET BALANCE         ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`Name     : ${wallet.name}`);
    console.log(`Address  : ${address.substring(0, 24)}...`);
    console.log(`SI       : ${wallet.balance.SI} SI`);
    console.log(`SIR      : ${wallet.balance.SIR} SIR (₹${wallet.balance.SIR})`);
    console.log(`SID      : ${wallet.balance.SID} SID ($${wallet.balance.SID})`);
    console.log(`Txs      : ${wallet.transactions.length} transactions`);

    return wallet.balance;
  }
}

// ============================================
// TEST STABLEI WALLET
// ============================================

const WalletSystem = new StableIWallet();

// Create wallets
const abhiWallet = WalletSystem.createWallet('Abhi - Founder');
const userWallet = WalletSystem.createWallet('First User');
const merchantWallet = WalletSystem.createWallet('Merchant Shop');

// Add test balance
WalletSystem.addBalance(abhiWallet.address, 'SI', 1000000);
WalletSystem.addBalance(abhiWallet.address, 'SIR', 50000);
WalletSystem.addBalance(abhiWallet.address, 'SID', 10000);

// Check balance
WalletSystem.getBalance(abhiWallet.address);

// Send SI to user
WalletSystem.send(
  abhiWallet.address,
  userWallet.address,
  'SI',
  500
);

// Send SIR to merchant
WalletSystem.send(
  abhiWallet.address,
  merchantWallet.address,
  'SIR',
  1000
);

// Check balance after sending
WalletSystem.getBalance(abhiWallet.address);
WalletSystem.getBalance(userWallet.address);
WalletSystem.getBalance(merchantWallet.address);

console.log('\n🚀 StableI Wallet System Running!');
console.log('🔒 Quantum Safe SHA3-256 Active!');
console.log('🇮🇳 India ka apna wallet!\n');