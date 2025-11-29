-- Dog Trainers Directory Database Schema
-- Phase 1 Implementation

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS webhook_events CASCADE;
DROP TABLE IF EXISTS abn_verifications CASCADE;
DROP TABLE IF EXISTS featured_placement_queue CASCADE;
DROP TABLE IF EXISTS featured_placements CASCADE;
DROP TABLE IF EXISTS emergency_resources CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS trainer_services CASCADE;
DROP TABLE IF EXISTS trainer_behavior_issues CASCADE;
DROP TABLE IF EXISTS trainer_specializations CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS suburbs CASCADE;
DROP TABLE IF EXISTS councils CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS resource_type CASCADE;
DROP TYPE IF EXISTS service_type CASCADE;
DROP TYPE IF EXISTS behavior_issue CASCADE;
DROP TYPE IF EXISTS age_specialty CASCADE;
DROP TYPE IF EXISTS verification_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS region CASCADE;

-- Create Enums
CREATE TYPE region AS ENUM (
    'Inner City',
    'Northern', 
    'Eastern',
    'South Eastern',
    'Western'
);

CREATE TYPE user_role AS ENUM (
    'trainer',
    'admin'
);

CREATE TYPE verification_status AS ENUM (
    'pending',
    'verified', 
    'rejected',
    'manual_review'
);

CREATE TYPE age_specialty AS ENUM (
    'puppies_0_6m',
    'adolescent_6_18m',
    'adult_18m_7y',
    'senior_7y_plus',
    'rescue_dogs'
);

CREATE TYPE behavior_issue AS ENUM (
    'pulling_on_lead',
    'separation_anxiety',
    'excessive_barking',
    'dog_aggression',
    'leash_reactivity',
    'jumping_up',
    'destructive_behaviour',
    'recall_issues',
    'anxiety_general',
    'resource_guarding',
    'mouthing_nipping_biting',
    'rescue_dog_support',
    'socialisation'
);

CREATE TYPE service_type AS ENUM (
    'puppy_training',
    'obedience_training',
    'behaviour_consultations',
    'group_classes',
    'private_training'
);

CREATE TYPE resource_type AS ENUM (
    'trainer',
    'behaviour_consultant',
    'emergency_vet',
    'urgent_care',
    'emergency_shelter'
);

-- Core Tables

-- Councils table (28 records)
CREATE TABLE councils (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    region region NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suburbs table (138 records)
CREATE TABLE suburbs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    postcode TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    council_id INTEGER REFERENCES councils(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, council_id)
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'trainer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Businesses table
CREATE TABLE businesses (
    id SERIAL PRIMARY KEY,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    website TEXT,
    address TEXT,
    suburb_id INTEGER REFERENCES suburbs(id),
    bio TEXT,
    pricing TEXT,
    abn TEXT,
    abn_verified BOOLEAN DEFAULT FALSE,
    verification_status verification_status DEFAULT 'pending',
    resource_type resource_type NOT NULL DEFAULT 'trainer',
    featured_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trainer specializations
CREATE TABLE trainer_specializations (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    age_specialty age_specialty NOT NULL,
    UNIQUE(business_id, age_specialty)
);

-- Trainer behavior issues
CREATE TABLE trainer_behavior_issues (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    behavior_issue behavior_issue NOT NULL,
    UNIQUE(business_id, behavior_issue)
);

-- Trainer services
CREATE TABLE trainer_services (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    service_type service_type NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    UNIQUE(business_id, service_type)
);

ALTER TABLE businesses
    ADD CONSTRAINT trainer_requires_specialization
    CHECK (
        resource_type != 'trainer'
        OR EXISTS (
            SELECT 1 FROM trainer_specializations ts
            WHERE ts.business_id = businesses.id
        )
    )
    DEFERRABLE INITIALLY DEFERRED;

-- Reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    reviewer_name TEXT NOT NULL,
    reviewer_email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    content TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emergency resources table
CREATE TABLE emergency_resources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    resource_type resource_type NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    website TEXT,
    address TEXT,
    suburb_id INTEGER REFERENCES suburbs(id),
    is_24_hour BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Featured placements table (infrastructure only)
CREATE TABLE featured_placements (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    lga_id INTEGER REFERENCES councils(id),
    stripe_checkout_session_id TEXT UNIQUE,
    stripe_payment_intent_id TEXT UNIQUE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FIFO queue for featured placements
CREATE TABLE featured_placement_queue (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    lga_id INTEGER REFERENCES councils(id),
    stripe_payment_intent_id TEXT UNIQUE,
    queue_position INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ABN verification records
CREATE TABLE abn_verifications (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
    abn TEXT NOT NULL,
    business_name TEXT NOT NULL,
    matched_name TEXT,
    similarity_score DECIMAL(3, 2),
    verification_method TEXT NOT NULL CHECK (verification_method IN ('api', 'manual_upload')),
    status verification_status DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook idempotency table
CREATE TABLE webhook_events (
    id SERIAL PRIMARY KEY,
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Haversine distance function
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL, 
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN 6371 * ACOS(
        COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
        COS(RADIANS(lon2) - RADIANS(lon1)) + 
        SIN(RADIANS(lat1)) * SIN(RADIANS(lat2))
    );
END;
$$ LANGUAGE plpgsql;

-- Search function for trainers with distance calculation
CREATE OR REPLACE FUNCTION search_trainers(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_km INTEGER DEFAULT 50,
    age_filter age_specialty DEFAULT NULL,
    issues_filter behavior_issue[] DEFAULT NULL,
    service_type_filter service_type DEFAULT NULL,
    verified_only BOOLEAN DEFAULT FALSE
) RETURNS TABLE (
    business_id INTEGER,
    business_name TEXT,
    business_email TEXT,
    business_phone TEXT,
    business_website TEXT,
    business_address TEXT,
    business_bio TEXT,
    business_pricing TEXT,
    abn_verified BOOLEAN,
    verification_status verification_status,
    suburb_name TEXT,
    council_name TEXT,
    region region,
    distance_km DECIMAL,
    average_rating DECIMAL,
    review_count INTEGER,
    age_specialties age_specialty[],
    behavior_issues behavior_issue[],
    services service_type[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as business_id,
        b.name as business_name,
        b.email as business_email,
        b.phone as business_phone,
        b.website as business_website,
        b.address as business_address,
        b.bio as business_bio,
        b.pricing as business_pricing,
        b.abn_verified,
        b.verification_status,
        s.name as suburb_name,
        c.name as council_name,
        c.region,
        calculate_distance(user_lat, user_lng, s.latitude, s.longitude) as distance_km,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(r.id) as review_count,
        ARRAY_AGG(DISTINCT ts.age_specialty) as age_specialties,
        ARRAY_AGG(DISTINCT tbi.behavior_issue) as behavior_issues,
        ARRAY_AGG(DISTINCT tsvc.service_type) as services
    FROM businesses b
    JOIN suburbs s ON b.suburb_id = s.id
    JOIN councils c ON s.council_id = c.id
    LEFT JOIN reviews r ON b.id = r.business_id AND r.is_approved = true
    LEFT JOIN trainer_specializations ts ON b.id = ts.business_id
    LEFT JOIN trainer_behavior_issues tbi ON b.id = tbi.business_id
    LEFT JOIN trainer_services tsvc ON b.id = tsvc.business_id
    WHERE 
        b.is_active = true
        AND calculate_distance(user_lat, user_lng, s.latitude, s.longitude) <= radius_km
        AND (age_filter IS NULL OR age_filter = ANY(ARRAY_AGG(DISTINCT ts.age_specialty)))
        AND (issues_filter IS NULL OR tbi.behavior_issue = ANY(issues_filter))
        AND (service_type_filter IS NULL OR service_type_filter = ANY(ARRAY_AGG(DISTINCT tsvc.service_type)))
        AND (verified_only = false OR b.abn_verified = true)
    GROUP BY b.id, b.name, b.email, b.phone, b.website, b.address, b.bio, b.pricing, b.abn_verified, b.verification_status, s.name, c.name, c.region
    ORDER BY 
        b.abn_verified DESC,
        distance_km ASC,
        average_rating DESC;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX idx_suburbs_coordinates ON suburbs (latitude, longitude);
CREATE INDEX idx_suburbs_council ON suburbs (council_id);
CREATE INDEX idx_businesses_active ON businesses (is_active);
CREATE INDEX idx_businesses_abn_verified ON businesses (abn_verified);
CREATE INDEX idx_businesses_suburb ON businesses (suburb_id);
CREATE INDEX idx_reviews_approved ON reviews (is_approved);
CREATE INDEX idx_reviews_business ON reviews (business_id);
CREATE INDEX idx_trainer_specializations_business ON trainer_specializations (business_id);
CREATE INDEX idx_trainer_behavior_issues_business ON trainer_behavior_issues (business_id);
CREATE INDEX idx_trainer_services_business ON trainer_services (business_id);
CREATE INDEX idx_emergency_resources_active ON emergency_resources (is_active);
CREATE INDEX idx_emergency_resources_type ON emergency_resources (resource_type);
CREATE INDEX idx_featured_placements_status ON featured_placements (status);
CREATE INDEX idx_featured_placements_dates ON featured_placements (start_date, end_date);
CREATE INDEX idx_webhook_events_processed ON webhook_events (processed);
CREATE INDEX idx_webhook_events_stripe_id ON webhook_events (stripe_event_id);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'admin')
    );

-- Businesses policies
CREATE POLICY "Active businesses are viewable by everyone" ON businesses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Trainers can update own businesses" ON businesses
    FOR UPDATE USING (auth.uid() = profile_id);

CREATE POLICY "Trainers can insert own businesses" ON businesses
    FOR INSERT WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Admins can view all businesses" ON businesses
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'admin')
    );

-- Reviews policies
CREATE POLICY "Approved reviews are viewable by everyone" ON reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can insert reviews" ON reviews
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all reviews" ON reviews
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update reviews" ON reviews
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND role = 'admin')
    );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at 
    BEFORE UPDATE ON businesses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_resources_updated_at 
    BEFORE UPDATE ON emergency_resources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_abn_verifications_updated_at 
    BEFORE UPDATE ON abn_verifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
