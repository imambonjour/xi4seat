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
const CURRENT_CONFIG_FILE = path.join(__dirname, 'current.json');
const CURRENT_NAMES_FILE = path.join(__dirname, 'name.csv');


// Ensure directories exist
fs.ensureDirSync(CACHE_DIR);
fs.ensureDirSync(path.dirname(LOG_FILE));

// Get names from CSV
app.get('/api/names', async (req, res) => {
    try {
        if (!(await fs.pathExists(CURRENT_NAMES_FILE))) {
            return res.status(404).json({ error: 'name.csv not found' });
        }
        const csvContent = await fs.readFile(CURRENT_NAMES_FILE, 'utf-8');
        const lines = csvContent.trim().split('\n');
        const names = lines.map(line => {
            const [nama, gender] = line.split(',').map(s => s.trim());
            return { nama, gender };
        });
        res.json(names);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to read names from CSV' });
    }
});

// Get the latest config
app.get('/api/config/latest', async (req, res) => {
    try {
        if (await fs.pathExists(CURRENT_CONFIG_FILE)) {
            const content = await fs.readJson(CURRENT_CONFIG_FILE);
            return res.json(content);
        }

        // Fallback: Check cache if current.json doesn't exist
        const files = await fs.readdir(CACHE_DIR);
        if (files.length === 0) {
            return res.json(null);
        }
        // Sort by filename (timestamp based) descending
        const latestFile = files.sort().reverse()[0];
        const content = await fs.readJson(path.join(CACHE_DIR, latestFile));
        res.json(content);
    } catch (error) {
        console.error(error);
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

        // 1. If current.json exists, move it to cache
        if (await fs.pathExists(CURRENT_CONFIG_FILE)) {
            const oldConfig = await fs.readJson(CURRENT_CONFIG_FILE);
            // We use the timestamp of WHEN it was saved to cache, 
            // but ideally we'd want the original timestamp if we tracked it.
            // For now, moving it to cache with current timestamp is standard.
            const archivedFilename = `config-${timestamp}.json`;
            await fs.writeJson(path.join(CACHE_DIR, archivedFilename), oldConfig, { spaces: 2 });

            // Log the archiving event
            const dateOptions = { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium' };
            const logTime = new Intl.DateTimeFormat('id-ID', dateOptions).format(now);
            const logEntry = `[${logTime}] Old config archived to ${archivedFilename}\n`;
            await fs.appendFile(LOG_FILE, logEntry);
        }

        // 2. Save new config as current.json
        await fs.writeJson(CURRENT_CONFIG_FILE, config, { spaces: 2 });

        // Log the new config event
        const dateOptions = { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium' };
        const logTime = new Intl.DateTimeFormat('id-ID', dateOptions).format(now);
        const logEntry = `[${logTime}] New reshuffle triggered. Saved to current.json\n`;
        await fs.appendFile(LOG_FILE, logEntry);

        res.json({ message: 'Config saved as current.json' });
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
            // Custom sort to handle DD-MM-YYYY_HH-mm-ss and ISO/Unix formats
            .sort((a, b) => {
                const parseTS = (ts) => {
                    if (ts.includes('_')) {
                        const [dmy, hms] = ts.split('_');
                        const [d, m, y] = dmy.split('-');
                        const [h, mm, s] = hms.split('-');
                        return new Date(y, m - 1, d, h, mm, s || 0).getTime();
                    }
                    if (/^\d{10,}$/.test(ts)) {
                        return parseInt(ts);
                    }
                    // Handle config-2026-01-19T21-15-31-910Z format by restoring delimiters
                    const isoCandidate = ts.replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z/, '$1-$2-$3T$4:$5:$6.$7Z');
                    let d = new Date(isoCandidate);
                    if (isNaN(d.getTime())) {
                        // Try parsing directly if replace failed
                        d = new Date(ts.replace(/-/g, ':').replace('T', ' '));
                    }
                    return isNaN(d.getTime()) ? 0 : d.getTime();
                };
                return parseTS(b.timestamp) - parseTS(a.timestamp);
            });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load history' });
    }
});

// Restoration endpoint: Restore a specific config from cache
app.post('/api/history/restore/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        const sourcePath = path.join(CACHE_DIR, filename);

        if (!(await fs.pathExists(sourcePath))) {
            return res.status(404).json({ error: 'Source config not found in cache' });
        }

        const now = new Date();
        const configToRestore = await fs.readJson(sourcePath);
        console.log(`[RESTORE] Read source file success`);

        // 1. Archive current.json if it exists by MOVING it to cache
        if (await fs.pathExists(CURRENT_CONFIG_FILE)) {
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const timestamp = `${day}-${month}-${year}_${hours}-${minutes}-${seconds}`;

            const archivedFilename = `config-${timestamp}.json`;
            const archivedPath = path.join(CACHE_DIR, archivedFilename);

            // Move the current file to cache
            await fs.move(CURRENT_CONFIG_FILE, archivedPath, { overwrite: true });

            const dateOptions = { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium' };
            const logTime = new Intl.DateTimeFormat('id-ID', dateOptions).format(now);
            const logEntry = `[${logTime}] Current config moved to cache as ${archivedFilename} during restoration\n`;
            await fs.appendFile(LOG_FILE, logEntry);
        }

        // 2. Save the selected config as current.json
        await fs.writeJson(CURRENT_CONFIG_FILE, configToRestore, { spaces: 2 });
        console.log(`[RESTORE] Success writing current.json`);

        // Log the restoration event
        const dateOptions = { timeZone: 'Asia/Jakarta', dateStyle: 'long', timeStyle: 'medium' };
        const logTime = new Intl.DateTimeFormat('id-ID', dateOptions).format(now);
        const logEntry = `[${logTime}] Config restored from ${filename}\n`;
        await fs.appendFile(LOG_FILE, logEntry);

        res.json({ message: 'Config restored successfully' });
    } catch (error) {
        console.error("Restoration Error:", error);
        res.status(500).json({ error: 'Failed to restore config', details: error.message });
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
