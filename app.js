// HOLD OR GAY - Real blockchain data only
const CONFIG = {
    API_URL: '/api/data',
    TOKEN_SYMBOL: '$HOG',
    POLL_INTERVAL: 30000
};

let sellers = [];
let holders = [];
let isLoading = true;

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    setupTicker();
    startPolling();
});

async function loadData() {
    try {
        isLoading = true;
        showLoading();

        const response = await fetch(CONFIG.API_URL);
        const data = await response.json();

        if (data.error) {
            console.error('API error:', data.error);
            showError();
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
        console.error('failed to load:', err);
        showError();
    }
}

function showLoading() {
    const grid = document.getElementById('shame-grid');
    const lb = document.getElementById('lb-body');
    const feed = document.getElementById('feed');

    if (grid) grid.innerHTML = '<div class="loading-msg">scanning blockchain for gays...</div>';
    if (lb) lb.innerHTML = '<div class="loading-msg">finding the real chads...</div>';
    if (feed) feed.innerHTML = '<div class="loading-msg">connecting to helius...</div>';
}

function showError() {
    const grid = document.getElementById('shame-grid');
    const lb = document.getElementById('lb-body');

    if (grid) grid.innerHTML = '<div class="loading-msg">couldnt load gays rn. try again later</div>';
    if (lb) lb.innerHTML = '<div class="loading-msg">chads are hiding. try again</div>';

    updateStatsZero();
}

function updateStatsZero() {
    const els = ['holders', 'gays', 'gay-count', 'mcap'];
    els.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = id === 'mcap' ? '$0' : '0';
    });
}

function renderSellers() {
    const grid = document.getElementById('shame-grid');
    if (!grid) return;

    if (sellers.length === 0) {
        grid.innerHTML = '<div class="loading-msg">no gays detected yet. everyone still holding</div>';
        return;
    }

    grid.innerHTML = sellers.slice(0, 9).map(s => `
        <div class="shame-card">
            <div class="shame-wallet">${s.wallet}</div>
            <div class="shame-time">${s.time}</div>
            <div class="shame-info">
                <span class="shame-sold">-${s.amount} ${CONFIG.TOKEN_SYMBOL}</span>
                <span class="shame-price">${s.type || 'SELL'}</span>
            </div>
            <span class="shame-tag">confirmed gay</span>
        </div>
    `).join('');
}

function renderHolders() {
    const body = document.getElementById('lb-body');
    if (!body) return;

    if (holders.length === 0) {
        body.innerHTML = '<div class="loading-msg">no holders found yet</div>';
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
                <span class="lb-days">hodling</span>
            </div>
        `;
    }).join('');
}

function renderFeed() {
    const feed = document.getElementById('feed');
    if (!feed) return;

    if (sellers.length === 0) {
        feed.innerHTML = '<div class="loading-msg">no jeets detected. everyone diamond hands rn</div>';
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

function setupTicker() {
    const ticker = document.getElementById('ticker');
    if (!ticker) return;

    const updateTicker = () => {
        if (sellers.length === 0) {
            ticker.innerHTML = '<span>no jeets detected... yet</span>';
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

function updateStats() {
    const holdersEl = document.getElementById('holders');
    const gaysEl = document.getElementById('gays');
    const gayCountEl = document.getElementById('gay-count');
    const mcapEl = document.getElementById('mcap');

    // use real counts
    const holderCount = holders.length;
    const gayCount = sellers.length;

    if (holdersEl) animateNumber(holdersEl, holderCount > 0 ? holderCount : 0);
    if (gaysEl) animateNumber(gaysEl, gayCount > 0 ? gayCount : 0);
    if (gayCountEl) animateNumber(gayCountEl, gayCount > 0 ? gayCount : 0);
    if (mcapEl) mcapEl.textContent = 'live';
}

function animateNumber(el, target) {
    if (!el) return;
    if (target === 0) {
        el.textContent = '0';
        return;
    }
    let current = 0;
    const increment = Math.max(1, target / 30);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = Math.floor(current).toLocaleString();
    }, 30);
}

function startPolling() {
    setInterval(async () => {
        try {
            const response = await fetch(`${CONFIG.API_URL}?type=transactions`);
            const newSellers = await response.json();

            if (Array.isArray(newSellers) && newSellers.length > 0) {
                const newOnes = newSellers.filter(ns =>
                    !sellers.find(s => s.tx === ns.tx)
                );

                if (newOnes.length > 0) {
                    sellers = newSellers;
                    renderSellers();
                    renderFeed();
                    showNewJeetAlert(newOnes.length);
                }
            }
        } catch (err) {
            console.error('poll error:', err);
        }
    }, CONFIG.POLL_INTERVAL);
}

function showNewJeetAlert(count) {
    const label = document.querySelector('.ticker-label');
    if (label) {
        label.style.color = '#00ff00';
        label.textContent = `NEW GAY DETECTED x${count}:`;
        setTimeout(() => {
            label.style.color = '#ff0000';
            label.textContent = 'JEET ALERT:';
        }, 3000);
    }
}

function copyCA() {
    const ca = document.getElementById('ca').textContent;
    if (ca === 'TBA') {
        alert('CA coming soon');
        return;
    }
    navigator.clipboard.writeText(ca).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'copied!';
        setTimeout(() => btn.textContent = 'copy', 2000);
    });
}

function loadMore() {
    const grid = document.getElementById('shame-grid');
    const currentCount = grid.querySelectorAll('.shame-card').length;
    const newSellers = sellers.slice(currentCount, currentCount + 6);

    if (newSellers.length === 0) {
        alert('thats all the gays we found');
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
                <span class="shame-price">${s.type || 'SELL'}</span>
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

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
});
