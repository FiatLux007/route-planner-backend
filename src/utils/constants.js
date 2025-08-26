// Application constants

const JOB_STATUS = {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const DRIVER_STATUS = {
    AVAILABLE: 'available',
    BUSY: 'busy',
    OFFLINE: 'offline',
    ON_BREAK: 'on_break'
};

const ROUTE_STATUS = {
    PLANNED: 'planned',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
};

const VEHICLE_TYPES = {
    VAN: 'van',
    TRUCK: 'truck',
    PICKUP: 'pickup',
    MOTORCYCLE: 'motorcycle'
};

const OPTIMIZATION_METHODS = {
    MANUAL: 'manual',
    NEAREST_NEIGHBOR: 'nearest_neighbor',
    GREEDY: 'greedy',
    TWO_OPT: '2-opt',
    GENETIC: 'genetic'
};

const PRIORITY_LEVELS = {
    LOW: 1,
    NORMAL: 2,
    HIGH: 3,
    URGENT: 4,
    CRITICAL: 5
};

const DEFAULT_SETTINGS = {
    MAX_JOBS_PER_ROUTE: 20,
    DEFAULT_VEHICLE_CAPACITY: 1000, // kg
    DEFAULT_HOURLY_RATE: 25.0, // USD
    MAX_ROUTE_DISTANCE: 500000, // 500 km in meters
    MAX_ROUTE_DURATION: 28800 // 8 hours in seconds
};

const API_LIMITS = {
    MAX_JOBS_PER_REQUEST: 100,
    MAX_DRIVERS_PER_REQUEST: 50,
    MAX_ROUTES_PER_REQUEST: 50,
    DEFAULT_PAGE_SIZE: 20
};

module.exports = {
    JOB_STATUS,
    DRIVER_STATUS,
    ROUTE_STATUS,
    VEHICLE_TYPES,
    OPTIMIZATION_METHODS,
    PRIORITY_LEVELS,
    DEFAULT_SETTINGS,
    API_LIMITS
};