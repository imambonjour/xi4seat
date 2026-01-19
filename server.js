const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname)));

const CACHE_DIR = path.join(__dirname, 'cache');
const LOG_FILE = path.join(__dirname, 'logs', 'reshuffle.log');

// Ensure directories exist
fs.ensureDirSync(CACHE_DIR);
fs.ensureDirSync(path.dirname(LOG_FILE));

// Get the latest config
app.get('/api/config/latest', async (req, res) => {
    try {
        const files = await fs.readdir(CACHE_DIR);
        if (files.length === 0) {
            return res.json(null);
        }
        // Sort by filename (timestamp based) descending
        const latestFile = files.sort().reverse()[0];
        const content = await fs.readJson(path.join(CACHE_DIR, latestFile));
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read latest config' });
    }
});

// Save a new config
app.post('/api/config', async (req, res) => {
    try {
        const config = req.body;
        const now = new Date();
        // Format: DD-MM-YYYY_HH-mm-ss for human readability
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        const timestamp = `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;
        const filename = `config-${timestamp}.json`;
        const filePath = path.join(CACHE_DIR, filename);

        // Save config to cache folder (human readable)
        await fs.writeJson(filePath, config, { spaces: 2 });

        // Log the event
        const dateOptions = { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium' };
        const logTime = new Intl.DateTimeFormat('id-ID', dateOptions).format(now);
        const logEntry = `[${logTime}] Reshuffle triggered. Saved to ${filename}\n`;
        await fs.appendFile(LOG_FILE, logEntry);

        res.json({ message: 'Config saved', filename });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to save config' });
    }
});

// Get history of configs
app.get('/api/history', async (req, res) => {
    try {
        const files = await fs.readdir(CACHE_DIR);
        // Sort by filename descending
        const history = files
            .filter(file => file.startsWith('config-') && file.endsWith('.json'))
            .map(file => {
                const tsStr = file.replace('config-', '').replace('.json', '');
                return {
                    filename: file,
                    timestamp: tsStr
                };
            })
            // Custom sort to handle DD-MM-YYYY_HH-mm-ss
            .sort((a, b) => {
                const parseTS = (ts) => {
                    const [dmy, hms] = ts.split('_');
                    const [d, m, y] = dmy.split('-');
                    const [h, mm, s] = hms.split('-');
                    return new Date(y, m - 1, d, h, mm, s).getTime();
                };
                return parseTS(b.timestamp) - parseTS(a.timestamp);
            });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load history' });
    }
});

// Get specific config
app.get('/api/history/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(CACHE_DIR, filename);
        if (await fs.pathExists(filePath)) {
            const content = await fs.readJson(filePath);
            res.json(content);
        } else {
            res.status(404).json({ error: 'Config not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to read config' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
