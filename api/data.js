// Vercel serverless function to fetch token holders and sellers
// This keeps the Helius API key secure on the server

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '19526c31-75df-4887-8cd8-01d9ba9b004a';
const TOKEN_MINT = process.env.TOKEN_MINT || ''; // add your token mint when launched

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { type } = req.query;

    try {
        if (type === 'holders') {
            const data = await getTokenHolders();
            return res.status(200).json(data);
        }
        else if (type === 'transactions') {
            const data = await getTransactions();
            return res.status(200).json(data);
        }
        else if (type === 'stats') {
            const data = await getStats();
            return res.status(200).json(data);
        }
        else {
            // return all data
            const [holders, transactions] = await Promise.all([
                getTokenHolders(),
                getTransactions()
            ]);
            return res.status(200).json({ holders, transactions });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
};

async function getTokenHolders() {
    if (!TOKEN_MINT) {
        return getMockHolders();
    }

    const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'holders',
            method: 'getTokenAccounts',
            params: {
                mint: TOKEN_MINT,
                limit: 100
            }
        })
    });

    const data = await response.json();
    const accounts = data.result?.token_accounts || [];

    return accounts
        .filter(acc => acc.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 20)
        .map((acc, i) => ({
            rank: i + 1,
            wallet: shortenWallet(acc.owner),
            fullWallet: acc.owner,
            amount: formatAmount(acc.amount / 1e9),
            rawAmount: acc.amount
        }));
}

async function getTransactions() {
    if (!TOKEN_MINT) {
        return getMockSellers();
    }

    const url = `https://api.helius.xyz/v0/addresses/${TOKEN_MINT}/transactions?api-key=${HELIUS_API_KEY}&limit=100`;

    const response = await fetch(url);
    const txs = await response.json();

    const sellers = [];

    for (const tx of txs) {
        if (tx.type === 'SWAP' || tx.type === 'TRANSFER') {
            const tokenTransfers = tx.tokenTransfers || [];
            for (const transfer of tokenTransfers) {
                if (transfer.mint === TOKEN_MINT && transfer.tokenAmount > 0) {
                    sellers.push({
                        wallet: shortenWallet(transfer.fromUserAccount),
                        fullWallet: transfer.fromUserAccount,
                        amount: formatAmount(transfer.tokenAmount),
                        rawAmount: transfer.tokenAmount,
                        time: formatTime(tx.timestamp),
                        timestamp: tx.timestamp,
                        tx: tx.signature,
                        type: tx.type
                    });
                }
            }
        }
    }

    const unique = [...new Map(sellers.map(s => [s.tx, s])).values()];
    return unique.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
}

async function getStats() {
    if (!TOKEN_MINT) {
        return {
            holders: 12847,
            sellers: 2341,
            mcap: '$4.2M',
            holdPercentage: 84.6
        };
    }

    const [holders, txs] = await Promise.all([
        getTokenHolders(),
        getTransactions()
    ]);

    return {
        holders: holders.length,
        sellers: txs.length,
        mcap: 'check dex',
        holdPercentage: (holders.length / (holders.length + txs.length) * 100).toFixed(1)
    };
}

function getMockHolders() {
    return [
        { rank: 1, wallet: 'DeadB...beef', amount: '50.0M', days: 47 },
        { rank: 2, wallet: '420x6...9696', amount: '25.0M', days: 45 },
        { rank: 3, wallet: 'CafeB...abe1', amount: '18.5M', days: 42 },
        { rank: 4, wallet: 'Beefx...dead', amount: '12.0M', days: 40 },
        { rank: 5, wallet: 'F00dx...cafe', amount: '9.5M', days: 38 },
        { rank: 6, wallet: 'Babe1...cafe', amount: '7.2M', days: 35 },
        { rank: 7, wallet: '1234x...abcd', amount: '5.8M', days: 33 },
        { rank: 8, wallet: '9876x...dcba', amount: '4.2M', days: 30 },
        { rank: 9, wallet: 'Facex...feed', amount: '3.1M', days: 28 },
        { rank: 10, wallet: 'Cool1...guy2', amount: '2.5M', days: 25 },
    ];
}

function getMockSellers() {
    const now = Date.now() / 1000;
    return [
        { wallet: '7xKXt...3fBq', amount: '420.0K', time: '2 mins ago', timestamp: now - 120 },
        { wallet: '9mPza...7dRw', amount: '1.0M', time: '5 mins ago', timestamp: now - 300 },
        { wallet: '3bNyc...9sKm', amount: '69.4K', time: '8 mins ago', timestamp: now - 480 },
        { wallet: '5pQrt...2xVn', amount: '500.0K', time: '12 mins ago', timestamp: now - 720 },
        { wallet: '2wLkj...8cFh', amount: '250.0K', time: '18 mins ago', timestamp: now - 1080 },
        { wallet: '8yTgb...4mZx', amount: '888.8K', time: '25 mins ago', timestamp: now - 1500 },
        { wallet: '1rDsp...6vCq', amount: '333.3K', time: '32 mins ago', timestamp: now - 1920 },
        { wallet: '6nHjk...0wYt', amount: '150.0K', time: '45 mins ago', timestamp: now - 2700 },
        { wallet: '4sMnb...5pLz', amount: '750.0K', time: '1 hr ago', timestamp: now - 3600 },
    ];
}

function shortenWallet(wallet) {
    if (!wallet) return '???';
    return wallet.slice(0, 5) + '...' + wallet.slice(-4);
}

function formatAmount(amount) {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
    return Math.floor(amount).toLocaleString();
}

function formatTime(timestamp) {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' mins ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hrs ago';
    return Math.floor(diff / 86400) + ' days ago';
}
