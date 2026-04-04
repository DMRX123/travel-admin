-- =====================================================
-- Rapido-Style Database Schema Additions
-- =====================================================

-- Add driver status enum
CREATE TYPE driver_status AS ENUM ('offline', 'online', 'busy', 'on_ride');

-- Update drivers table with Rapido-style fields
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS status driver_status DEFAULT 'offline';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS current_ride_id UUID;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(10,2) DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS today_earnings DECIMAL(10,2) DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS acceptance_rate DECIMAL(5,2) DEFAULT 100;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS response_time_avg INT DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_ride_time TIMESTAMP;

-- Add surge pricing table
CREATE TABLE IF NOT EXISTS surge_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city VARCHAR(100),
    vehicle_type VARCHAR(50),
    surge_multiplier DECIMAL(3,2) DEFAULT 1.0,
    active_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add ride requests tracking
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS timeout_at TIMESTAMP;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS distance_to_pickup DECIMAL(10,2);

-- Add driver location history for analytics
CREATE TABLE IF NOT EXISTS driver_location_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES drivers(id),
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    status driver_status,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_drivers_status_location ON drivers(status, last_lat, last_lng);
CREATE INDEX IF NOT EXISTS idx_driver_location_history_driver ON driver_location_history(driver_id, recorded_at);