const errorHandler = (err, req, res, next) => {
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

module.exports = errorHandler;