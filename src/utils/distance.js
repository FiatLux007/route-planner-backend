// Utility functions for distance and time calculations

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
};