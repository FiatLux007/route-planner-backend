const validationService = require('../services/validationService');

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
};