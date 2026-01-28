// --- 1. State ---
let rawData = [];


// --- 2. Fungsi Pembantu (Helper Functions) ---

// Fungsi Fisher-Yates shuffle untuk mengacak array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Fungsi untuk mengelompokkan dan membuat pasangan sejenis
function createSeatingPairs(people) {
    // Kelompokkan berdasarkan gender
    const males = people.filter(p => p.gender === 'L');
    const females = people.filter(p => p.gender === 'P');

    // Acak urutan di setiap kelompok
    shuffle(males);
    shuffle(females);

    const allPairs = [];

    // Membuat pasangan Laki-laki
    for (let i = 0; i < males.length - 1; i += 2) {
        // Pasangan 1 meja: [orang1, orang2, gender]
        allPairs.push([males[i].nama, males[i + 1].nama, 'L']);
    }
    if (males.length % 2 !== 0) {
        console.warn(`${males[males.length - 1].nama} (L) tidak mendapat pasangan dan akan ditempatkan sendiri.`);
    }

    // Membuat pasangan Perempuan
    for (let i = 0; i < females.length - 1; i += 2) {
        // Pasangan 1 meja: [orang1, orang2, gender]
        allPairs.push([females[i].nama, females[i + 1].nama, 'P']);
    }
    if (females.length % 2 !== 0) {
        console.warn(`${females[females.length - 1].nama} (P) tidak mendapat pasangan dan akan ditempatkan sendiri.`);
    }

    // Acak urutan pasangan meja (sehingga L dan P tercampur secara acak)
    shuffle(allPairs);

    return allPairs;
}


// --- 3. Fungsi Utama untuk Merender Peta Tempat Duduk ---

function renderSeatingChart(pairs) {
    const chartElement = document.getElementById('seating-chart');
    if (!chartElement) return;

    chartElement.innerHTML = '';

    const totalPairs = pairs.length;
    const lastRowStartIndex = Math.floor((totalPairs - 1) / 4) * 4;
    const lastRowPairsCount = totalPairs - lastRowStartIndex;

    pairs.forEach((pair, index) => {
        const [name1, name2, gender] = pair;

        // Special logic for the back row: if exactly 2 pairs, push to corners
        if (index === lastRowStartIndex + 1 && lastRowPairsCount === 2) {
            // Insert two spacers before the second pair of the last row
            const spacer1 = document.createElement('div');
            spacer1.classList.add('spacer');
            const spacer2 = document.createElement('div');
            spacer2.classList.add('spacer');
            chartElement.appendChild(spacer1);
            chartElement.appendChild(spacer2);
        }

        // 1. Create Table Card
        const tableCard = document.createElement('div');
        tableCard.classList.add('table-card');

        // Helper to create seat item
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

// --- 4. Fungsi Persistence (Server API) ---

async function saveSeatingPairs(pairs) {
    try {
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pairs)
        });
        if (!response.ok) throw new Error('Failed to save configuration to server');
        console.log("Config saved to server.");
        // Reload to ensure state consistency
        location.reload();
    } catch (error) {
        console.error("Error saving seating arrangement:", error);
    }
}

async function loadSeatingPairs() {
    try {
        const response = await fetch('/api/config/latest');
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("Error loading seating arrangement:", error);
        return null;
    }
}

async function loadNames() {
    try {
        const response = await fetch('/api/names');
        if (!response.ok) throw new Error('Failed to load names from server');
        return await response.json();
    } catch (error) {
        console.error("Error loading names:", error);
        return [];
    }
}


// --- 5. Eksekusi dan Event Listeners ---

async function initSeating(forceReshuffle = false) {
    let seatingPairs;

    if (!forceReshuffle) {
        seatingPairs = await loadSeatingPairs();
    }

    if (!seatingPairs || forceReshuffle) {
        console.log("Generating new seating arrangement...");
        rawData = await loadNames();
        if (rawData.length === 0) {
            console.error("No names found to generate seating.");
            return;
        }
        seatingPairs = createSeatingPairs(rawData);
        await saveSeatingPairs(seatingPairs);
    } else {
        console.log("Loading seating arrangement from server.");
    }

    renderSeatingChart(seatingPairs);
}


document.addEventListener('DOMContentLoaded', () => {
    // 1. Inisialisasi tampilan awal
    initSeating();

    // 2. Tambahkan event listener untuk tombol Reshuffle
    const reshuffleBtn = document.getElementById('reshuffle-btn');
    if (reshuffleBtn) {
        reshuffleBtn.addEventListener('click', () => {
            if (confirm('Apakah Anda yakin ingin mengacak ulang tempat duduk?')) {
                initSeating(true);
            }
        });
    }
});
