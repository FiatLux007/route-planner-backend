# Route Planner Backend

Route planning and optimization system for YBD Express.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Test the API:
```bash
curl http://localhost:3000/api/health
```

## API Endpoints

### Jobs
- GET /api/jobs - Get all jobs
- POST /api/jobs - Create new job
- GET /api/jobs/:id - Get job by ID
- PUT /api/jobs/:id - Update job
- DELETE /api/jobs/:id - Delete job

### Drivers
- GET /api/drivers - Get all drivers
- POST /api/drivers - Create new driver
- GET /api/drivers/:id - Get driver by ID
- PUT /api/drivers/:id - Update driver

### Routes
- GET /api/routes - Get all routes
- POST /api/routes/optimize - Optimize route

## Database

Uses SQLite database with the following tables:
- jobs
- drivers  
- routes

The database is automatically created on first run.