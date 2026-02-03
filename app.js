// HOLD OR GAY - real blockchain tracking with Helius
// config - update these when you have the token
const CONFIG = {
    TOKEN_MINT: '', // add your token mint address here
    HELIUS_API_KEY: '', // add helius api key
    HELIUS_RPC: '',
    TOKEN_SYMBOL: '$HOG',
    TOKEN_DECIMALS: 9
};

// state
let sellers = [];
let holders = [];
let transactions = [];

// init
document.addEventListener('DOMContentLoaded', async () => {
    // for now use mock data, will switch to real when token launches
    if (!CONFIG.TOKEN_MINT) {
        loadMockData();
    } else {
        await loadRealData();
    }

    setupTicker();
    animateCounters();
});

// mock data for pre-launch
function loadMockData() {
    // mock sellers (the gays)
    sellers = [
        { wallet: '7xKXt...3fBq', sold: '420,069', price: '$0.00042', time: '2 mins ago', tx: '' },
        { wallet: '9mPza...7dRw', sold: '1,000,000', price: '$0.00039', time: '5 mins ago', tx: '' },
        { wallet: '3bNyc...9sKm', sold: '69,420', price: '$0.00041', time: '8 mins ago', tx: '' },
        { wallet: '5pQrt...2xVn', sold: '500,000', price: '$0.00040', time: '12 mins ago', tx: '' },
        { wallet: '2wLkj...8cFh', sold: '250,000', price: '$0.00038', time: '18 mins ago', tx: '' },
        { wallet: '8yTgb...4mZx', sold: '888,888', price: '$0.00037', time: '25 mins ago', tx: '' },
        { wallet: '1rDsp...6vCq', sold: '333,333', price: '$0.00041', time: '32 mins ago', tx: '' },
        { wallet: '6nHjk...0wYt', sold: '150,000', price: '$0.00040', time: '45 mins ago', tx: '' },
        { wallet: '4sMnb...5pLz', sold: '750,000', price: '$0.00039', time: '1 hr ago', tx: '' },
    ];

    // mock holders (the chads)
    holders = [
        { wallet: 'DeadB...beef', amount: '50,000,000', days: 47 },
        { wallet: '420x6...9696', amount: '25,000,000', days: 45 },
        { wallet: 'CafeB...abe1', amount: '18,500,000', days: 42 },
        { wallet: 'Beefx...dead', amount: '12,000,000', days: 40 },
        { wallet: 'F00dx...cafe', amount: '9,500,000', days: 38 },
        { wallet: 'Babe1...cafe', amount: '7,200,000', days: 35 },
        { wallet: '1234x...abcd', amount: '5,800,000', days: 33 },
        { wallet: '9876x...dcba', amount: '4,200,000', days: 30 },
        { wallet: 'Facex...feed', amount: '3,100,000', days: 28 },
        { wallet: 'Cool1...guy2', amount: '2,500,000', days: 25 },
    ];

    renderSellers();
    renderHolders();
    renderFeed();
    updateStats(holders.length * 1000 + 12847, sellers.length * 100 + 2341);
}

// real blockchain data with Helius
async function loadRealData() {
    try {
        // get token holders
        const holdersData = await fetchTokenHolders();
        // get recent transactions
        const txData = await fetchRecentTransactions();

        // process and identify sellers
        processSellers(txData);
        processHolders(holdersData);

        renderSellers();
        renderHolders();
        renderFeed();
        updateStats(holders.length, sellers.length);

        // set up polling for live updates
        setInterval(async () => {
            const newTx = await fetchRecentTransactions();
            processSellers(newTx);
            renderFeed();
        }, 30000); // check every 30 seconds

    } catch (err) {
        console.error('failed to load blockchain data:', err);
        loadMockData(); // fallback to mock
    }
}

// fetch token holders from Helius
async function fetchTokenHolders() {
    const url = `https://mainnet.helius-rpc.com/?api-key=${CONFIG.HELIUS_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'holders',
            method: 'getTokenAccounts',
            params: {
                mint: CONFIG.TOKEN_MINT,
                limit: 100
            }
        })
    });

    const data = await response.json();
    return data.result?.token_accounts || [];
}

// fetch recent transactions
async function fetchRecentTransactions() {
    const url = `https://api.helius.xyz/v0/addresses/${CONFIG.TOKEN_MINT}/transactions?api-key=${CONFIG.HELIUS_API_KEY}&limit=100`;

    const response = await fetch(url);
    const data = await response.json();
    return data || [];
}

// process transactions to find sellers
function processSellers(txs) {
    txs.forEach(tx => {
        // check if this is a sell transaction
        if (tx.type === 'SWAP' || tx.type === 'TRANSFER') {
            const tokenTransfers = tx.tokenTransfers || [];
            tokenTransfers.forEach(transfer => {
                if (transfer.mint === CONFIG.TOKEN_MINT) {
                    // this wallet sent tokens = seller
                    const seller = {
                        wallet: shortenWallet(transfer.fromUserAccount),
                        sold: formatAmount(transfer.tokenAmount),
                        price: 'check dex',
                        time: formatTime(tx.timestamp),
                        tx: tx.signature
                    };

                    // avoid duplicates
                    if (!sellers.find(s => s.tx === tx.signature)) {
                        sellers.unshift(seller);
                    }
                }
            });
        }
    });

    // keep only last 50
    sellers = sellers.slice(0, 50);
}

// process holders
function processHolders(accounts) {
    holders = accounts
        .filter(acc => acc.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 20)
        .map(acc => ({
            wallet: shortenWallet(acc.owner),
            amount: formatAmount(acc.amount / Math.pow(10, CONFIG.TOKEN_DECIMALS)),
            days: 'since launch'
        }));
}

// render sellers (the gays)
function renderSellers() {
    const grid = document.getElementById('shame-grid');
    if (!grid) return;

    if (sellers.length === 0) {
        grid.innerHTML = '<div class="loading-msg">no gays yet... but theyre coming</div>';
        return;
    }

    grid.innerHTML = sellers.slice(0, 9).map(s => `
        <div class="shame-card">
            <div class="shame-wallet">${s.wallet}</div>
            <div class="shame-time">${s.time}</div>
            <div class="shame-info">
                <span class="shame-sold">-${s.sold} ${CONFIG.TOKEN_SYMBOL}</span>
                <span class="shame-price">${s.price}</span>
            </div>
            <span class="shame-tag">confirmed gay</span>
        </div>
    `).join('');
}

// render holders (the chads)
function renderHolders() {
    const body = document.getElementById('lb-body');
    if (!body) return;

    if (holders.length === 0) {
        body.innerHTML = '<div class="loading-msg">loading diamond hands...</div>';
        return;
    }

    body.innerHTML = holders.map((h, i) => {
        let rankClass = '';
        if (i === 0) rankClass = 'gold';
        else if (i === 1) rankClass = 'silver';
        else if (i === 2) rankClass = 'bronze';

        return `
            <div class="lb-row">
                <span class="lb-rank ${rankClass}">#${i + 1}</span>
                <span class="lb-wallet">${h.wallet}</span>
                <span class="lb-amount">${h.amount}</span>
                <span class="lb-days">${h.days}</span>
            </div>
        `;
    }).join('');
}

// render live feed
function renderFeed() {
    const feed = document.getElementById('feed');
    if (!feed) return;

    if (sellers.length === 0) {
        feed.innerHTML = '<div class="loading-msg">waiting for paper hands...</div>';
        return;
    }

    feed.innerHTML = sellers.slice(0, 5).map(s => `
        <div class="feed-item">
            <span class="feed-icon">[!]</span>
            <div>
                <span class="feed-wallet">${s.wallet}</span> sold 
                <span class="feed-amount">${s.sold} ${CONFIG.TOKEN_SYMBOL}</span>
                <span class="feed-time">  ${s.time}</span>
            </div>
            <span class="feed-tag">GAY</span>
        </div>
    `).join('');
}

// setup scrolling ticker
function setupTicker() {
    const ticker = document.getElementById('ticker');
    if (!ticker || sellers.length === 0) return;

    const items = sellers.slice(0, 5).map(s =>
        `<span class="ticker-item"><span class="wallet">${s.wallet}</span> sold <span class="amount">${s.sold}</span> - CONFIRMED GAY</span>`
    ).join('');

    ticker.innerHTML = items + items; // duplicate for seamless loop
}

// animate counters
function animateCounters() {
    setTimeout(() => {
        const holdersEl = document.getElementById('holders');
        const gaysEl = document.getElementById('gays');

        animateNumber(holdersEl, 12847);
        animateNumber(gaysEl, 2341);
        animateNumber(document.getElementById('gay-count'), 2341);

        const mcapEl = document.getElementById('mcap');
        if (mcapEl) mcapEl.textContent = '$4.2M';
    }, 300);
}

function animateNumber(el, target) {
    if (!el) return;
    let current = 0;
    const increment = target / 60;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = Math.floor(current).toLocaleString();
    }, 16);
}

// update stats with real numbers
function updateStats(holderCount, gayCount) {
    const holdersEl = document.getElementById('holders');
    const gaysEl = document.getElementById('gays');
    const gayCountEl = document.getElementById('gay-count');

    if (holdersEl) holdersEl.textContent = holderCount.toLocaleString();
    if (gaysEl) gaysEl.textContent = gayCount.toLocaleString();
    if (gayCountEl) gayCountEl.textContent = gayCount.toLocaleString();
}

// helpers
function shortenWallet(wallet) {
    if (!wallet) return '???';
    return wallet.slice(0, 5) + '...' + wallet.slice(-4);
}

function formatAmount(amount) {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
    return amount.toLocaleString();
}

function formatTime(timestamp) {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' mins ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hrs ago';
    return Math.floor(diff / 86400) + ' days ago';
}

// copy CA
function copyCA() {
    const ca = document.getElementById('ca').textContent;
    if (ca === 'TBA') {
        alert('CA coming soon ser');
        return;
    }
    navigator.clipboard.writeText(ca).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'copied!';
        setTimeout(() => btn.textContent = 'copy', 2000);
    });
}

// load more sellers
function loadMore() {
    const grid = document.getElementById('shame-grid');
    const currentCount = grid.querySelectorAll('.shame-card').length;
    const newSellers = sellers.slice(currentCount, currentCount + 6);

    newSellers.forEach(s => {
        const card = document.createElement('div');
        card.className = 'shame-card';
        card.style.opacity = '0';
        card.innerHTML = `
            <div class="shame-wallet">${s.wallet}</div>
            <div class="shame-time">${s.time}</div>
            <div class="shame-info">
                <span class="shame-sold">-${s.sold} ${CONFIG.TOKEN_SYMBOL}</span>
                <span class="shame-price">${s.price}</span>
            </div>
            <span class="shame-tag">confirmed gay</span>
        `;
        grid.appendChild(card);

        setTimeout(() => {
            card.style.transition = 'opacity 0.3s';
            card.style.opacity = '1';
        }, 50);
    });
}

// smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});
