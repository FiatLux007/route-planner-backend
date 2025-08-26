const express = require('express');
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

        const sql = `
            INSERT INTO drivers (
                name, email, phone, license_number, vehicle_type,
                vehicle_capacity, hourly_rate
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

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

module.exports = router;