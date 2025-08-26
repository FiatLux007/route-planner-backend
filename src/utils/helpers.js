/**
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
};