# Oraclery

Oraclery is a lightweight Node.js/HTML dashboard for managing and launching self-hosted home applications.

## Managed Applications

### 1. Provision
- **Description:** Food inventory and grocery list manager.
- **Backend Port:** 8001 (FastAPI)
- **Frontend Port:** 3001 (React/Vite)
- **Startup:** Docker Compose (`docker compose up -d`)

### 2. D&D Character Builder
- **Description:** Character builder and DM toolset for Dungeons & Dragons with real-time combat tracking.
- **Backend Port:** 3002 (Express + Socket.io)
- **Frontend Port:** 5173 (React/Vite)
- **Startup:** `npm run dev` (dev) or PM2 in production

### 3. Flavor
- **Description:** Weekly menu planner with Claude-driven menu generation and recipe search.
- **Backend Port:** 8003 (FastAPI)
- **Frontend Port:** 3003 (React/Vite)
- **Startup:** Docker Compose (`docker compose up -d`)

### 4. Stewardship
- **Description:** Household chore manager with scheduling, calendar views, and statistics.
- **Backend Port:** 8000 (FastAPI)
- **Frontend Port:** 3004 (React/Vite)
- **Startup:** Docker Compose (`docker compose up -d`)

### 5. Chronicle
- **Description:** D&D campaign organizer with story graph, characters, encounters, and more.
- **Port:** 3005 (Express, serves frontend and API)
- **Startup:** `npm start`

## Installation and Setup

### Prerequisites
- **Node.js** with **npm**
- **Docker & Docker Compose** — for Provision, Flavor, and Stewardship
- **PM2** — for running Oraclery (and optionally DnDPalette) in the background: `npm install -g pm2`

### Setup
1. Clone this repository.
2. Navigate to the Oraclery folder and install dependencies:
   ```bash
   npm install
   ```
3. Ensure the sibling app folders exist at the expected relative paths.

### Running on boot with PM2
```bash
pm2 start server.js --name "oraclery"
pm2 save
pm2 startup
```
Then run the `sudo` command that `pm2 startup` outputs to register the systemd service.

Oraclery runs on **port 3000**.

## Development
```bash
node server.js
```
Then open `http://localhost:3000`.
