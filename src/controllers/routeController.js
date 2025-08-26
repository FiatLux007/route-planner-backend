const express = require('express');
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
        const sql = `
            INSERT INTO routes (
                driver_id, job_sequence, optimization_method, status
            ) VALUES (?, ?, ?, ?)
        `;
        
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

module.exports = router;