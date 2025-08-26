const express = require('express');
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

module.exports = app;