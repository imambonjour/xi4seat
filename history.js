// --- 1. Fungsi Rendering (Copy dari script.js untuk konsistensi) ---

function renderSeatingChart(pairs, containerId) {
    const chartElement = document.getElementById(containerId);
    if (!chartElement) return;

    chartElement.innerHTML = '';

    const totalPairs = pairs.length;
    const lastRowStartIndex = Math.floor((totalPairs - 1) / 4) * 4;
    const lastRowPairsCount = totalPairs - lastRowStartIndex;

    pairs.forEach((pair, index) => {
        const [name1, name2, gender] = pair;

        if (index === lastRowStartIndex + 1 && lastRowPairsCount === 2) {
            const spacer1 = document.createElement('div');
            spacer1.classList.add('spacer');
            const spacer2 = document.createElement('div');
            spacer2.classList.add('spacer');
            chartElement.appendChild(spacer1);
            chartElement.appendChild(spacer2);
        }

        const tableCard = document.createElement('div');
        tableCard.classList.add('table-card');

        const createSeat = (name, gender) => {
            const seatDiv = document.createElement('div');
            seatDiv.classList.add('seat-item', gender);

            const label = document.createElement('span');
            label.classList.add('seat-label');
            label.textContent = gender === 'L' ? 'Laki-laki' : 'Perempuan';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = name;

            seatDiv.appendChild(label);
            seatDiv.appendChild(nameSpan);
            return seatDiv;
        };

        const seat1 = createSeat(name1, gender);
        const seat2 = createSeat(name2, gender);

        tableCard.appendChild(seat1);
        tableCard.appendChild(seat2);

        chartElement.appendChild(tableCard);
    });
}

// --- 2. Logic History ---

async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const history = await response.json();

        const listElement = document.getElementById('history-list');
        listElement.innerHTML = '';

        if (history.length === 0) {
            listElement.innerHTML = '<div class="app-subtitle">Belum ada riwayat konfigurasi.</div>';
            return;
        }

        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');

            // Format date for better readability
            let date;
            const tsStr = item.timestamp;

            if (tsStr.includes('_')) {
                // New format: DD-MM-YYYY_HH-mm-ss
                const [dmy, hms] = tsStr.split('_');
                const [d, m, y] = dmy.split('-');
                const [h, min, s] = hms.split('-');
                date = new Date(y, m - 1, d, h, min, s || 0);
            } else if (/^\d{10,}$/.test(tsStr)) {
                // Unix timestamp (ms)
                date = new Date(parseInt(tsStr));
            } else {
                // Fallback for any older format strings
                date = new Date(tsStr.replace(/-/g, ':'));
            }

            let dateStr;
            if (date && !isNaN(date.getTime())) {
                dateStr = date.toLocaleString('id-ID', {
                    dateStyle: 'long',
                    timeStyle: 'short'
                });
            } else {
                dateStr = tsStr.replace(/_/g, ' '); // Fallback to raw string with space
            }

            historyItem.innerHTML = `
                <div class="history-info">
                    <span class="history-date">${dateStr}</span>
                    <span class="history-file">${item.filename}</span>
                </div>
                <div class="history-action">
                    <span class="btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Lihat Layout</span>
                </div>
            `;

            historyItem.addEventListener('click', () => showLayout(item.filename, dateStr));
            listElement.appendChild(historyItem);
        });
    } catch (error) {
        console.error("Error loading history:", error);
    }
}

async function showLayout(filename, dateStr) {
    try {
        const response = await fetch(`/api/history/${filename}`);
        const config = await response.json();

        const modal = document.getElementById('layout-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalSubtitle = document.getElementById('modal-subtitle');

        modalTitle.textContent = "Layout Konfigurasi";
        modalSubtitle.textContent = dateStr;

        renderSeatingChart(config, 'modal-seating-chart');

        modal.style.display = 'block';
    } catch (error) {
        console.error("Error showing layout:", error);
    }
}

// Modal closing logic
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();

    const modal = document.getElementById('layout-modal');
    const closeBtn = document.querySelector('.close-modal');

    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});
