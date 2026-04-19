import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to find app directories case-insensitively in the parent folder
function findAppDir(targetNames) {
    const parentDir = path.join(__dirname, '..');
    if (fs.existsSync(parentDir)) {
        const dirs = fs.readdirSync(parentDir);
        for (const targetName of targetNames) {
            const match = dirs.find(d => d.toLowerCase() === targetName.toLowerCase());
            if (match) {
                return path.join(parentDir, match);
            }
        }
    }
    return path.join(parentDir, targetNames[0]);
}


// Configuration for the apps to manage
const apps = {
    provision: {
        id: 'provision',
        name: 'Provision',
        port: 3001,
        startCmd: 'docker compose up -d',
        stopCmd: 'docker compose down',
        cwd: findAppDir(['Provision'])
    },
    'dnd-builder': {
        id: 'dnd-builder',
        name: 'D&D Character Builder',
        port: 5173,
        startCmd: 'npm run dev > /dev/null 2>&1 &',
        stopCmd: 'pkill -f "vite"',
        cwd: findAppDir(['DnDPalette'])
    },
    flavor: {
        id: 'flavor',
        name: 'Flavor',
        port: 3003,
        startCmd: 'docker compose up -d',
        stopCmd: 'docker compose down',
        cwd: findAppDir(['Flavor'])
    },
    stewardship: {
        id: 'stewardship',
        name: 'Stewardship',
        port: 3004,
        startCmd: 'docker compose up -d',
        stopCmd: 'docker compose down',
        cwd: findAppDir(['Stewardship'])
    },
    chronicle: {
        id: 'chronicle',
        name: 'Chronicle',
        port: 3005,
        startCmd: 'node server.js > /dev/null 2>&1 &',
        stopCmd: 'pkill -f "Chronicle/server.js"',
        cwd: findAppDir(['Chronicle'])
    },
    reliquary: {
        id: 'reliquary',
        name: 'Reliquary',
        port: 3006,
        startCmd: 'docker compose up -d',
        stopCmd: 'docker compose down',
        cwd: findAppDir(['Reliquary'])
    }
};

const PORT = 3000;

// Probe a port with a lightweight HTTP GET; resolves true if anything responds
function checkAppHealth(port) {
    return new Promise((resolve) => {
        const req = http.get({ hostname: 'localhost', port, path: '/', timeout: 3000 }, (res) => {
            res.resume();
            resolve(true);
        });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
    });
}

app.get('/api/apps', (req, res) => {
    res.json(Object.values(apps));
});

// Batch health check for all apps
app.get('/api/status', async (req, res) => {
    const results = await Promise.all(
        Object.values(apps).map(async (a) => ({
            id: a.id,
            running: await checkAppHealth(a.port)
        }))
    );
    res.json(results);
});

app.post('/api/apps/:id/start', (req, res) => {
    const appConfig = apps[req.params.id];
    if (!appConfig) {
        return res.status(404).json({ error: 'App not found' });
    }

    if (!fs.existsSync(appConfig.cwd)) {
        return res.status(500).json({ error: `Directory not found: ${appConfig.cwd}` });
    }

    console.log(`Starting ${appConfig.name}...`);
    exec(appConfig.startCmd, { cwd: appConfig.cwd }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error starting ${appConfig.name}:`, error.message);
            return res.status(500).json({ error: error.message });
        }
        res.json({ success: true, message: `${appConfig.name} started successfully.` });
    });
});

app.post('/api/apps/:id/stop', (req, res) => {
    const appConfig = apps[req.params.id];
    if (!appConfig) {
        return res.status(404).json({ error: 'App not found' });
    }

    if (!fs.existsSync(appConfig.cwd)) {
        return res.status(500).json({ error: `Directory not found: ${appConfig.cwd}` });
    }

    console.log(`Stopping ${appConfig.name}...`);
    exec(appConfig.stopCmd, { cwd: appConfig.cwd }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error stopping ${appConfig.name}:`, error.message);
            return res.status(500).json({ error: error.message });
        }
        res.json({ success: true, message: `${appConfig.name} stopped successfully.` });
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Oraclery running at http://localhost:${PORT}`);
});
