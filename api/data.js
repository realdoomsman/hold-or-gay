// Vercel serverless function - REAL blockchain data only
// Uses Helius API to track token holders and sellers

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '19526c31-75df-4887-8cd8-01d9ba9b004a';

// DEMO: Using BONK token to show real tracking. Replace with your token when launched.
const TOKEN_MINT = process.env.TOKEN_MINT || 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263'; // BONK

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');

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
            const data = await getSellers();
            return res.status(200).json(data);
        }
        else if (type === 'stats') {
            const data = await getStats();
            return res.status(200).json(data);
        }
        else {
            const [holders, transactions] = await Promise.all([
                getTokenHolders(),
                getSellers()
            ]);
            return res.status(200).json({ holders, transactions });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message, holders: [], transactions: [] });
    }
};

// Get top token holders
async function getTokenHolders() {
    try {
        const url = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'holders',
                method: 'getTokenLargestAccounts',
                params: [TOKEN_MINT]
            })
        });

        const data = await response.json();
        const accounts = data.result?.value || [];

        // Get owner info for each account
        const holdersWithOwners = await Promise.all(
            accounts.slice(0, 15).map(async (acc, i) => {
                try {
                    const ownerRes = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            id: 'owner',
                            method: 'getAccountInfo',
                            params: [acc.address, { encoding: 'jsonParsed' }]
                        })
                    });
                    const ownerData = await ownerRes.json();
                    const owner = ownerData.result?.value?.data?.parsed?.info?.owner || acc.address;

                    return {
                        rank: i + 1,
                        wallet: shortenWallet(owner),
                        fullWallet: owner,
                        amount: formatAmount(parseFloat(acc.uiAmountString || acc.amount / 1e5)),
                        rawAmount: acc.amount
                    };
                } catch (e) {
                    return {
                        rank: i + 1,
                        wallet: shortenWallet(acc.address),
                        fullWallet: acc.address,
                        amount: formatAmount(parseFloat(acc.uiAmountString || 0)),
                        rawAmount: acc.amount
                    };
                }
            })
        );

        return holdersWithOwners;
    } catch (err) {
        console.error('getTokenHolders error:', err);
        return [];
    }
}

// Get recent sellers (the gays)
async function getSellers() {
    try {
        // Get recent transactions for the token
        const url = `https://api.helius.xyz/v0/addresses/${TOKEN_MINT}/transactions?api-key=${HELIUS_API_KEY}&limit=50&type=SWAP`;

        const response = await fetch(url);
        const txs = await response.json();

        if (!Array.isArray(txs)) {
            console.error('unexpected tx response:', txs);
            return [];
        }

        const sellers = [];

        for (const tx of txs) {
            // Look for swaps where someone sold the token
            const tokenTransfers = tx.tokenTransfers || [];
            const nativeTransfers = tx.nativeTransfers || [];

            for (const transfer of tokenTransfers) {
                if (transfer.mint === TOKEN_MINT && transfer.tokenAmount > 0) {
                    // Check if this is a SELL (token going out, SOL coming in)
                    const fromAccount = transfer.fromUserAccount;
                    const isSell = nativeTransfers.some(nt => nt.toUserAccount === fromAccount);

                    if (isSell || transfer.fromUserAccount) {
                        sellers.push({
                            wallet: shortenWallet(transfer.fromUserAccount),
                            fullWallet: transfer.fromUserAccount,
                            amount: formatAmount(transfer.tokenAmount),
                            rawAmount: transfer.tokenAmount,
                            time: formatTime(tx.timestamp),
                            timestamp: tx.timestamp,
                            tx: tx.signature,
                            type: 'SELL'
                        });
                    }
                }
            }
        }

        // Dedupe by transaction
        const unique = [...new Map(sellers.map(s => [s.tx, s])).values()];
        return unique.sort((a, b) => b.timestamp - a.timestamp).slice(0, 30);

    } catch (err) {
        console.error('getSellers error:', err);
        return [];
    }
}

// Get stats
async function getStats() {
    try {
        const [holders, sellers] = await Promise.all([
            getTokenHolders(),
            getSellers()
        ]);

        return {
            holders: holders.length,
            sellers: sellers.length,
            holdPercentage: holders.length > 0 ?
                ((holders.length / (holders.length + sellers.length)) * 100).toFixed(1) : 0
        };
    } catch (err) {
        return { holders: 0, sellers: 0, holdPercentage: 0 };
    }
}

function shortenWallet(wallet) {
    if (!wallet) return '???';
    return wallet.slice(0, 5) + '...' + wallet.slice(-4);
}

function formatAmount(amount) {
    if (!amount || isNaN(amount)) return '0';
    if (amount >= 1000000000) return (amount / 1000000000).toFixed(1) + 'B';
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
    return Math.floor(amount).toLocaleString();
}

function formatTime(timestamp) {
    if (!timestamp) return 'unknown';
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' mins ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hrs ago';
    return Math.floor(diff / 86400) + ' days ago';
}
