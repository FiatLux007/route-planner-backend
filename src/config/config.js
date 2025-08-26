require('dotenv').config();

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
};