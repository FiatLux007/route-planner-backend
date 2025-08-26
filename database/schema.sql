-- Jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pickup_address TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    pickup_lat REAL,
    pickup_lng REAL,
    delivery_lat REAL,
    delivery_lng REAL,
    weight REAL DEFAULT 0,
    volume REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    time_window_start TEXT,
    time_window_end TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table
CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    license_number TEXT,
    vehicle_type TEXT DEFAULT 'truck',
    vehicle_capacity REAL DEFAULT 1000,
    current_location_lat REAL,
    current_location_lng REAL,
    status TEXT DEFAULT 'available',
    hourly_rate REAL DEFAULT 25.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Routes table
CREATE TABLE IF NOT EXISTS routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id INTEGER,
    job_sequence TEXT, -- JSON format storing job order
    total_distance REAL DEFAULT 0,
    estimated_time INTEGER DEFAULT 0,
    total_cost REAL DEFAULT 0,
    optimization_method TEXT DEFAULT 'manual',
    status TEXT DEFAULT 'planned',
    start_location_lat REAL,
    start_location_lng REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES drivers (id)
);

-- Indexes for better performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_routes_driver_id ON routes(driver_id);
CREATE INDEX idx_routes_status ON routes(status);