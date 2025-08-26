const fs = require('fs');
const path = require('path');

// Project structure and file contents
const projectStructure = {
  'package.json': `{
  "name": "route-planner-backend",
  "version": "1.0.0",
  "description": "Route planning and optimization system for YBD Express",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "keywords": ["route-planning", "logistics", "optimization"],
  "author": "Siyi",
  "license": "ISC",
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "axios": "^1.5.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "body-parser": "^1.20.2",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "validator": "^13.11.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}`,

  '.env': `# Server Configuration
PORT=3000

# Database
DB_PATH=./database/routes.db

# Google Maps API (optional - get from Google Cloud Console)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# OSRM Server (for free routing)
OSRM_URL=http://router.project-osrm.org

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Environment
NODE_ENV=development`,

  '.gitignore': `# Dependencies
node_modules/

# Environment variables
.env

# Database
database/*.db
database/*.db-journal

# Logs
logs/
*.log
npm-debug.log*

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db`,

  'README.md': `# Route Planner Backend

Route planning and optimization system for YBD Express.

## Quick Start

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start development server:
\`\`\`bash
npm run dev
\`\`\`

3. Test the API:
\`\`\`bash
curl http://localhost:3000/api/health
\`\`\`

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

The database is automatically created on first run.`,

  'database/schema.sql': `-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    pickup_lat REAL,
    pickup_lng REAL,
    delivery_lat REAL,
    delivery_lng REAL,
    weight REAL DEFAULT 0,
    volume REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    time_window_start TEXT,
    time_window_end TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    license_number TEXT,
    vehicle_type TEXT DEFAULT 'truck',
    vehicle_capacity REAL DEFAULT 1000,
    current_location_lat REAL,
    current_location_lng REAL,
    status TEXT DEFAULT 'available',
    hourly_rate REAL DEFAULT 25.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id INTEGER,
    job_sequence TEXT, -- JSON format storing job order
    total_distance REAL DEFAULT 0,
    estimated_time INTEGER DEFAULT 0,
    total_cost REAL DEFAULT 0,
    optimization_method TEXT DEFAULT 'manual',
    status TEXT DEFAULT 'planned',
    start_location_lat REAL,
    start_location_lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers (id)
);

-- Indexes for better performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_routes_driver_id ON routes(driver_id);
CREATE INDEX idx_routes_status ON routes(status);`,

  'src/app.js': `const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler');
const database = require('./models/database');

// Controllers
const jobController = require('./controllers/jobController');
const driverController = require('./controllers/driverController');
const routeController = require('./controllers/routeController');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/jobs', jobController);
app.use('/api/drivers', driverController);
app.use('/api/routes', routeController);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Route Planner API is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling
app.use(errorHandler);

// Initialize database and start server
database.initialize().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log('🚛 Route Planner API running on port ' + PORT);
        console.log('📍 Health check: http://localhost:' + PORT + '/api/health');
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

module.exports = app;`,

  'src/config/config.js': `require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    database: {
        path: process.env.DB_PATH || './database/routes.db'
    },
    maps: {
        googleApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
        osrmUrl: process.env.OSRM_URL || 'http://router.project-osrm.org'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
};`,

  'src/models/database.js': `const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        this.db = null;
    }

    async initialize() {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(__dirname, '../../database/routes.db');
            
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('📦 Connected to SQLite database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            const schemaPath = path.join(__dirname, '../../database/schema.sql');
            const schema = fs.readFileSync(schemaPath, 'utf8');
            
            this.db.exec(schema, (err) => {
                if (err) {
                    console.error('Error creating tables:', err);
                    reject(err);
                } else {
                    console.log('✅ Database tables created/verified');
                    resolve();
                }
            });
        });
    }

    getDatabase() {
        return this.db;
    }

    async run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    async get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
}

module.exports = new Database();`,

  'src/controllers/jobController.js': `const express = require('express');
const router = express.Router();
const database = require('../models/database');
const mapService = require('../services/mapService');

// Get all jobs
router.get('/', async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;
        
        let sql = 'SELECT * FROM jobs';
        let params = [];
        
        if (status) {
            sql += ' WHERE status = ?';
            params.push(status);
        }
        
        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const jobs = await database.all(sql, params);
        
        res.json({
            success: true,
            data: jobs,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: jobs.length
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get single job
router.get('/:id', async (req, res) => {
    try {
        const job = await database.get('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
        
        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }
        
        res.json({
            success: true,
            data: job
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create new job
router.post('/', async (req, res) => {
    try {
        const {
            pickup_address,
            delivery_address,
            weight = 0,
            volume = 0,
            priority = 1,
            time_window_start,
            time_window_end,
            notes
        } = req.body;

        // Validate required fields
        if (!pickup_address || !delivery_address) {
            return res.status(400).json({
                success: false,
                error: 'Pickup and delivery addresses are required'
            });
        }

        // Geocode addresses
        let pickup_coords = null;
        let delivery_coords = null;

        try {
            pickup_coords = await mapService.geocodeAddress(pickup_address);
            delivery_coords = await mapService.geocodeAddress(delivery_address);
        } catch (geocodeError) {
            console.warn('Geocoding failed:', geocodeError.message);
        }

        const sql = \`
            INSERT INTO jobs (
                pickup_address, delivery_address, pickup_lat, pickup_lng,
                delivery_lat, delivery_lng, weight, volume, priority,
                time_window_start, time_window_end, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        \`;

        const params = [
            pickup_address,
            delivery_address,
            pickup_coords?.lat || null,
            pickup_coords?.lng || null,
            delivery_coords?.lat || null,
            delivery_coords?.lng || null,
            weight,
            volume,
            priority,
            time_window_start || null,
            time_window_end || null,
            notes || null
        ];

        const result = await database.run(sql, params);
        
        // Fetch the created job
        const newJob = await database.get('SELECT * FROM jobs WHERE id = ?', [result.id]);

        res.status(201).json({
            success: true,
            data: newJob
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Update job
router.put('/:id', async (req, res) => {
    try {
        const jobId = req.params.id;
        const updates = req.body;
        
        // Check if job exists
        const existingJob = await database.get('SELECT * FROM jobs WHERE id = ?', [jobId]);
        if (!existingJob) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }

        // Build dynamic update query
        const allowedFields = [
            'pickup_address', 'delivery_address', 'weight', 'volume',
            'status', 'priority', 'time_window_start', 'time_window_end', 'notes'
        ];
        
        const updateFields = [];
        const params = [];
        
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateFields.push(key + ' = ?');
                params.push(value);
            }
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid fields to update'
            });
        }
        
        // Add updated_at timestamp
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(jobId);
        
        const sql = 'UPDATE jobs SET ' + updateFields.join(', ') + ' WHERE id = ?';
        await database.run(sql, params);
        
        // Fetch updated job
        const updatedJob = await database.get('SELECT * FROM jobs WHERE id = ?', [jobId]);
        
        res.json({
            success: true,
            data: updatedJob
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Delete job
router.delete('/:id', async (req, res) => {
    try {
        const result = await database.run('DELETE FROM jobs WHERE id = ?', [req.params.id]);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Job deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;`,

  'src/controllers/driverController.js': `const express = require('express');
const router = express.Router();
const database = require('../models/database');

// Get all drivers
router.get('/', async (req, res) => {
    try {
        const { status, limit = 50 } = req.query;
        
        let sql = 'SELECT * FROM drivers';
        let params = [];
        
        if (status) {
            sql += ' WHERE status = ?';
            params.push(status);
        }
        
        sql += ' ORDER BY name LIMIT ?';
        params.push(parseInt(limit));
        
        const drivers = await database.all(sql, params);
        
        res.json({
            success: true,
            data: drivers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get single driver
router.get('/:id', async (req, res) => {
    try {
        const driver = await database.get('SELECT * FROM drivers WHERE id = ?', [req.params.id]);
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                error: 'Driver not found'
            });
        }
        
        res.json({
            success: true,
            data: driver
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Create new driver
router.post('/', async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            license_number,
            vehicle_type = 'truck',
            vehicle_capacity = 1000,
            hourly_rate = 25.0
        } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Driver name is required'
            });
        }

        const sql = \`
            INSERT INTO drivers (
                name, email, phone, license_number, vehicle_type,
                vehicle_capacity, hourly_rate
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        \`;

        const params = [name, email, phone, license_number, vehicle_type, vehicle_capacity, hourly_rate];
        const result = await database.run(sql, params);
        
        const newDriver = await database.get('SELECT * FROM drivers WHERE id = ?', [result.id]);

        res.status(201).json({
            success: true,
            data: newDriver
        });
    } catch (error) {
        if (error.message.includes('UNIQUE constraint failed')) {
            res.status(400).json({
                success: false,
                error: 'Email address already exists'
            });
        } else {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
});

// Update driver
router.put('/:id', async (req, res) => {
    try {
        const driverId = req.params.id;
        const updates = req.body;
        
        const existingDriver = await database.get('SELECT * FROM drivers WHERE id = ?', [driverId]);
        if (!existingDriver) {
            return res.status(404).json({
                success: false,
                error: 'Driver not found'
            });
        }

        const allowedFields = [
            'name', 'email', 'phone', 'license_number', 'vehicle_type',
            'vehicle_capacity', 'status', 'hourly_rate', 'current_location_lat', 'current_location_lng'
        ];
        
        const updateFields = [];
        const params = [];
        
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                updateFields.push(key + ' = ?');
                params.push(value);
            }
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No valid fields to update'
            });
        }
        
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(driverId);
        
        const sql = 'UPDATE drivers SET ' + updateFields.join(', ') + ' WHERE id = ?';
        await database.run(sql, params);
        
        const updatedDriver = await database.get('SELECT * FROM drivers WHERE id = ?', [driverId]);
        
        res.json({
            success: true,
            data: updatedDriver
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;`,

  'src/controllers/routeController.js': `const express = require('express');
const router = express.Router();
const database = require('../models/database');
const routeOptimizer = require('../services/routeOptimizer');

// Get all routes
router.get('/', async (req, res) => {
    try {
        const { driver_id, status, limit = 50 } = req.query;
        
        let sql = 'SELECT * FROM routes';
        let params = [];
        let conditions = [];
        
        if (driver_id) {
            conditions.push('driver_id = ?');
            params.push(driver_id);
        }
        
        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }
        
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }
        
        sql += ' ORDER BY created_at DESC LIMIT ?';
        params.push(parseInt(limit));
        
        const routes = await database.all(sql, params);
        
        res.json({
            success: true,
            data: routes
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get single route
router.get('/:id', async (req, res) => {
    try {
        const route = await database.get('SELECT * FROM routes WHERE id = ?', [req.params.id]);
        
        if (!route) {
            return res.status(404).json({
                success: false,
                error: 'Route not found'
            });
        }
        
        res.json({
            success: true,
            data: route
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Basic route optimization (Week 3 will enhance this)
router.post('/optimize', async (req, res) => {
    try {
        const { driver_id, job_ids, start_location } = req.body;
        
        if (!driver_id || !job_ids || job_ids.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Driver ID and job IDs are required'
            });
        }
        
        // For Week 1-2, just create a basic route
        // Week 3 will implement actual optimization algorithms
        const sql = \`
            INSERT INTO routes (
                driver_id, job_sequence, optimization_method, status
            ) VALUES (?, ?, ?, ?)
        \`;
        
        const params = [
            driver_id,
            JSON.stringify(job_ids),
            'basic',
            'planned'
        ];
        
        const result = await database.run(sql, params);
        const newRoute = await database.get('SELECT * FROM routes WHERE id = ?', [result.id]);
        
        res.status(201).json({
            success: true,
            data: newRoute,
            message: 'Route created successfully. Optimization algorithm will be enhanced in Week 3.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;`,

  'src/services/mapService.js': `const axios = require('axios');
const config = require('../config/config');

class MapService {
    constructor() {
        this.googleApiKey = config.maps.googleApiKey;
        this.osrmUrl = config.maps.osrmUrl;
    }

    async geocodeAddress(address) {
        if (!address) {
            throw new Error('Address is required for geocoding');
        }

        try {
            // Try Google Maps API first (if API key is available)
            if (this.googleApiKey && this.googleApiKey !== 'your_google_maps_api_key_here') {
                return await this.geocodeWithGoogle(address);
            }
            
            // Fallback to free geocoding service (for development)
            return await this.geocodeWithFree(address);
        } catch (error) {
            console.error('Geocoding error:', error.message);
            throw new Error('Failed to geocode address: ' + address);
        }
    }

    async geocodeWithGoogle(address) {
        const url = 'https://maps.googleapis.com/maps/api/geocode/json';
        const params = {
            address: address,
            key: this.googleApiKey
        };

        const response = await axios.get(url, { params });
        
        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const location = response.data.results[0].geometry.location;
            return {
                lat: location.lat,
                lng: location.lng,
                formatted_address: response.data.results[0].formatted_address
            };
        }
        
        throw new Error('Google Geocoding failed: ' + response.data.status);
    }

    async geocodeWithFree(address) {
        // Using Nominatim (OpenStreetMap) as free alternative
        const url = 'https://nominatim.openstreetmap.org/search';
        const params = {
            q: address,
            format: 'json',
            limit: 1
        };

        const response = await axios.get(url, { 
            params,
            headers: {
                'User-Agent': 'YBD-Express-Route-Planner/1.0'
            }
        });
        
        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                formatted_address: result.display_name
            };
        }
        
        throw new Error('Free geocoding service returned no results');
    }

    async calculateDistance(origin, destination) {
        try {
            if (this.googleApiKey && this.googleApiKey !== 'your_google_maps_api_key_here') {
                return await this.calculateDistanceWithGoogle(origin, destination);
            }
            
            return await this.calculateDistanceWithOSRM(origin, destination);
        } catch (error) {
            console.error('Distance calculation error:', error.message);
            // Fallback to straight-line distance
            return this.calculateStraightLineDistance(origin, destination);
        }
    }

    async calculateDistanceWithGoogle(origin, destination) {
        const url = 'https://maps.googleapis.com/maps/api/distancematrix/json';
        const params = {
            origins: origin.lat + ',' + origin.lng,
            destinations: destination.lat + ',' + destination.lng,
            key: this.googleApiKey,
            units: 'metric'
        };

        const response = await axios.get(url, { params });
        
        if (response.data.status === 'OK') {
            const element = response.data.rows[0].elements[0];
            if (element.status === 'OK') {
                return {
                    distance: element.distance.value, // meters
                    duration: element.duration.value, // seconds
                    distance_text: element.distance.text,
                    duration_text: element.duration.text
                };
            }
        }
        
        throw new Error('Google Distance Matrix API failed');
    }

    async calculateDistanceWithOSRM(origin, destination) {
        const url = this.osrmUrl + '/route/v1/driving/' + origin.lng + ',' + origin.lat + ';' + destination.lng + ',' + destination.lat;
        const params = {
            overview: 'false',
            steps: 'false'
        };

        const response = await axios.get(url, { params });
        
        if (response.data.code === 'Ok' && response.data.routes.length > 0) {
            const route = response.data.routes[0];
            return {
                distance: route.distance, // meters
                duration: route.duration, // seconds
                distance_text: (route.distance / 1000).toFixed(1) + ' km',
                duration_text: Math.round(route.duration / 60) + ' min'
            };
        }
        
        throw new Error('OSRM routing failed');
    }

    calculateStraightLineDistance(origin, destination) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = origin.lat * Math.PI/180;
        const φ2 = destination.lat * Math.PI/180;
        const Δφ = (destination.lat-origin.lat) * Math.PI/180;
        const Δλ = (destination.lng-origin.lng) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        const distance = R * c; // Distance in meters
        const estimatedDuration = distance / 15; // Rough estimate: 15 m/s average speed

        return {
            distance: Math.round(distance),
            duration: Math.round(estimatedDuration),
            distance_text: (distance / 1000).toFixed(1) + ' km',
            duration_text: Math.round(estimatedDuration / 60) + ' min',
            type: 'straight_line_estimate'
        };
    }
}

module.exports = new MapService();`,

  'src/services/routeOptimizer.js': `// Placeholder for Week 3 route optimization algorithms
class RouteOptimizer {
    constructor() {
        this.algorithms = ['nearest_neighbor', 'greedy', '2-opt'];
    }

    // Week 3: Implement TSP algorithms here
    async optimizeRoute(jobs, startLocation, options = {}) {
        console.log('Route optimization will be implemented in Week 3');
        
        // For now, just return jobs in their original order
        return {
            optimized_sequence: jobs.map(job => job.id),
            total_distance: 0,
            estimated_time: 0,
            method: 'placeholder'
        };
    }

    // Week 3: Implement nearest neighbor algorithm
    nearestNeighborAlgorithm(jobs, startLocation) {
        // Implementation coming in Week 3
        return jobs;
    }

    // Week 3: Calculate route metrics
    calculateRouteMetrics(sequence, jobs) {
        // Implementation coming in Week 3
        return {
            total_distance: 0,
            estimated_time: 0,
            total_cost: 0
        };
    }
}

module.exports = new RouteOptimizer();`,

  'src/services/validationService.js': `const validator = require('validator');

class ValidationService {
    validateJobData(data) {
        const errors = [];

        if (!data.pickup_address || data.pickup_address.trim().length === 0) {
            errors.push('Pickup address is required');
        }

        if (!data.delivery_address || data.delivery_address.trim().length === 0) {
            errors.push('Delivery address is required');
        }

        if (data.weight && (isNaN(data.weight) || data.weight < 0)) {
            errors.push('Weight must be a positive number');
        }

        if (data.volume && (isNaN(data.volume) || data.volume < 0)) {
            errors.push('Volume must be a positive number');
        }

        if (data.priority && (!Number.isInteger(data.priority) || data.priority < 1 || data.priority > 5)) {
            errors.push('Priority must be an integer between 1 and 5');
        }

        return errors;
    }

    validateDriverData(data) {
        const errors = [];

        if (!data.name || data.name.trim().length === 0) {
            errors.push('Driver name is required');
        }

        if (data.email && !validator.isEmail(data.email)) {
            errors.push('Invalid email address');
        }

        if (data.phone && !validator.isMobilePhone(data.phone, 'any')) {
            errors.push('Invalid phone number');
        }

        if (data.vehicle_capacity && (isNaN(data.vehicle_capacity) || data.vehicle_capacity <= 0)) {
            errors.push('Vehicle capacity must be a positive number');
        }

        if (data.hourly_rate && (isNaN(data.hourly_rate) || data.hourly_rate <= 0)) {
            errors.push('Hourly rate must be a positive number');
        }

        return errors;
    }

    validateCoordinates(lat, lng) {
        const errors = [];

        if (isNaN(lat) || lat < -90 || lat > 90) {
            errors.push('Latitude must be between -90 and 90');
        }

        if (isNaN(lng) || lng < -180 || lng > 180) {
            errors.push('Longitude must be between -180 and 180');
        }

        return errors;
    }
}

module.exports = new ValidationService();`,

  'src/middleware/errorHandler.js': `const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Default error
    let error = {
        message: err.message || 'Internal Server Error',
        status: err.statusCode || 500
    };

    // Validation errors
    if (err.name === 'ValidationError') {
        error = {
            message: 'Validation Error',
            status: 400,
            details: err.errors
        };
    }

    // Database errors
    if (err.code === 'SQLITE_CONSTRAINT') {
        error = {
            message: 'Database constraint violation',
            status: 400
        };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = {
            message: 'Invalid token',
            status: 401
        };
    }

    // Cast errors
    if (err.name === 'CastError') {
        error = {
            message: 'Invalid resource ID',
            status: 400
        };
    }

    res.status(error.status).json({
        success: false,
        error: error.message,
        details: error.details || undefined,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;`,

  'src/middleware/validation.js': `const validationService = require('../services/validationService');

const validateJob = (req, res, next) => {
    const errors = validationService.validateJobData(req.body);
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors
        });
    }
    
    next();
};

const validateDriver = (req, res, next) => {
    const errors = validationService.validateDriverData(req.body);
    
    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errors
        });
    }
    
    next();
};

module.exports = {
    validateJob,
    validateDriver
};`,

  'src/utils/distance.js': `// Utility functions for distance and time calculations

/**
 * Calculate straight-line distance between two coordinates using Haversine formula
 * @param {Object} coord1 - {lat, lng}
 * @param {Object} coord2 - {lat, lng}
 * @returns {number} Distance in meters
 */
function calculateHaversineDistance(coord1, coord2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1.lat * Math.PI/180;
    const φ2 = coord2.lat * Math.PI/180;
    const Δφ = (coord2.lat - coord1.lat) * Math.PI/180;
    const Δλ = (coord2.lng - coord1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

/**
 * Convert meters to human-readable format
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
function formatDistance(meters) {
    if (meters < 1000) {
        return Math.round(meters) + ' m';
    } else {
        return (meters / 1000).toFixed(1) + ' km';
    }
}

/**
 * Convert seconds to human-readable format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatDuration(seconds) {
    if (seconds < 60) {
        return Math.round(seconds) + ' sec';
    } else if (seconds < 3600) {
        return Math.round(seconds / 60) + ' min';
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.round((seconds % 3600) / 60);
        return hours + 'h ' + minutes + 'm';
    }
}

/**
 * Estimate driving time based on distance (rough calculation)
 * @param {number} distanceMeters - Distance in meters
 * @param {number} avgSpeedKmh - Average speed in km/h (default: 50)
 * @returns {number} Estimated time in seconds
 */
function estimateDrivingTime(distanceMeters, avgSpeedKmh = 50) {
    const distanceKm = distanceMeters / 1000;
    const timeHours = distanceKm / avgSpeedKmh;
    return Math.round(timeHours * 3600);
}

module.exports = {
    calculateHaversineDistance,
    formatDistance,
    formatDuration,
    estimateDrivingTime
};`,

  'src/utils/helpers.js': `/**
 * Generate a unique ID for routes
 * @returns {string} Unique ID
 */
function generateRouteId() {
    return 'route_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Validate if a value is a valid coordinate
 * @param {number} value - The coordinate value
 * @param {string} type - 'lat' or 'lng'
 * @returns {boolean} Is valid coordinate
 */
function isValidCoordinate(value, type) {
    if (isNaN(value)) return false;
    
    if (type === 'lat') {
        return value >= -90 && value <= 90;
    } else if (type === 'lng') {
        return value >= -180 && value <= 180;
    }
    
    return false;
}

/**
 * Deep clone an object
 * @param {Object} obj - Object to clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if an object is empty
 * @param {Object} obj - Object to check
 * @returns {boolean} Is empty
 */
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

/**
 * Format date to ISO string
 * @param {Date} date - Date object
 * @returns {string} ISO formatted date
 */
function formatDate(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
function generateRandomString(length = 10) {
    return Math.random().toString(36).substring(2, 2 + length);
}

module.exports = {
    generateRouteId,
    isValidCoordinate,
    deepClone,
    isEmpty,
    formatDate,
    generateRandomString
};`,

  'src/utils/constants.js': `// Application constants

const JOB_STATUS = {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const DRIVER_STATUS = {
    AVAILABLE: 'available',
    BUSY: 'busy',
    OFFLINE: 'offline',
    ON_BREAK: 'on_break'
};

const ROUTE_STATUS = {
    PLANNED: 'planned',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const VEHICLE_TYPES = {
    VAN: 'van',
    TRUCK: 'truck',
    PICKUP: 'pickup',
    MOTORCYCLE: 'motorcycle'
};

const OPTIMIZATION_METHODS = {
    MANUAL: 'manual',
    NEAREST_NEIGHBOR: 'nearest_neighbor',
    GREEDY: 'greedy',
    TWO_OPT: '2-opt',
    GENETIC: 'genetic'
};

const PRIORITY_LEVELS = {
    LOW: 1,
    NORMAL: 2,
    HIGH: 3,
    URGENT: 4,
    CRITICAL: 5
};

const DEFAULT_SETTINGS = {
    MAX_JOBS_PER_ROUTE: 20,
    DEFAULT_VEHICLE_CAPACITY: 1000, // kg
    DEFAULT_HOURLY_RATE: 25.0, // USD
    MAX_ROUTE_DISTANCE: 500000, // 500 km in meters
    MAX_ROUTE_DURATION: 28800 // 8 hours in seconds
};

const API_LIMITS = {
    MAX_JOBS_PER_REQUEST: 100,
    MAX_DRIVERS_PER_REQUEST: 50,
    MAX_ROUTES_PER_REQUEST: 50,
    DEFAULT_PAGE_SIZE: 20
};

module.exports = {
    JOB_STATUS,
    DRIVER_STATUS,
    ROUTE_STATUS,
    VEHICLE_TYPES,
    OPTIMIZATION_METHODS,
    PRIORITY_LEVELS,
    DEFAULT_SETTINGS,
    API_LIMITS
};`
};

// Function to create directory structure
function createDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log('📁 Created directory: ' + dirPath);
    }
}

// Function to create file with content
function createFile(filePath, content) {
    const dir = path.dirname(filePath);
    createDirectory(dir);
    
    fs.writeFileSync(filePath, content);
    console.log('📄 Created file: ' + filePath);
}

// Main setup function
function setupProject() {
    console.log('🚀 Setting up Route Planner Backend Project...');
    console.log('');
    
    // Create all directories first
    const directories = [
        'src/controllers',
        'src/services', 
        'src/models',
        'src/middleware',
        'src/utils',
        'src/config',
        'tests/controllers',
        'tests/services',
        'tests/utils',
        'database'
    ];
    
    directories.forEach(createDirectory);
    
    // Create all files
    Object.entries(projectStructure).forEach(([filePath, content]) => {
        createFile(filePath, content);
    });
    
    console.log('');
    console.log('✅ Project setup completed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Run: npm install');
    console.log('2. Update .env file with your API keys');
    console.log('3. Run: npm run dev');
    console.log('4. Test: curl http://localhost:3000/api/health');
    console.log('');
    console.log('🎯 Your Week 1-2 backend is ready!');
}

// Run the setup
setupProject();