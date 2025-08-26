const express = require('express');
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

        const sql = `
            INSERT INTO jobs (
                pickup_address, delivery_address, pickup_lat, pickup_lng,
                delivery_lat, delivery_lng, weight, volume, priority,
                time_window_start, time_window_end, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

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

module.exports = router;