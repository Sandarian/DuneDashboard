# AppDashboard

AppDashboard is a lightweight Node.js/HTML application designed to manage and launch multiple self-hosted web applications on a Raspberry Pi.

## Managed Applications
The dashboard currently supports the following applications:

### 1. Provision
- **Description:** A food inventory management system.
- **Backend Port:** 8001 (FastAPI)
- **Frontend Port:** 3001 (React/Vite)
- **Startup:** Managed via Docker Compose (`docker-compose up -d`)

### 2. Chore Chart
- **Description:** A chore management application for tracking household duties.
- **Backend Port:** 8000 (FastAPI)
- **Frontend Port:** 3000 (React/Vite)
- **Startup:** Managed via Docker Compose (`docker-compose up -d`)

### 3. D&D Character Builder
- **Description:** A comprehensive character builder and DM tool for Dungeons & Dragons.
- **Backend Port:** 3002 (Express w/ Socket.io)
- **Frontend Port:** 5173 (React/Vite)
- **Startup:** Runs natively outside Docker via `npm run dev`. On production (Pi), it is recommended to run its server with PM2 and serve its dist folder, or run concurrently if strictly using the dev server.

## Installation and Setup

### 1. Pre-requisites
- **Node.js**: Ensure Node.js is installed on your Raspberry Pi.
- **Docker & Docker Compose**: Ensure Docker is installed for Provision and Chore Chart.
- **PM2** (Optional but recommended): For running the Node apps in the background. Install via `npm install -g pm2`.

### 2. Setup AppDashboard
1. Clone this repository to your Raspberry Pi.
2. Navigate to the AppDashboard folder: `cd AppDashboard`
3. Install dependencies: `npm install`
4. Make sure the absolute paths in `server.js` matching `cwd` are correct for where you placed the application folders on your Raspberry Pi.

### 3. Running AppDashboard automatically on boot
Using PM2:
```bash
pm2 start server.js --name "appdashboard"
pm2 save
pm2 startup
```

This ensures the dashboard will always be running on **Port 4000** when the Pi turns on.

## Development Setup (Local)
Run the server locally with:
```bash
node server.js
```
Then navigate to `http://localhost:4000` to view the dashboard in your browser.
