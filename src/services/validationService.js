const validator = require('validator');

class ValidationService {
    validateJobData(data) {
        const errors = [];

        if (!data.pickup_address || data.pickup_address.trim().length === 0) {
            errors.push('Pickup address is required');
        }

        if (!data.delivery_address || data.delivery_address.trim().length === 0) {
            errors.push('Delivery address is required');
        }

        if (data.weight && (isNaN(data.weight) || data.weight < 0)) {
            errors.push('Weight must be a positive number');
        }

        if (data.volume && (isNaN(data.volume) || data.volume < 0)) {
            errors.push('Volume must be a positive number');
        }

        if (data.priority && (!Number.isInteger(data.priority) || data.priority < 1 || data.priority > 5)) {
            errors.push('Priority must be an integer between 1 and 5');
        }

        return errors;
    }

    validateDriverData(data) {
        const errors = [];

        if (!data.name || data.name.trim().length === 0) {
            errors.push('Driver name is required');
        }

        if (data.email && !validator.isEmail(data.email)) {
            errors.push('Invalid email address');
        }

        if (data.phone && !validator.isMobilePhone(data.phone, 'any')) {
            errors.push('Invalid phone number');
        }

        if (data.vehicle_capacity && (isNaN(data.vehicle_capacity) || data.vehicle_capacity <= 0)) {
            errors.push('Vehicle capacity must be a positive number');
        }

        if (data.hourly_rate && (isNaN(data.hourly_rate) || data.hourly_rate <= 0)) {
            errors.push('Hourly rate must be a positive number');
        }

        return errors;
    }

    validateCoordinates(lat, lng) {
        const errors = [];

        if (isNaN(lat) || lat < -90 || lat > 90) {
            errors.push('Latitude must be between -90 and 90');
        }

        if (isNaN(lng) || lng < -180 || lng > 180) {
            errors.push('Longitude must be between -180 and 180');
        }

        return errors;
    }
}

module.exports = new ValidationService();