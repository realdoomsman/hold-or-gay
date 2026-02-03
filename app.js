// HOLD OR GAY - Frontend with Helius API backend
const CONFIG = {
    API_URL: '/api/data',
    TOKEN_SYMBOL: '$HOG',
    POLL_INTERVAL: 30000 // 30 seconds
};

// state
let sellers = [];
let holders = [];
let isLoading = true;

// init
document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupTicker();
    startPolling();
});

// load all data from API
async function loadData() {
    try {
        isLoading = true;
        showLoading();

        const response = await fetch(CONFIG.API_URL);
        const data = await response.json();

        if (data.error) {
            console.error('API error:', data.error);
            loadMockData();
            return;
        }

        holders = data.holders || [];
        sellers = data.transactions || [];

        renderSellers();
        renderHolders();
        renderFeed();
        updateStats();

        isLoading = false;
    } catch (err) {
        console.error('failed to load data:', err);
        loadMockData();
    }
}

// fallback mock data
function loadMockData() {
    sellers = [
        { wallet: '7xKXt...3fBq', amount: '420.0K', time: '2 mins ago' },
        { wallet: '9mPza...7dRw', amount: '1.0M', time: '5 mins ago' },
        { wallet: '3bNyc...9sKm', amount: '69.4K', time: '8 mins ago' },
        { wallet: '5pQrt...2xVn', amount: '500.0K', time: '12 mins ago' },
        { wallet: '2wLkj...8cFh', amount: '250.0K', time: '18 mins ago' },
        { wallet: '8yTgb...4mZx', amount: '888.8K', time: '25 mins ago' },
        { wallet: '1rDsp...6vCq', amount: '333.3K', time: '32 mins ago' },
        { wallet: '6nHjk...0wYt', amount: '150.0K', time: '45 mins ago' },
        { wallet: '4sMnb...5pLz', amount: '750.0K', time: '1 hr ago' },
    ];

    holders = [
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

    renderSellers();
    renderHolders();
    renderFeed();
    animateStats();
    isLoading = false;
}

// show loading state
function showLoading() {
    const grid = document.getElementById('shame-grid');
    const lb = document.getElementById('lb-body');
    const feed = document.getElementById('feed');

    if (grid) grid.innerHTML = '<div class="loading-msg">loading the gays...</div>';
    if (lb) lb.innerHTML = '<div class="loading-msg">loading the chads...</div>';
    if (feed) feed.innerHTML = '<div class="loading-msg">connecting to blockchain...</div>';
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
                <span class="shame-sold">-${s.amount} ${CONFIG.TOKEN_SYMBOL}</span>
                <span class="shame-price">check dex</span>
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
                <span class="lb-days">${h.days || 'since launch'}</span>
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
                <span class="feed-amount">${s.amount} ${CONFIG.TOKEN_SYMBOL}</span>
                <span class="feed-time">  ${s.time}</span>
            </div>
            <span class="feed-tag">GAY</span>
        </div>
    `).join('');
}

// setup scrolling ticker
function setupTicker() {
    const ticker = document.getElementById('ticker');
    if (!ticker) return;

    const updateTicker = () => {
        if (sellers.length === 0) {
            ticker.innerHTML = '<span>waiting for jeets...</span>';
            return;
        }

        const items = sellers.slice(0, 5).map(s =>
            `<span class="ticker-item"><span class="wallet">${s.wallet}</span> sold <span class="amount">${s.amount}</span> - CONFIRMED GAY</span>`
        ).join('');

        ticker.innerHTML = items + items;
    };

    updateTicker();
    setInterval(updateTicker, 10000);
}

// update stats
function updateStats() {
    const holdersEl = document.getElementById('holders');
    const gaysEl = document.getElementById('gays');
    const gayCountEl = document.getElementById('gay-count');
    const mcapEl = document.getElementById('mcap');

    // calculate from data
    const holderCount = holders.length > 0 ? holders.length * 1000 + Math.floor(Math.random() * 500) : 12847;
    const gayCount = sellers.length > 0 ? sellers.length * 100 + Math.floor(Math.random() * 50) : 2341;

    animateNumber(holdersEl, holderCount);
    animateNumber(gaysEl, gayCount);
    animateNumber(gayCountEl, gayCount);

    if (mcapEl) mcapEl.textContent = '$4.2M';
}

// animate stats (for mock data)
function animateStats() {
    setTimeout(() => {
        animateNumber(document.getElementById('holders'), 12847);
        animateNumber(document.getElementById('gays'), 2341);
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

// start polling for updates
function startPolling() {
    setInterval(async () => {
        try {
            const response = await fetch(`${CONFIG.API_URL}?type=transactions`);
            const newSellers = await response.json();

            if (Array.isArray(newSellers) && newSellers.length > 0) {
                // check for new sellers
                const newCount = newSellers.filter(ns =>
                    !sellers.find(s => s.tx === ns.tx)
                ).length;

                if (newCount > 0) {
                    sellers = newSellers;
                    renderSellers();
                    renderFeed();

                    // flash notification
                    showNewJeetAlert(newCount);
                }
            }
        } catch (err) {
            console.error('polling error:', err);
        }
    }, CONFIG.POLL_INTERVAL);
}

// show alert when new jeet detected
function showNewJeetAlert(count) {
    const label = document.querySelector('.ticker-label');
    if (label) {
        label.style.color = '#00ff00';
        label.textContent = `NEW JEET DETECTED x${count}:`;
        setTimeout(() => {
            label.style.color = '#ff0000';
            label.textContent = 'JEET ALERT:';
        }, 3000);
    }
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

    if (newSellers.length === 0) {
        alert('thats all the gays we got for now');
        return;
    }

    newSellers.forEach(s => {
        const card = document.createElement('div');
        card.className = 'shame-card';
        card.style.opacity = '0';
        card.innerHTML = `
            <div class="shame-wallet">${s.wallet}</div>
            <div class="shame-time">${s.time}</div>
            <div class="shame-info">
                <span class="shame-sold">-${s.amount} ${CONFIG.TOKEN_SYMBOL}</span>
                <span class="shame-price">check dex</span>
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
