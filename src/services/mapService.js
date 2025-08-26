const axios = require('axios');
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

module.exports = new MapService();