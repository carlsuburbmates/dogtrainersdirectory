CREATE OR REPLACE FUNCTION search_trainers(
  user_lat numeric,
  user_lng numeric,
  radius_km integer,
  age_filter age_specialty DEFAULT NULL,
  issues_filter behavior_issue[] DEFAULT NULL,
  service_type_filter service_type DEFAULT NULL,
  verified_only boolean DEFAULT false
)
RETURNS TABLE (
  business_id uuid,
  business_name text,
  business_email text,
  business_phone text,
  business_website text,
  business_address text,
  business_bio text,
  business_pricing text,
  abn_verified boolean,
  verification_status text,
  suburb_name text,
  council_name text,
  region text,
  distance_km numeric,
  average_rating numeric,
  review_count bigint,
  age_specialties text[],
  behavior_issues text[],
  services text[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id as business_id,
    b.name as business_name,
    decrypt_sensitive(b.email_encrypted) as business_email,
    decrypt_sensitive(b.phone_encrypted) as business_phone,
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
    AND b.is_deleted = false
    AND calculate_distance(user_lat, user_lng, s.latitude, s.longitude) <= radius_km
    AND (verified_only = false OR b.abn_verified = true)
  GROUP BY
    b.id,
    b.name,
    b.email,
    b.phone,
    b.website,
    b.address,
    b.bio,
    b.pricing,
    b.abn_verified,
    b.verification_status,
    s.name,
    s.latitude,
    s.longitude,
    c.name,
    c.region
  HAVING
    (age_filter IS NULL OR EXISTS (SELECT 1 FROM trainer_specializations ts2 WHERE ts2.business_id = b.id AND ts2.age_specialty = age_filter))
    AND (issues_filter IS NULL OR EXISTS (SELECT 1 FROM trainer_behavior_issues tbi2 WHERE tbi2.business_id = b.id AND tbi2.behavior_issue = ANY(issues_filter)))
    AND (service_type_filter IS NULL OR EXISTS (SELECT 1 FROM trainer_services tsvc2 WHERE tsvc2.business_id = b.id AND tsvc2.service_type = service_type_filter))
  ORDER BY
    b.abn_verified DESC,
    distance_km ASC,
    average_rating DESC;
END;
$$ LANGUAGE plpgsql STABLE;
