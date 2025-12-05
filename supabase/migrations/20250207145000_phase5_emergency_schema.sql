-- Phase 5 schema updates: emergency resource fields + council contacts + RPC

ALTER TABLE businesses
    ADD COLUMN IF NOT EXISTS emergency_hours TEXT,
    ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
    ADD COLUMN IF NOT EXISTS emergency_services TEXT[],
    ADD COLUMN IF NOT EXISTS cost_indicator TEXT,
    ADD COLUMN IF NOT EXISTS capacity_notes TEXT;

CREATE TABLE IF NOT EXISTS council_contacts (
    council_id INTEGER PRIMARY KEY REFERENCES councils(id) ON DELETE CASCADE,
    phone TEXT,
    after_hours_phone TEXT,
    report_url TEXT
);

CREATE OR REPLACE FUNCTION search_emergency_resources(
    user_lat DECIMAL DEFAULT NULL,
    user_lng DECIMAL DEFAULT NULL,
    resource_filters resource_type[] DEFAULT ARRAY['emergency_vet'::resource_type, 'urgent_care'::resource_type, 'emergency_shelter'::resource_type],
    limit_entries INTEGER DEFAULT 50
) RETURNS TABLE (
    business_id INTEGER,
    business_name TEXT,
    business_phone TEXT,
    business_email TEXT,
    website TEXT,
    address TEXT,
    suburb_name TEXT,
    council_name TEXT,
    region region,
    emergency_hours TEXT,
    emergency_phone TEXT,
    emergency_services TEXT[],
    cost_indicator TEXT,
    capacity_notes TEXT,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.name,
        b.phone,
        b.email,
        b.website,
        b.address,
        s.name,
        c.name,
        c.region,
        b.emergency_hours,
        COALESCE(b.emergency_phone, b.phone),
        b.emergency_services,
        b.cost_indicator,
        b.capacity_notes,
        CASE
            WHEN user_lat IS NULL OR user_lng IS NULL THEN NULL
            ELSE calculate_distance(user_lat, user_lng, s.latitude, s.longitude)
        END AS distance_km
    FROM businesses b
    JOIN suburbs s ON b.suburb_id = s.id
    JOIN councils c ON s.council_id = c.id
    WHERE
        b.resource_type = ANY(resource_filters)
        AND b.is_active = true
        AND b.is_deleted = false
    ORDER BY
        (CASE WHEN user_lat IS NULL OR user_lng IS NULL THEN 0 ELSE calculate_distance(user_lat, user_lng, s.latitude, s.longitude) END) ASC,
        b.emergency_hours DESC,
        b.name ASC
    LIMIT limit_entries;
END;
$$ LANGUAGE plpgsql;
