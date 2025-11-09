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
    if (!chartElement) return; // Pastikan elemen ditemukan

    chartElement.innerHTML = ''; // Kosongkan container

    pairs.forEach(pair => {
        const [name1, name2, gender] = pair;

        // 1. Buat elemen Meja (Table Pair)
        const tablePairDiv = document.createElement('div');
        tablePairDiv.classList.add('table-pair');

        // 2. Buat elemen Kursi 1
        const seat1Div = document.createElement('div');
        seat1Div.classList.add('seat', gender); // Tambahkan kelas gender untuk styling
        seat1Div.textContent = name1;

        // 3. Buat elemen Kursi 2
        const seat2Div = document.createElement('div');
        seat2Div.classList.add('seat', gender); // Tambahkan kelas gender untuk styling
        seat2Div.textContent = name2;
        
        // Catatan: Anda bisa menambahkan logika di sini untuk tempat duduk sisa ganjil

        // Gabungkan kursi ke meja
        tablePairDiv.appendChild(seat1Div);
        tablePairDiv.appendChild(seat2Div);

        // Gabungkan meja ke chart container
        chartElement.appendChild(tablePairDiv);
    });
}

// --- 4. Eksekusi ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Dapatkan semua pasangan meja
    const seatingPairs = createSeatingPairs(rawData);
    
    // 2. Tampilkan di web
    renderSeatingChart(seatingPairs);
});
