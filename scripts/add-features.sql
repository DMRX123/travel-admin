-- =====================================================
-- scripts/add-features.sql
-- Complete database schema for Maa Saraswati Travels
-- ERROR-FREE VERSION
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES TABLE (Users, Drivers, Admins)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    user_type VARCHAR(50) DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    referral_code VARCHAR(50) UNIQUE,
    otp_code VARCHAR(10),
    otp_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 2. DRIVERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50),
    vehicle_model VARCHAR(100),
    vehicle_number VARCHAR(50),
    license_number VARCHAR(100),
    vehicle_color VARCHAR(50),
    seating_capacity INT DEFAULT 4,
    ac_available BOOLEAN DEFAULT TRUE,
    is_online BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0,
    total_trips INT DEFAULT 0,
    earnings DECIMAL(10,2) DEFAULT 0,
    acceptance_rate DECIMAL(3,2) DEFAULT 0,
    last_lat DECIMAL(10,8),
    last_lng DECIMAL(11,8),
    last_location_update TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 3. RIDES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    driver_id UUID REFERENCES drivers(id),
    pickup_address TEXT NOT NULL,
    drop_address TEXT NOT NULL,
    pickup_lat DECIMAL(10,8),
    pickup_lng DECIMAL(11,8),
    drop_lat DECIMAL(10,8),
    drop_lng DECIMAL(11,8),
    vehicle_type VARCHAR(50),
    fare DECIMAL(10,2),
    distance DECIMAL(10,2),
    payment_method VARCHAR(50) DEFAULT 'cash',
    payment_status VARCHAR(50) DEFAULT 'pending',
    status VARCHAR(50) DEFAULT 'pending',
    trip_type VARCHAR(50) DEFAULT 'oneway',
    days INT DEFAULT 1,
    stops JSONB DEFAULT '[]'::jsonb,
    otp_code VARCHAR(10),
    rated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    accepted_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- =====================================================
-- 4. RECURRING RIDES TABLE (FIXED SYNTAX)
-- =====================================================
CREATE TABLE IF NOT EXISTS recurring_rides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    pickup_address TEXT,
    drop_address TEXT,
    vehicle_type VARCHAR(50),
    fare DECIMAL(10,2),
    distance DECIMAL(10,2),
    frequency VARCHAR(50),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    selected_days JSONB DEFAULT '[]'::jsonb,
    schedule_time TIME,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_frequency CHECK (frequency IN ('daily', 'weekly', 'monthly'))
);

-- =====================================================
-- 5. ADD COLUMNS TO RIDES TABLE (FIXED SYNTAX)
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='recurring_id') THEN
        ALTER TABLE rides ADD COLUMN recurring_id UUID REFERENCES recurring_rides(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='cancellation_reason') THEN
        ALTER TABLE rides ADD COLUMN cancellation_reason TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rides' AND column_name='cancelled_by') THEN
        ALTER TABLE rides ADD COLUMN cancelled_by VARCHAR(50);
    END IF;
END $$;

-- =====================================================
-- 6. RECEIPTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100),
    email_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 7. CANCELLATION LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS cancellation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id),
    user_id UUID REFERENCES profiles(id),
    reason TEXT,
    cancelled_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 8. RATINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    rating INT,
    review TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5)
);

-- =====================================================
-- 9. WALLETS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 10. WALLET TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2),
    type VARCHAR(50),
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_transaction_type CHECK (type IN ('credit', 'debit'))
);

-- =====================================================
-- 11. REFERRALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 12. PROMO CODES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(50),
    discount_value DECIMAL(10,2),
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    usage_limit INT DEFAULT 1,
    used_count INT DEFAULT 0,
    valid_until TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_discount_type CHECK (discount_type IN ('percentage', 'fixed'))
);

-- =====================================================
-- 13. CHAT MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id VARCHAR(255),
    user_id UUID REFERENCES profiles(id),
    sender VARCHAR(50),
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT valid_sender CHECK (sender IN ('user', 'admin'))
);

-- =====================================================
-- 14. FCM TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS fcm_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 15. SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_fare DECIMAL(10,2) DEFAULT 50,
    per_km_rate DECIMAL(10,2) DEFAULT 15,
    per_minute_rate DECIMAL(10,2) DEFAULT 2,
    cancellation_fee DECIMAL(10,2) DEFAULT 50,
    commission_rate DECIMAL(5,2) DEFAULT 20,
    min_booking_amount DECIMAL(10,2) DEFAULT 100,
    max_distance DECIMAL(10,2) DEFAULT 100,
    promo_code_enabled BOOLEAN DEFAULT TRUE,
    referral_bonus DECIMAL(10,2) DEFAULT 100,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 16. ERROR LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS error_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_message TEXT,
    error_stack TEXT,
    url TEXT,
    user_agent TEXT,
    user_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 17. EMAIL LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_email VARCHAR(255),
    subject TEXT,
    type VARCHAR(100),
    status VARCHAR(50),
    sent_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 18. SOS ALERTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sos_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    ride_id UUID REFERENCES rides(id),
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 19. SCHEDULED REMINDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduled_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id),
    user_id UUID REFERENCES profiles(id),
    reminder_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 20. RIDE REQUESTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ride_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id),
    driver_id UUID REFERENCES drivers(id),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 21. SAVED PLACES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS saved_places (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100),
    address TEXT,
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 22. EMERGENCY CONTACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100),
    phone VARCHAR(20),
    relation VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 23. RIDE SHARES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ride_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    seats_available INT DEFAULT 1,
    price_per_seat DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 24. VEHICLE TYPES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS vehicle_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) UNIQUE,
    name VARCHAR(100),
    icon VARCHAR(50),
    base_fare DECIMAL(10,2),
    per_km_rate DECIMAL(10,2),
    seating_capacity INT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 25. RECURRING RIDES (ALTERNATIVE - SAFE APPROACH)
-- =====================================================
DO $$ 
BEGIN
    -- Drop constraint if exists (safe approach)
    ALTER TABLE recurring_rides DROP CONSTRAINT IF EXISTS valid_frequency;
    -- Add constraint
    ALTER TABLE recurring_rides ADD CONSTRAINT valid_frequency CHECK (frequency IN ('daily', 'weekly', 'monthly'));
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- =====================================================
-- CREATE ALL INDEXES (FIXED SYNTAX)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

CREATE INDEX IF NOT EXISTS idx_drivers_is_online ON drivers(is_online);
CREATE INDEX IF NOT EXISTS idx_drivers_is_approved ON drivers(is_approved);
CREATE INDEX IF NOT EXISTS idx_drivers_vehicle_type ON drivers(vehicle_type);

CREATE INDEX IF NOT EXISTS idx_rides_user_id ON rides(user_id);
CREATE INDEX IF NOT EXISTS idx_rides_driver_id ON rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_created_at ON rides(created_at);
CREATE INDEX IF NOT EXISTS idx_rides_scheduled_for ON rides(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_rides_recurring_id ON rides(recurring_id);
CREATE INDEX IF NOT EXISTS idx_rides_cancellation_reason ON rides(cancellation_reason);

CREATE INDEX IF NOT EXISTS idx_recurring_rides_user_id ON recurring_rides(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_rides_status ON recurring_rides(status);

CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

CREATE INDEX IF NOT EXISTS idx_ratings_driver_id ON ratings(driver_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON saved_places(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_shares_ride_id ON ride_shares(ride_id);

-- =====================================================
-- CREATE FUNCTIONS (FIXED SYNTAX)
-- =====================================================
CREATE OR REPLACE FUNCTION find_nearby_drivers_by_type(
    p_lat DECIMAL,
    p_lng DECIMAL,
    p_vehicle_type VARCHAR,
    p_radius_km DECIMAL DEFAULT 0.8
)
RETURNS TABLE(
    id UUID,
    full_name VARCHAR,
    phone VARCHAR,
    vehicle_type VARCHAR,
    vehicle_number VARCHAR,
    rating DECIMAL,
    distance_km DECIMAL
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        p.full_name,
        p.phone,
        d.vehicle_type,
        d.vehicle_number,
        d.rating,
        (6371 * acos(cos(radians(p_lat)) * cos(radians(COALESCE(d.last_lat, 0))) * 
         cos(radians(COALESCE(d.last_lng, 0)) - radians(p_lng)) + 
         sin(radians(p_lat)) * sin(radians(COALESCE(d.last_lat, 0))))) AS distance_km
    FROM drivers d
    JOIN profiles p ON d.id = p.id
    WHERE d.is_online = TRUE 
        AND d.is_approved = TRUE 
        AND d.vehicle_type = p_vehicle_type
        AND d.last_lat IS NOT NULL
        AND d.last_lng IS NOT NULL
        AND (6371 * acos(cos(radians(p_lat)) * cos(radians(d.last_lat)) * 
             cos(radians(d.last_lng) - radians(p_lng)) + 
             sin(radians(p_lat)) * sin(radians(d.last_lat)))) <= p_radius_km
    ORDER BY distance_km;
END;
$$;

-- =====================================================
-- UPDATE UPDATED_AT FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS (FIXED SYNTAX)
-- =====================================================
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rides_updated_at ON rides;
CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_rides_updated_at ON recurring_rides;
CREATE TRIGGER update_recurring_rides_updated_at BEFORE UPDATE ON recurring_rides FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT DEFAULT VEHICLE TYPES
-- =====================================================
INSERT INTO vehicle_types (type, name, icon, base_fare, per_km_rate, seating_capacity, description, sort_order) VALUES
('auto', 'Auto Rickshaw', '🛺', 30, 12, 3, 'Best for short distances', 1),
('bike', 'Bike', '🏍️', 20, 8, 2, 'Quick and economical', 2),
('electric_bike', 'Electric Bike', '⚡🏍️', 25, 10, 2, 'Eco-friendly', 3),
('hatchback', 'Hatchback', '🚗', 50, 15, 4, 'Swift, Baleno, i20', 4),
('sedan', 'Sedan', '🚘', 60, 18, 4, 'Honda City, Ciaz', 5),
('suv', 'SUV', '🚙', 80, 22, 6, 'Creta, Seltos', 6),
('luxury', 'Luxury Car', '🚘✨', 120, 35, 4, 'Mercedes, BMW', 7),
('tempo', 'Tempo Traveller', '🚐', 150, 25, 12, 'Group tours', 8),
('minibus', 'Mini Bus', '🚌', 200, 30, 20, 'Large groups', 9),
('electric_car', 'Electric Car', '⚡🚗', 70, 20, 4, 'Eco-friendly', 10)
ON CONFLICT (type) DO NOTHING;

-- =====================================================
-- INSERT DEFAULT SYSTEM SETTINGS
-- =====================================================
INSERT INTO system_settings (id, base_fare, per_km_rate, per_minute_rate, cancellation_fee, commission_rate, min_booking_amount, max_distance, promo_code_enabled, referral_bonus)
VALUES (uuid_generate_v4(), 50, 15, 2, 50, 20, 100, 100, TRUE, 100)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- INSERT SAMPLE PROMO CODE
-- =====================================================
INSERT INTO promo_codes (code, discount_type, discount_value, min_order_amount, usage_limit, valid_until, is_active)
VALUES ('WELCOME100', 'percentage', 10, 500, 100, NOW() + INTERVAL '30 days', TRUE)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- CREATE ADMIN USER (Run after creating auth user in Supabase dashboard)
-- Note: Replace 'admin-user-id' with actual UUID from auth.users
-- INSERT INTO profiles (id, email, phone, full_name, user_type, is_verified, is_active)
-- VALUES ('admin-user-id', 'admin@maasaraswatitravels.com', '9999999999', 'Admin', 'admin', TRUE, TRUE);

-- =====================================================
-- VERIFICATION QUERIES (Run to check everything is created)
-- =====================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT COUNT(*) FROM vehicle_types;
-- SELECT COUNT(*) FROM system_settings;