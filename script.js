// --- 1. Data dari name.csv (Sudah Dikonversi) ---
const rawData = [
    { nama: "ADILAH NUR FARHANAH", gender: "P" },
    { nama: "ARI FIDRIYANSYAH", gender: "L" },
    { nama: "FATHIYA ISNAINI SOLIHA", gender: "P" },
    { nama: "HABIBI RIFKY AL SHIRADZI", gender: "L" },
    { nama: "HALIMATUN SA'DIAH", gender: "P" },
    { nama: "HUMAIRA WINIIE SALIMAH", gender: "P" },
    { nama: "IMAM AHMAD SUJIWO", gender: "L" },
    { nama: "INAYA NUR FAKHIRA", gender: "P" },
    { nama: "INAYAH SYAUQI KAMILA", gender: "P" },
    { nama: "KAFFAH ABDULAH", gender: "L" },
    { nama: "KAILA DAVINA MARUF", gender: "P" },
    { nama: "KANIA HAFSYAH RAMADHANI", gender: "P" },
    { nama: "MAHIA NARASAKHI MUHAQIQIN", gender: "L" },
    { nama: "MIEZA CAHYA JOMANTARA", gender: "P" },
    { nama: "MOHAMMAD FADLI RIANATA", gender: "L" },
    { nama: "MUHAMAD RAJIB ABDUL ROHMAN", gender: "L" },
    { nama: "MUHAMMAD ALYAFI ABDILLAH", gender: "L" },
    { nama: "MUHAMMAD DZIKRIE ALDIANSYAH", gender: "L" },
    { nama: "MUHAMMAD HAMZAH AL FARISI", gender: "L" },
    { nama: "MUHAMMAD TEGAR CADMIESA SAPUTRA", gender: "L" },
    { nama: "NABIL UMAR", gender: "L" },
    { nama: "NADIRA HIKMATUL ULYA", gender: "P" },
    { nama: "NAHDAH RIHHADATUL A'ISY", gender: "P" },
    { nama: "NAILAH AZKA SYAHIDAH", gender: "P" },
    { nama: "NARESWARI ADKHA NASHIRAH", gender: "P" },
    { nama: "NAUFAL IBRAHIM ABDILLAH", gender: "L" },
    { nama: "NAUFAL MUHAMMAD ZAKI", gender: "L" },
    { nama: "NAUFAL RAFIFAYDIN FAJRIANSYAH", gender: "L" },
    { nama: "NAURA SABIYA HUSNA ADINATA", gender: "P" },
    { nama: "NOVAL TANJUNG", gender: "L" },
    { nama: "NURUL JANNATA", gender: "P" },
    { nama: "REGITHA AULIA MAHARANI", gender: "P" },
    { nama: "SHAFFIRA PUTRI VALENTINE", gender: "P" },
    { nama: "SYAFIQ ALFATH MAULANA", gender: "L" },
    { nama: "ZAHIRAH DEGES RAELI SIREGAR", gender: "P" },
    { nama: "MUHAMMAD FIRJATULLAH ENDIE", gender: "L" },
];

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

// --- 4. Fungsi Persistence ---

const STORAGE_KEY = 'seating_arrangement';

function saveSeatingPairs(pairs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pairs));
}

function loadSeatingPairs() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
}

// --- 5. Eksekusi dan Event Listeners ---

function initSeating(forceReshuffle = false) {
    let seatingPairs;

    if (!forceReshuffle) {
        seatingPairs = loadSeatingPairs();
    }

    if (!seatingPairs) {
        console.log("Generating new seating arrangement...");
        seatingPairs = createSeatingPairs(rawData);
        saveSeatingPairs(seatingPairs);
    } else {
        console.log("Loading seating arrangement from storage.");
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
