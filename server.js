import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration for the apps to manage
const apps = {
    provision: {
        id: 'provision',
        name: 'Provision',
        port: 3001,
        // Using common paths, these might need adjusting on the actual Pi
        startCmd: 'docker-compose up -d',
        stopCmd: 'docker-compose down',
        cwd: '/Users/andrewsanders/Documents/DevProjects/Provision'
    },
    'chore-chart': {
        id: 'chore-chart',
        name: 'Chore Chart',
        port: 3000,
        startCmd: 'docker-compose up -d',
        stopCmd: 'docker-compose down',
        cwd: '/Users/andrewsanders/Documents/DevProjects/chore-chart'
    },
    'dnd-builder': {
        id: 'dnd-builder',
        name: 'D&D Character Builder',
        port: 5173,
        // On the Pi, this will likely be managed by PM2, but for local testing:
        startCmd: 'npm run dev > /dev/null 2>&1 &',
        stopCmd: 'pkill -f "vite"', // Needs refinement for production
        cwd: '/Users/andrewsanders/Documents/DevProjects/DnDCharacterBuilder'
    }
};

const PORT = 4000;

app.get('/api/apps', (req, res) => {
    res.json(Object.values(apps));
});

app.post('/api/apps/:id/start', (req, res) => {
    const appConfig = apps[req.params.id];
    if (!appConfig) {
        return res.status(404).json({ error: 'App not found' });
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

    console.log(`Stopping ${appConfig.name}...`);
    exec(appConfig.stopCmd, { cwd: appConfig.cwd }, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error stopping ${appConfig.name}:`, error.message);
            return res.status(500).json({ error: error.message });
        }
        res.json({ success: true, message: `${appConfig.name} stopped successfully.` });
    });
});

app.listen(PORT, () => {
    console.log(`Dashboard server running on http://localhost:${PORT}`);
});
