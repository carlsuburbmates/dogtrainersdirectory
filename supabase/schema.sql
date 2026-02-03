--
-- PostgreSQL database dump
--

\restrict N5UdAhQ7crLkQ9bzdqM3Z9BYsyhoz3NWDebo0MbimDq71eazJ2DTfu0AHThEDmc

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: age_specialty; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.age_specialty AS ENUM (
    'puppies_0_6m',
    'adolescent_6_18m',
    'adult_18m_7y',
    'senior_7y_plus',
    'rescue_dogs'
);


--
-- Name: behavior_issue; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.behavior_issue AS ENUM (
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


--
-- Name: region; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.region AS ENUM (
    'Inner City',
    'Northern',
    'Eastern',
    'South Eastern',
    'Western'
);


--
-- Name: resource_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.resource_type AS ENUM (
    'trainer',
    'behaviour_consultant',
    'emergency_vet',
    'urgent_care',
    'emergency_shelter'
);


--
-- Name: service_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.service_type AS ENUM (
    'puppy_training',
    'obedience_training',
    'behaviour_consultations',
    'group_classes',
    'private_training'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'trainer',
    'admin'
);


--
-- Name: verification_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.verification_status AS ENUM (
    'pending',
    'verified',
    'rejected',
    'manual_review'
);


--
-- Name: calculate_distance(numeric, numeric, numeric, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.calculate_distance(lat1 numeric, lon1 numeric, lat2 numeric, lon2 numeric) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN 6371 * ACOS(
        COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
        COS(RADIANS(lon2) - RADIANS(lon1)) + 
        SIN(RADIANS(lat1)) * SIN(RADIANS(lat2))
    );
END;
$$;


--
-- Name: check_error_rate_alert(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_error_rate_alert(minutes_ago integer, threshold integer DEFAULT 1, consecutive_minutes integer DEFAULT 1) RETURNS TABLE(minute timestamp with time zone, error_rate integer)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  select
    date_trunc('minute', created_at) as minute,
    count(*)::integer as error_rate
  from public.error_logs
  where created_at >= now() - make_interval(mins => minutes_ago)
  group by 1
  order by 1;
$$;


--
-- Name: decrypt_sensitive(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrypt_sensitive(p_input text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  k text;
BEGIN
  -- current_setting(..., true) returns NULL instead of throwing if not set
  k := current_setting('pgcrypto.key', true);
  IF k IS NULL OR k = '' THEN
    -- no key configured; return NULL so callers can handle absent keys gracefully
    RETURN NULL;
  END IF;

  -- pgp_sym_decrypt accepts bytea input + key
  RETURN pgp_sym_decrypt(p_input::bytea, k);
END;
$$;


--
-- Name: decrypt_sensitive(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.decrypt_sensitive(p_input text, p_key text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  k text;
BEGIN
  -- If explicit key provided, prefer it
  IF p_key IS NOT NULL AND p_key <> '' THEN
    RETURN pgp_sym_decrypt(p_input::bytea, p_key);
  END IF;

  -- fallback to GUC if set (null-safe)
  k := current_setting('pgcrypto.key', true);
  IF k IS NULL OR k = '' THEN
    RETURN NULL;
  END IF;

  RETURN pgp_sym_decrypt(p_input::bytea, k);
END;
$$;


--
-- Name: encrypt_sensitive(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.encrypt_sensitive(p_input text, p_key text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
  k text;
BEGIN
  IF p_input IS NULL THEN
    RETURN NULL;
  END IF;

  IF p_key IS NOT NULL AND p_key <> '' THEN
    RETURN pgp_sym_encrypt(p_input::text, p_key);
  END IF;

  k := current_setting('pgcrypto.key', true);
  IF k IS NULL OR k = '' THEN
    RETURN NULL;
  END IF;

  RETURN pgp_sym_encrypt(p_input::text, k);
END;
$$;


--
-- Name: enforce_trainer_requires_specialization(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enforce_trainer_requires_specialization() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Only enforce when resource_type indicates a trainer
    IF (NEW.resource_type = 'trainer') THEN
        -- If there are no specializations for this business, raise an error
        PERFORM 1 FROM trainer_specializations ts WHERE ts.business_id = NEW.id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Trainer businesses must have at least one specialization.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


--
-- Name: get_enum_values(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_enum_values(constraint_name text) RETURNS TABLE(enum_values text)
    LANGUAGE plpgsql STABLE
    AS $$
declare
  enum_type_oid oid;
begin
  select t.oid
    into enum_type_oid
  from pg_constraint c
  join pg_attribute a
    on a.attrelid = c.conrelid
   and a.attnum = any(c.conkey)
  join pg_type t
    on t.oid = a.atttypid
  where c.conname = constraint_name
  limit 1;

  if enum_type_oid is null then
    select t.oid into enum_type_oid
    from pg_type t
    where t.typname = constraint_name
    limit 1;
  end if;

  if enum_type_oid is null then
    return;
  end if;

  return query
    select string_agg(e.enumlabel, ',')
    from pg_enum e
    where e.enumtypid = enum_type_oid;
end;
$$;


--
-- Name: get_errors_per_hour(timestamp with time zone, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_errors_per_hour(start_at timestamp with time zone, hours_count integer DEFAULT 24) RETURNS TABLE(hour timestamp with time zone, error_count bigint, errors_by_level jsonb)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  with hours as (
    select generate_series(
      date_trunc('hour', start_at),
      date_trunc('hour', start_at) + make_interval(hours => hours_count - 1),
      '1 hour'::interval
    ) as hour
  )
  select
    h.hour,
    coalesce(sum(l.level_count), 0) as error_count,
    coalesce(
      jsonb_object_agg(l.level, l.level_count) filter (where l.level is not null),
      '{}'::jsonb
    ) as errors_by_level
  from hours h
  left join lateral (
    select level, count(*)::bigint as level_count
    from public.error_logs
    where created_at >= h.hour
      and created_at < h.hour + interval '1 hour'
    group by level
  ) l on true
  group by h.hour
  order by h.hour;
$$;


--
-- Name: get_search_latency_stats(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_search_latency_stats(hours_back integer DEFAULT 24, operation_filter text DEFAULT NULL::text) RETURNS TABLE(p50_latency double precision, p95_latency double precision, avg_latency double precision, total_operations bigint, success_rate numeric)
    LANGUAGE plpgsql STABLE SECURITY DEFINER
    AS $$
declare
    min_timestamp timestamptz := now() - (hours_back || ' hours')::interval;
begin
    return query
    select
        percentile_cont(0.5) within group (order by latency_ms) as p50_latency,
        percentile_cont(0.95) within group (order by latency_ms) as p95_latency,
        round(avg(latency_ms)::numeric, 2) as avg_latency,
        count(*)::bigint as total_operations,
        round(100.0 * count(nullif(success, false)) / count(*), 2) as success_rate
    from public.search_telemetry
    where timestamp >= min_timestamp
        and (operation_filter is null or operation = operation_filter);
end;
$$;


--
-- Name: get_trainer_profile(integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_trainer_profile(p_business_id integer, p_key text DEFAULT NULL::text) RETURNS TABLE(business_id integer, business_name text, abn_verified boolean, verification_status public.verification_status, address text, website text, email text, phone text, bio text, pricing text, featured_until timestamp with time zone, suburb_name text, suburb_postcode text, council_name text, region public.region, average_rating numeric, review_count integer, age_specialties public.age_specialty[], behavior_issues public.behavior_issue[], services public.service_type[])
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.name,
        b.abn_verified,
        b.verification_status,
        b.address,
        b.website,
        decrypt_sensitive(b.email_encrypted, p_key),
        decrypt_sensitive(b.phone_encrypted, p_key),
        b.bio,
        b.pricing,
        b.featured_until,
        s.name,
        s.postcode,
        c.name,
        c.region,
        COALESCE(AVG(r.rating), 0),
        COUNT(r.id)::INTEGER,
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT ts.age_specialty), NULL), ARRAY[]::age_specialty[]),
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT tbi.behavior_issue), NULL), ARRAY[]::behavior_issue[]),
        COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT tsvc.service_type), NULL), ARRAY[]::service_type[])
    FROM businesses b
    JOIN suburbs s ON b.suburb_id = s.id
    JOIN councils c ON s.council_id = c.id
    LEFT JOIN reviews r ON b.id = r.business_id AND r.is_approved = true
    LEFT JOIN trainer_specializations ts ON b.id = ts.business_id
    LEFT JOIN trainer_behavior_issues tbi ON b.id = tbi.business_id
    LEFT JOIN trainer_services tsvc ON b.id = tsvc.business_id
    WHERE 
        b.id = p_business_id
        AND b.is_active = true
        AND b.is_deleted = false
    GROUP BY 
        b.id, b.name, b.abn_verified, b.verification_status, b.address, b.website,
        b.email_encrypted, b.phone_encrypted, b.bio, b.pricing, b.featured_until,
        s.name, s.postcode, c.name, c.region;
END;
$$;


--
-- Name: search_emergency_resources(numeric, numeric, text[], integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_emergency_resources(user_lat numeric, user_lng numeric, resource_filters text[] DEFAULT NULL::text[], limit_entries integer DEFAULT 50, p_key text DEFAULT NULL::text) RETURNS TABLE(business_id integer, business_name text, business_email text, business_phone text, website text, address text, suburb_name text, council_name text, region public.region, emergency_hours text, emergency_services text[], cost_indicator text, capacity_notes text, distance_km numeric)
    LANGUAGE plpgsql
    AS $$
begin
  return query
  select
    b.id as business_id,
    b.name as business_name,
    decrypt_sensitive(b.email_encrypted, p_key) as business_email,
    coalesce(b.emergency_phone, decrypt_sensitive(b.phone_encrypted, p_key)) as business_phone,
    b.website,
    b.address,
    s.name as suburb_name,
    c.name as council_name,
    c.region,
    b.emergency_hours,
    b.emergency_services,
    b.cost_indicator,
    b.capacity_notes,
    case
      when user_lat is null or user_lng is null then null
      else calculate_distance(user_lat, user_lng, s.latitude, s.longitude)
    end as distance_km
  from public.businesses b
  join public.suburbs s on b.suburb_id = s.id
  join public.councils c on s.council_id = c.id
  where b.is_active = true
    and b.is_deleted = false
    and (resource_filters is null or b.resource_type = any(resource_filters))
  order by
    distance_km nulls last,
    b.name asc
  limit limit_entries;
end;
$$;


--
-- Name: search_trainers(numeric, numeric, public.age_specialty[], public.behavior_issue[], public.service_type, boolean, boolean, text, numeric, text, integer, integer, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_trainers(user_lat numeric DEFAULT NULL::numeric, user_lng numeric DEFAULT NULL::numeric, age_filters public.age_specialty[] DEFAULT NULL::public.age_specialty[], issue_filters public.behavior_issue[] DEFAULT NULL::public.behavior_issue[], service_type_filter public.service_type DEFAULT NULL::public.service_type, verified_only boolean DEFAULT false, rescue_only boolean DEFAULT false, distance_filter text DEFAULT 'any'::text, price_max numeric DEFAULT NULL::numeric, search_term text DEFAULT NULL::text, result_limit integer DEFAULT 50, result_offset integer DEFAULT 0, p_key text DEFAULT NULL::text) RETURNS TABLE(business_id integer, business_name text, business_email text, business_phone text, business_website text, business_address text, business_bio text, business_pricing text, featured_until timestamp with time zone, is_featured boolean, pricing_min_rate numeric, abn_verified boolean, verification_status public.verification_status, suburb_name text, council_name text, region public.region, distance_km numeric, average_rating numeric, review_count integer, age_specialties public.age_specialty[], behavior_issues public.behavior_issue[], services public.service_type[])
    LANGUAGE plpgsql
    AS $$
DECLARE
    search_pattern TEXT := CASE 
        WHEN search_term IS NULL OR LENGTH(TRIM(search_term)) = 0 THEN NULL
        ELSE '%' || TRIM(search_term) || '%'
    END;
BEGIN
    RETURN QUERY
    WITH trainer_base AS (
        SELECT 
            b.id as business_id,
            b.name as business_name,
            decrypt_sensitive(b.email_encrypted, p_key) as business_email,
            decrypt_sensitive(b.phone_encrypted, p_key) as business_phone,
            b.website as business_website,
            b.address as business_address,
            b.bio as business_bio,
            b.pricing as business_pricing,
            b.featured_until,
            (b.featured_until IS NOT NULL AND b.featured_until > NOW()) as is_featured,
            CASE 
                WHEN b.pricing IS NULL THEN NULL
                ELSE NULLIF((regexp_match(b.pricing, '([0-9]+(?:\\.[0-9]+)?)'))[1], '')::NUMERIC
            END as pricing_min_rate,
            b.abn_verified,
            b.verification_status,
            s.name as suburb_name,
            c.name as council_name,
            c.region,
            CASE 
                WHEN user_lat IS NULL OR user_lng IS NULL THEN NULL
                ELSE calculate_distance(user_lat, user_lng, s.latitude, s.longitude)
            END as distance_km,
            COALESCE(AVG(r.rating), 0) as average_rating,
            COUNT(r.id)::INTEGER as review_count,
            COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT ts.age_specialty), NULL), ARRAY[]::age_specialty[]) as age_specialties,
            COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT tbi.behavior_issue), NULL), ARRAY[]::behavior_issue[]) as behavior_issues,
            COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT tsvc.service_type), NULL), ARRAY[]::service_type[]) as services
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
            AND b.resource_type IN ('trainer', 'behaviour_consultant')
        GROUP BY 
            b.id, b.name, b.email_encrypted, b.phone_encrypted, b.website, 
            b.address, b.bio, b.pricing, b.featured_until, b.abn_verified, b.verification_status,
            s.name, c.name, c.region, s.latitude, s.longitude
    )
    SELECT *
    FROM trainer_base tb
    WHERE
        (age_filters IS NULL OR tb.age_specialties && age_filters)
        AND (issue_filters IS NULL OR tb.behavior_issues && issue_filters)
        AND (service_type_filter IS NULL OR service_type_filter = ANY(tb.services))
        AND (verified_only = false OR tb.abn_verified = true)
        AND (rescue_only = false OR ARRAY['rescue_dogs']::age_specialty[] && tb.age_specialties)
        AND (
            user_lat IS NULL 
            OR distance_filter IS NULL 
            OR distance_filter = 'any'
            OR (distance_filter = '0-5' AND tb.distance_km <= 5)
            OR (distance_filter = '5-15' AND tb.distance_km > 5 AND tb.distance_km <= 15)
            OR (distance_filter = 'greater' AND tb.distance_km > 15)
        )
        AND (
            price_max IS NULL 
            OR tb.pricing_min_rate IS NULL 
            OR tb.pricing_min_rate <= price_max
        )
        AND (
            search_pattern IS NULL
            OR tb.business_name ILIKE search_pattern
            OR tb.suburb_name ILIKE search_pattern
            OR tb.council_name ILIKE search_pattern
            OR EXISTS (
                SELECT 1 FROM unnest(tb.behavior_issues) bi
                WHERE bi::text ILIKE search_pattern
            )
            OR EXISTS (
                SELECT 1 FROM unnest(tb.age_specialties) ag
                WHERE ag::text ILIKE search_pattern
            )
        )
    ORDER BY 
        tb.abn_verified DESC,
        tb.distance_km NULLS LAST,
        tb.average_rating DESC,
        tb.business_name ASC
    LIMIT result_limit
    OFFSET result_offset;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: abn_fallback_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.abn_fallback_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id bigint,
    reason text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: abn_verifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.abn_verifications (
    id integer NOT NULL,
    business_id integer,
    abn text NOT NULL,
    business_name text NOT NULL,
    matched_name text,
    similarity_score numeric(3,2),
    verification_method text NOT NULL,
    status public.verification_status DEFAULT 'pending'::public.verification_status,
    admin_notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    matched_json jsonb,
    CONSTRAINT abn_verifications_verification_method_check CHECK ((verification_method = ANY (ARRAY['api'::text, 'manual_upload'::text])))
);


--
-- Name: abn_verifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.abn_verifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: abn_verifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.abn_verifications_id_seq OWNED BY public.abn_verifications.id;


--
-- Name: ai_evaluation_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_evaluation_runs (
    id integer NOT NULL,
    pipeline text NOT NULL,
    dataset_version text,
    total_cases integer NOT NULL,
    correct_predictions integer NOT NULL,
    accuracy_pct numeric,
    false_positives integer,
    false_negatives integer,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_evaluation_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_evaluation_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_evaluation_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_evaluation_runs_id_seq OWNED BY public.ai_evaluation_runs.id;


--
-- Name: ai_review_decisions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_review_decisions (
    id integer NOT NULL,
    review_id integer NOT NULL,
    ai_decision text NOT NULL,
    confidence numeric,
    reason text,
    decision_source text,
    ai_mode text,
    ai_provider text,
    ai_model text,
    ai_prompt_version text,
    raw_response jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: ai_review_decisions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ai_review_decisions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ai_review_decisions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ai_review_decisions_id_seq OWNED BY public.ai_review_decisions.id;


--
-- Name: business_subscription_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.business_subscription_status (
    business_id bigint NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    plan_id text,
    status text DEFAULT 'inactive'::text NOT NULL,
    current_period_end timestamp with time zone,
    last_event_received timestamp with time zone,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: TABLE business_subscription_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.business_subscription_status IS 'Tracks the latest subscription status per business.';


--
-- Name: businesses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.businesses (
    id integer NOT NULL,
    profile_id uuid,
    name text NOT NULL,
    phone text,
    email text,
    emergency_phone text,
    website text,
    address text,
    suburb_id integer,
    bio text,
    pricing text,
    abn text,
    abn_verified boolean DEFAULT false,
    verification_status public.verification_status DEFAULT 'pending'::public.verification_status,
    resource_type public.resource_type DEFAULT 'trainer'::public.resource_type NOT NULL,
    emergency_hours text,
    emergency_services text[],
    cost_indicator text,
    capacity_notes text,
    emergency_verification_status public.verification_status,
    emergency_verification_notes text,
    service_type_primary public.service_type,
    phone_encrypted text,
    email_encrypted text,
    abn_encrypted text,
    is_scaffolded boolean DEFAULT false,
    is_claimed boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    deleted_at timestamp with time zone,
    featured_until timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: businesses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.businesses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: businesses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.businesses_id_seq OWNED BY public.businesses.id;


--
-- Name: council_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.council_contacts (
    council_id integer NOT NULL,
    phone text,
    after_hours_phone text,
    report_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: councils; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.councils (
    id integer NOT NULL,
    name text NOT NULL,
    region public.region NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: councils_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.councils_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: councils_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.councils_id_seq OWNED BY public.councils.id;


--
-- Name: cron_job_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cron_job_runs (
    id integer NOT NULL,
    job_name text NOT NULL,
    started_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    status text NOT NULL,
    duration_ms integer,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: cron_job_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cron_job_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cron_job_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cron_job_runs_id_seq OWNED BY public.cron_job_runs.id;


--
-- Name: daily_ops_digests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_ops_digests (
    id integer NOT NULL,
    digest_date date NOT NULL,
    summary text NOT NULL,
    metrics jsonb DEFAULT '{}'::jsonb NOT NULL,
    model text,
    generated_by text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: daily_ops_digests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_ops_digests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_ops_digests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_ops_digests_id_seq OWNED BY public.daily_ops_digests.id;


--
-- Name: emergency_resource_verification_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emergency_resource_verification_events (
    id integer NOT NULL,
    resource_id integer,
    phone text,
    website text,
    is_valid boolean,
    reason text,
    confidence numeric,
    verification_method text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: emergency_resource_verification_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.emergency_resource_verification_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: emergency_resource_verification_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.emergency_resource_verification_events_id_seq OWNED BY public.emergency_resource_verification_events.id;


--
-- Name: emergency_resource_verification_runs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emergency_resource_verification_runs (
    id integer NOT NULL,
    started_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    total_resources integer,
    auto_updates integer,
    flagged_manual integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: emergency_resource_verification_runs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.emergency_resource_verification_runs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: emergency_resource_verification_runs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.emergency_resource_verification_runs_id_seq OWNED BY public.emergency_resource_verification_runs.id;


--
-- Name: emergency_resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emergency_resources (
    id integer NOT NULL,
    name text NOT NULL,
    resource_type public.resource_type NOT NULL,
    phone text NOT NULL,
    email text,
    emergency_phone text,
    website text,
    address text,
    suburb_id integer,
    is_24_hour boolean DEFAULT false,
    emergency_hours text,
    emergency_services text[],
    cost_indicator text,
    capacity_notes text,
    emergency_verification_status public.verification_status,
    emergency_verification_notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: emergency_resources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.emergency_resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: emergency_resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.emergency_resources_id_seq OWNED BY public.emergency_resources.id;


--
-- Name: emergency_triage_feedback; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emergency_triage_feedback (
    id integer NOT NULL,
    triage_id integer,
    was_helpful boolean,
    feedback_text text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: emergency_triage_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.emergency_triage_feedback_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: emergency_triage_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.emergency_triage_feedback_id_seq OWNED BY public.emergency_triage_feedback.id;


--
-- Name: emergency_triage_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emergency_triage_logs (
    id integer NOT NULL,
    description text,
    situation text,
    location text,
    contact text,
    dog_age text,
    issues text[],
    classification text,
    priority text,
    follow_up_actions text[],
    decision_source text,
    predicted_category text,
    recommended_flow text,
    confidence numeric,
    user_suburb_id integer,
    user_lat numeric,
    user_lng numeric,
    resolution_category text,
    was_correct boolean,
    resolved_at timestamp with time zone,
    ai_mode text,
    ai_provider text,
    ai_model text,
    classifier_version text,
    source text,
    metadata jsonb DEFAULT '{}'::jsonb,
    ai_prompt_version text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: emergency_triage_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.emergency_triage_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: emergency_triage_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.emergency_triage_logs_id_seq OWNED BY public.emergency_triage_logs.id;


--
-- Name: emergency_triage_weekly_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emergency_triage_weekly_metrics (
    id integer NOT NULL,
    week_start timestamp with time zone NOT NULL,
    total_triages integer DEFAULT 0 NOT NULL,
    classification_breakdown jsonb DEFAULT '{}'::jsonb,
    priority_breakdown jsonb DEFAULT '{}'::jsonb,
    decision_source_breakdown jsonb DEFAULT '{}'::jsonb,
    accuracy_pct numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: emergency_triage_weekly_metrics_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.emergency_triage_weekly_metrics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: emergency_triage_weekly_metrics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.emergency_triage_weekly_metrics_id_seq OWNED BY public.emergency_triage_weekly_metrics.id;


--
-- Name: error_alert_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.error_alert_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alert_id uuid,
    message text NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: error_alerts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.error_alerts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    alert_type text NOT NULL,
    severity text NOT NULL,
    threshold jsonb DEFAULT '{}'::jsonb NOT NULL,
    status text NOT NULL,
    last_triggered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    level text NOT NULL,
    category text NOT NULL,
    route text,
    method text,
    status_code integer,
    message text NOT NULL,
    stack text,
    context jsonb DEFAULT '{}'::jsonb,
    user_id text,
    session_id text,
    request_id text,
    duration_ms integer,
    env text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: featured_placement_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.featured_placement_events (
    id integer NOT NULL,
    placement_id integer,
    event_type text NOT NULL,
    previous_status text,
    new_status text,
    triggered_by text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: featured_placement_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.featured_placement_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: featured_placement_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.featured_placement_events_id_seq OWNED BY public.featured_placement_events.id;


--
-- Name: featured_placement_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.featured_placement_queue (
    id integer NOT NULL,
    business_id integer,
    lga_id integer,
    stripe_payment_intent_id text,
    queue_position integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: featured_placement_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.featured_placement_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: featured_placement_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.featured_placement_queue_id_seq OWNED BY public.featured_placement_queue.id;


--
-- Name: featured_placements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.featured_placements (
    id integer NOT NULL,
    business_id integer,
    lga_id integer,
    stripe_checkout_session_id text,
    stripe_payment_intent_id text,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    expiry_date timestamp with time zone,
    priority integer DEFAULT 0,
    slot_type text DEFAULT 'standard'::text,
    active boolean DEFAULT false,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT featured_placements_status_check CHECK ((status = ANY (ARRAY['active'::text, 'expired'::text, 'cancelled'::text])))
);


--
-- Name: featured_placements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.featured_placements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: featured_placements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.featured_placements_id_seq OWNED BY public.featured_placements.id;


--
-- Name: latency_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.latency_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    area text NOT NULL,
    route text NOT NULL,
    duration_ms integer NOT NULL,
    status_code integer,
    success boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: TABLE latency_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.latency_metrics IS 'Request latency telemetry for critical flows (search, emergency verification, health endpoints, ABN).';


--
-- Name: ops_overrides; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ops_overrides (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service text NOT NULL,
    status text NOT NULL,
    reason text,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: payment_audit; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_audit (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id bigint,
    plan_id text NOT NULL,
    event_type text NOT NULL,
    status text NOT NULL,
    stripe_customer_id text,
    stripe_subscription_id text,
    metadata jsonb DEFAULT '{}'::jsonb,
    originating_route text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


--
-- Name: TABLE payment_audit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.payment_audit IS 'Immutable audit log for Stripe monetization events.';


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text NOT NULL,
    full_name text,
    role public.user_role DEFAULT 'trainer'::public.user_role NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    business_id integer,
    reviewer_name text NOT NULL,
    reviewer_email text NOT NULL,
    rating integer NOT NULL,
    title text,
    content text,
    is_approved boolean DEFAULT false,
    is_rejected boolean DEFAULT false,
    rejection_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- Name: search_telemetry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.search_telemetry (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    operation text NOT NULL,
    suburb_id integer,
    suburb_name text,
    result_count integer DEFAULT 0 NOT NULL,
    latency_ms integer NOT NULL,
    success boolean DEFAULT true NOT NULL,
    error text,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: suburbs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suburbs (
    id integer NOT NULL,
    name text NOT NULL,
    postcode text NOT NULL,
    latitude numeric(10,8) NOT NULL,
    longitude numeric(11,8) NOT NULL,
    council_id integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: suburbs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.suburbs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: suburbs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.suburbs_id_seq OWNED BY public.suburbs.id;


--
-- Name: trainer_behavior_issues; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trainer_behavior_issues (
    id integer NOT NULL,
    business_id integer,
    behavior_issue public.behavior_issue NOT NULL
);


--
-- Name: trainer_behavior_issues_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trainer_behavior_issues_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trainer_behavior_issues_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trainer_behavior_issues_id_seq OWNED BY public.trainer_behavior_issues.id;


--
-- Name: trainer_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trainer_services (
    id integer NOT NULL,
    business_id integer,
    service_type public.service_type NOT NULL,
    is_primary boolean DEFAULT false
);


--
-- Name: trainer_services_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trainer_services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trainer_services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trainer_services_id_seq OWNED BY public.trainer_services.id;


--
-- Name: trainer_specializations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trainer_specializations (
    id integer NOT NULL,
    business_id integer,
    age_specialty public.age_specialty NOT NULL
);


--
-- Name: trainer_specializations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trainer_specializations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trainer_specializations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trainer_specializations_id_seq OWNED BY public.trainer_specializations.id;


--
-- Name: triage_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.triage_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    triage_log_id uuid,
    stage text NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb,
    duration_ms integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: triage_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.triage_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    source text DEFAULT 'api'::text NOT NULL,
    message text NOT NULL,
    suburb_id integer,
    classification text,
    confidence numeric,
    summary text,
    recommended_action text,
    urgency text,
    medical jsonb DEFAULT '{}'::jsonb,
    llm_provider text,
    llm_model text,
    tokens_prompt integer,
    tokens_completion integer,
    tokens_total integer,
    duration_ms integer,
    request_meta jsonb DEFAULT '{}'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    error_id text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: triage_metrics_hourly; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.triage_metrics_hourly AS
 SELECT date_trunc('hour'::text, created_at) AS hour,
    count(*) AS total,
    count(*) FILTER (WHERE (classification = 'medical'::text)) AS medical_count,
    count(*) FILTER (WHERE (urgency = 'immediate'::text)) AS immediate_count,
    (COALESCE(round(avg(duration_ms), 0), (0)::numeric))::bigint AS avg_latency_ms,
    COALESCE(sum(tokens_total), (0)::bigint) AS total_tokens
   FROM public.triage_logs
  GROUP BY (date_trunc('hour'::text, created_at))
  ORDER BY (date_trunc('hour'::text, created_at)) DESC;


--
-- Name: webhook_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.webhook_events (
    id integer NOT NULL,
    stripe_event_id text NOT NULL,
    event_type text NOT NULL,
    processed boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: webhook_events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.webhook_events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: webhook_events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.webhook_events_id_seq OWNED BY public.webhook_events.id;


--
-- Name: abn_verifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abn_verifications ALTER COLUMN id SET DEFAULT nextval('public.abn_verifications_id_seq'::regclass);


--
-- Name: ai_evaluation_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_evaluation_runs ALTER COLUMN id SET DEFAULT nextval('public.ai_evaluation_runs_id_seq'::regclass);


--
-- Name: ai_review_decisions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_review_decisions ALTER COLUMN id SET DEFAULT nextval('public.ai_review_decisions_id_seq'::regclass);


--
-- Name: businesses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses ALTER COLUMN id SET DEFAULT nextval('public.businesses_id_seq'::regclass);


--
-- Name: councils id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.councils ALTER COLUMN id SET DEFAULT nextval('public.councils_id_seq'::regclass);


--
-- Name: cron_job_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cron_job_runs ALTER COLUMN id SET DEFAULT nextval('public.cron_job_runs_id_seq'::regclass);


--
-- Name: daily_ops_digests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_ops_digests ALTER COLUMN id SET DEFAULT nextval('public.daily_ops_digests_id_seq'::regclass);


--
-- Name: emergency_resource_verification_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_resource_verification_events ALTER COLUMN id SET DEFAULT nextval('public.emergency_resource_verification_events_id_seq'::regclass);


--
-- Name: emergency_resource_verification_runs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_resource_verification_runs ALTER COLUMN id SET DEFAULT nextval('public.emergency_resource_verification_runs_id_seq'::regclass);


--
-- Name: emergency_resources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_resources ALTER COLUMN id SET DEFAULT nextval('public.emergency_resources_id_seq'::regclass);


--
-- Name: emergency_triage_feedback id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_triage_feedback ALTER COLUMN id SET DEFAULT nextval('public.emergency_triage_feedback_id_seq'::regclass);


--
-- Name: emergency_triage_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_triage_logs ALTER COLUMN id SET DEFAULT nextval('public.emergency_triage_logs_id_seq'::regclass);


--
-- Name: emergency_triage_weekly_metrics id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_triage_weekly_metrics ALTER COLUMN id SET DEFAULT nextval('public.emergency_triage_weekly_metrics_id_seq'::regclass);


--
-- Name: featured_placement_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_placement_events ALTER COLUMN id SET DEFAULT nextval('public.featured_placement_events_id_seq'::regclass);


--
-- Name: featured_placement_queue id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_placement_queue ALTER COLUMN id SET DEFAULT nextval('public.featured_placement_queue_id_seq'::regclass);


--
-- Name: featured_placements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_placements ALTER COLUMN id SET DEFAULT nextval('public.featured_placements_id_seq'::regclass);


--
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- Name: suburbs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suburbs ALTER COLUMN id SET DEFAULT nextval('public.suburbs_id_seq'::regclass);


--
-- Name: trainer_behavior_issues id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_behavior_issues ALTER COLUMN id SET DEFAULT nextval('public.trainer_behavior_issues_id_seq'::regclass);


--
-- Name: trainer_services id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_services ALTER COLUMN id SET DEFAULT nextval('public.trainer_services_id_seq'::regclass);


--
-- Name: trainer_specializations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_specializations ALTER COLUMN id SET DEFAULT nextval('public.trainer_specializations_id_seq'::regclass);


--
-- Name: webhook_events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_events ALTER COLUMN id SET DEFAULT nextval('public.webhook_events_id_seq'::regclass);


--
-- Name: abn_fallback_events abn_fallback_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abn_fallback_events
    ADD CONSTRAINT abn_fallback_events_pkey PRIMARY KEY (id);


--
-- Name: abn_verifications abn_verifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abn_verifications
    ADD CONSTRAINT abn_verifications_pkey PRIMARY KEY (id);


--
-- Name: ai_evaluation_runs ai_evaluation_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_evaluation_runs
    ADD CONSTRAINT ai_evaluation_runs_pkey PRIMARY KEY (id);


--
-- Name: ai_review_decisions ai_review_decisions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_review_decisions
    ADD CONSTRAINT ai_review_decisions_pkey PRIMARY KEY (id);


--
-- Name: ai_review_decisions ai_review_decisions_review_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_review_decisions
    ADD CONSTRAINT ai_review_decisions_review_id_key UNIQUE (review_id);


--
-- Name: business_subscription_status business_subscription_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_subscription_status
    ADD CONSTRAINT business_subscription_status_pkey PRIMARY KEY (business_id);


--
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);


--
-- Name: council_contacts council_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.council_contacts
    ADD CONSTRAINT council_contacts_pkey PRIMARY KEY (council_id);


--
-- Name: councils councils_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.councils
    ADD CONSTRAINT councils_name_key UNIQUE (name);


--
-- Name: councils councils_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.councils
    ADD CONSTRAINT councils_pkey PRIMARY KEY (id);


--
-- Name: cron_job_runs cron_job_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cron_job_runs
    ADD CONSTRAINT cron_job_runs_pkey PRIMARY KEY (id);


--
-- Name: daily_ops_digests daily_ops_digests_digest_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_ops_digests
    ADD CONSTRAINT daily_ops_digests_digest_date_key UNIQUE (digest_date);


--
-- Name: daily_ops_digests daily_ops_digests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_ops_digests
    ADD CONSTRAINT daily_ops_digests_pkey PRIMARY KEY (id);


--
-- Name: emergency_resource_verification_events emergency_resource_verification_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_resource_verification_events
    ADD CONSTRAINT emergency_resource_verification_events_pkey PRIMARY KEY (id);


--
-- Name: emergency_resource_verification_runs emergency_resource_verification_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_resource_verification_runs
    ADD CONSTRAINT emergency_resource_verification_runs_pkey PRIMARY KEY (id);


--
-- Name: emergency_resources emergency_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_resources
    ADD CONSTRAINT emergency_resources_pkey PRIMARY KEY (id);


--
-- Name: emergency_triage_feedback emergency_triage_feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_triage_feedback
    ADD CONSTRAINT emergency_triage_feedback_pkey PRIMARY KEY (id);


--
-- Name: emergency_triage_logs emergency_triage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_triage_logs
    ADD CONSTRAINT emergency_triage_logs_pkey PRIMARY KEY (id);


--
-- Name: emergency_triage_weekly_metrics emergency_triage_weekly_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_triage_weekly_metrics
    ADD CONSTRAINT emergency_triage_weekly_metrics_pkey PRIMARY KEY (id);


--
-- Name: error_alert_events error_alert_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_alert_events
    ADD CONSTRAINT error_alert_events_pkey PRIMARY KEY (id);


--
-- Name: error_alerts error_alerts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_alerts
    ADD CONSTRAINT error_alerts_pkey PRIMARY KEY (id);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: featured_placement_events featured_placement_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_placement_events
    ADD CONSTRAINT featured_placement_events_pkey PRIMARY KEY (id);


--
-- Name: featured_placement_queue featured_placement_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_placement_queue
    ADD CONSTRAINT featured_placement_queue_pkey PRIMARY KEY (id);


--
-- Name: featured_placement_queue featured_placement_queue_stripe_payment_intent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_placement_queue
    ADD CONSTRAINT featured_placement_queue_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id);


--
-- Name: featured_placements featured_placements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_placements
    ADD CONSTRAINT featured_placements_pkey PRIMARY KEY (id);


--
-- Name: featured_placements featured_placements_stripe_checkout_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_placements
    ADD CONSTRAINT featured_placements_stripe_checkout_session_id_key UNIQUE (stripe_checkout_session_id);


--
-- Name: featured_placements featured_placements_stripe_payment_intent_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_placements
    ADD CONSTRAINT featured_placements_stripe_payment_intent_id_key UNIQUE (stripe_payment_intent_id);


--
-- Name: latency_metrics latency_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.latency_metrics
    ADD CONSTRAINT latency_metrics_pkey PRIMARY KEY (id);


--
-- Name: ops_overrides ops_overrides_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ops_overrides
    ADD CONSTRAINT ops_overrides_pkey PRIMARY KEY (id);


--
-- Name: payment_audit payment_audit_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_audit
    ADD CONSTRAINT payment_audit_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_email_key UNIQUE (email);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- Name: search_telemetry search_telemetry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_telemetry
    ADD CONSTRAINT search_telemetry_pkey PRIMARY KEY (id);


--
-- Name: suburbs suburbs_name_council_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suburbs
    ADD CONSTRAINT suburbs_name_council_id_key UNIQUE (name, council_id);


--
-- Name: suburbs suburbs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suburbs
    ADD CONSTRAINT suburbs_pkey PRIMARY KEY (id);


--
-- Name: trainer_behavior_issues trainer_behavior_issues_business_id_behavior_issue_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_behavior_issues
    ADD CONSTRAINT trainer_behavior_issues_business_id_behavior_issue_key UNIQUE (business_id, behavior_issue);


--
-- Name: trainer_behavior_issues trainer_behavior_issues_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_behavior_issues
    ADD CONSTRAINT trainer_behavior_issues_pkey PRIMARY KEY (id);


--
-- Name: trainer_services trainer_services_business_id_service_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_services
    ADD CONSTRAINT trainer_services_business_id_service_type_key UNIQUE (business_id, service_type);


--
-- Name: trainer_services trainer_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_services
    ADD CONSTRAINT trainer_services_pkey PRIMARY KEY (id);


--
-- Name: trainer_specializations trainer_specializations_business_id_age_specialty_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_specializations
    ADD CONSTRAINT trainer_specializations_business_id_age_specialty_key UNIQUE (business_id, age_specialty);


--
-- Name: trainer_specializations trainer_specializations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_specializations
    ADD CONSTRAINT trainer_specializations_pkey PRIMARY KEY (id);


--
-- Name: triage_events triage_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triage_events
    ADD CONSTRAINT triage_events_pkey PRIMARY KEY (id);


--
-- Name: triage_logs triage_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triage_logs
    ADD CONSTRAINT triage_logs_pkey PRIMARY KEY (id);


--
-- Name: webhook_events webhook_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_pkey PRIMARY KEY (id);


--
-- Name: webhook_events webhook_events_stripe_event_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.webhook_events
    ADD CONSTRAINT webhook_events_stripe_event_id_key UNIQUE (stripe_event_id);


--
-- Name: abn_fallback_events_business_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX abn_fallback_events_business_id_idx ON public.abn_fallback_events USING btree (business_id);


--
-- Name: abn_fallback_events_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX abn_fallback_events_created_at_idx ON public.abn_fallback_events USING btree (created_at DESC);


--
-- Name: ai_review_decisions_review_id_uidx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ai_review_decisions_review_id_uidx ON public.ai_review_decisions USING btree (review_id);


--
-- Name: cron_job_runs_job_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cron_job_runs_job_idx ON public.cron_job_runs USING btree (job_name, started_at DESC);


--
-- Name: emergency_triage_logs_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX emergency_triage_logs_created_idx ON public.emergency_triage_logs USING btree (created_at DESC);


--
-- Name: error_logs_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX error_logs_category_idx ON public.error_logs USING btree (category, created_at DESC);


--
-- Name: error_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX error_logs_created_at_idx ON public.error_logs USING btree (created_at DESC);


--
-- Name: error_logs_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX error_logs_level_idx ON public.error_logs USING btree (level, created_at DESC);


--
-- Name: featured_placement_events_placement_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX featured_placement_events_placement_idx ON public.featured_placement_events USING btree (placement_id, created_at DESC);


--
-- Name: idx_businesses_abn_verified; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_abn_verified ON public.businesses USING btree (abn_verified);


--
-- Name: idx_businesses_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_active ON public.businesses USING btree (is_active);


--
-- Name: idx_businesses_suburb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_businesses_suburb ON public.businesses USING btree (suburb_id);


--
-- Name: idx_emergency_resources_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emergency_resources_active ON public.emergency_resources USING btree (is_active);


--
-- Name: idx_emergency_resources_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emergency_resources_type ON public.emergency_resources USING btree (resource_type);


--
-- Name: idx_featured_placements_dates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_placements_dates ON public.featured_placements USING btree (start_date, end_date);


--
-- Name: idx_featured_placements_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_featured_placements_status ON public.featured_placements USING btree (status);


--
-- Name: idx_reviews_approved; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_approved ON public.reviews USING btree (is_approved);


--
-- Name: idx_reviews_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reviews_business ON public.reviews USING btree (business_id);


--
-- Name: idx_search_telemetry_latency; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_telemetry_latency ON public.search_telemetry USING btree (latency_ms, "timestamp" DESC);


--
-- Name: idx_search_telemetry_operation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_telemetry_operation ON public.search_telemetry USING btree (operation);


--
-- Name: idx_search_telemetry_suburb; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_telemetry_suburb ON public.search_telemetry USING btree (suburb_id, "timestamp" DESC);


--
-- Name: idx_search_telemetry_success; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_telemetry_success ON public.search_telemetry USING btree (success, "timestamp" DESC);


--
-- Name: idx_search_telemetry_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_search_telemetry_timestamp ON public.search_telemetry USING btree ("timestamp" DESC);


--
-- Name: idx_suburbs_coordinates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suburbs_coordinates ON public.suburbs USING btree (latitude, longitude);


--
-- Name: idx_suburbs_council; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suburbs_council ON public.suburbs USING btree (council_id);


--
-- Name: idx_trainer_behavior_issues_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trainer_behavior_issues_business ON public.trainer_behavior_issues USING btree (business_id);


--
-- Name: idx_trainer_services_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trainer_services_business ON public.trainer_services USING btree (business_id);


--
-- Name: idx_trainer_specializations_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trainer_specializations_business ON public.trainer_specializations USING btree (business_id);


--
-- Name: idx_webhook_events_processed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_events_processed ON public.webhook_events USING btree (processed);


--
-- Name: idx_webhook_events_stripe_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_webhook_events_stripe_id ON public.webhook_events USING btree (stripe_event_id);


--
-- Name: latency_metrics_area_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX latency_metrics_area_created_idx ON public.latency_metrics USING btree (area, created_at DESC);


--
-- Name: latency_metrics_route_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX latency_metrics_route_created_idx ON public.latency_metrics USING btree (route, created_at DESC);


--
-- Name: ops_overrides_expires_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ops_overrides_expires_idx ON public.ops_overrides USING btree (expires_at);


--
-- Name: ops_overrides_service_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ops_overrides_service_idx ON public.ops_overrides USING btree (service);


--
-- Name: payment_audit_business_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_audit_business_idx ON public.payment_audit USING btree (business_id);


--
-- Name: payment_audit_event_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payment_audit_event_idx ON public.payment_audit USING btree (event_type, created_at);


--
-- Name: triage_logs_created_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX triage_logs_created_idx ON public.triage_logs USING btree (created_at DESC);


--
-- Name: businesses trainer_requires_specialization_trg; Type: TRIGGER; Schema: public; Owner: -
--

CREATE CONSTRAINT TRIGGER trainer_requires_specialization_trg AFTER INSERT OR UPDATE ON public.businesses DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.enforce_trainer_requires_specialization();


--
-- Name: abn_verifications update_abn_verifications_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_abn_verifications_updated_at BEFORE UPDATE ON public.abn_verifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: businesses update_businesses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: emergency_resources update_emergency_resources_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_emergency_resources_updated_at BEFORE UPDATE ON public.emergency_resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reviews update_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: abn_fallback_events abn_fallback_events_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abn_fallback_events
    ADD CONSTRAINT abn_fallback_events_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;


--
-- Name: abn_verifications abn_verifications_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abn_verifications
    ADD CONSTRAINT abn_verifications_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: ai_review_decisions ai_review_decisions_review_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_review_decisions
    ADD CONSTRAINT ai_review_decisions_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;


--
-- Name: business_subscription_status business_subscription_status_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.business_subscription_status
    ADD CONSTRAINT business_subscription_status_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: businesses businesses_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: businesses businesses_suburb_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_suburb_id_fkey FOREIGN KEY (suburb_id) REFERENCES public.suburbs(id);


--
-- Name: council_contacts council_contacts_council_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.council_contacts
    ADD CONSTRAINT council_contacts_council_id_fkey FOREIGN KEY (council_id) REFERENCES public.councils(id) ON DELETE CASCADE;


--
-- Name: emergency_resources emergency_resources_suburb_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_resources
    ADD CONSTRAINT emergency_resources_suburb_id_fkey FOREIGN KEY (suburb_id) REFERENCES public.suburbs(id);


--
-- Name: emergency_triage_feedback emergency_triage_feedback_triage_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_triage_feedback
    ADD CONSTRAINT emergency_triage_feedback_triage_id_fkey FOREIGN KEY (triage_id) REFERENCES public.emergency_triage_logs(id) ON DELETE CASCADE;


--
-- Name: emergency_triage_logs emergency_triage_logs_user_suburb_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emergency_triage_logs
    ADD CONSTRAINT emergency_triage_logs_user_suburb_id_fkey FOREIGN KEY (user_suburb_id) REFERENCES public.suburbs(id);


--
-- Name: error_alert_events error_alert_events_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.error_alert_events
    ADD CONSTRAINT error_alert_events_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.error_alerts(id) ON DELETE CASCADE;


--
-- Name: featured_placement_events featured_placement_events_placement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_placement_events
    ADD CONSTRAINT featured_placement_events_placement_id_fkey FOREIGN KEY (placement_id) REFERENCES public.featured_placements(id) ON DELETE CASCADE;


--
-- Name: featured_placement_queue featured_placement_queue_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_placement_queue
    ADD CONSTRAINT featured_placement_queue_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: featured_placement_queue featured_placement_queue_lga_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_placement_queue
    ADD CONSTRAINT featured_placement_queue_lga_id_fkey FOREIGN KEY (lga_id) REFERENCES public.councils(id);


--
-- Name: featured_placements featured_placements_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_placements
    ADD CONSTRAINT featured_placements_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: featured_placements featured_placements_lga_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.featured_placements
    ADD CONSTRAINT featured_placements_lga_id_fkey FOREIGN KEY (lga_id) REFERENCES public.councils(id);


--
-- Name: payment_audit payment_audit_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_audit
    ADD CONSTRAINT payment_audit_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reviews reviews_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: search_telemetry search_telemetry_suburb_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.search_telemetry
    ADD CONSTRAINT search_telemetry_suburb_id_fkey FOREIGN KEY (suburb_id) REFERENCES public.suburbs(id);


--
-- Name: suburbs suburbs_council_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suburbs
    ADD CONSTRAINT suburbs_council_id_fkey FOREIGN KEY (council_id) REFERENCES public.councils(id) ON DELETE CASCADE;


--
-- Name: trainer_behavior_issues trainer_behavior_issues_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_behavior_issues
    ADD CONSTRAINT trainer_behavior_issues_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: trainer_services trainer_services_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_services
    ADD CONSTRAINT trainer_services_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: trainer_specializations trainer_specializations_business_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainer_specializations
    ADD CONSTRAINT trainer_specializations_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- Name: triage_events triage_events_triage_log_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triage_events
    ADD CONSTRAINT triage_events_triage_log_id_fkey FOREIGN KEY (triage_log_id) REFERENCES public.triage_logs(id) ON DELETE CASCADE;


--
-- Name: triage_logs triage_logs_suburb_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.triage_logs
    ADD CONSTRAINT triage_logs_suburb_id_fkey FOREIGN KEY (suburb_id) REFERENCES public.suburbs(id);


--
-- Name: businesses Active businesses are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Active businesses are viewable by everyone" ON public.businesses FOR SELECT USING ((is_active = true));


--
-- Name: reviews Admins can update reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update reviews" ON public.reviews FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: businesses Admins can view all businesses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all businesses" ON public.businesses FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: profiles Admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles profiles_1
  WHERE ((profiles_1.id = auth.uid()) AND (profiles_1.role = 'admin'::public.user_role)))));


--
-- Name: reviews Admins can view all reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can view all reviews" ON public.reviews FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::public.user_role)))));


--
-- Name: search_telemetry Allow authenticated access to latency stats; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow authenticated access to latency stats" ON public.search_telemetry FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: reviews Approved reviews are viewable by everyone; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Approved reviews are viewable by everyone" ON public.reviews FOR SELECT USING ((is_approved = true));


--
-- Name: abn_fallback_events Service role full access to abn fallback events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to abn fallback events" ON public.abn_fallback_events USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: abn_verifications Service role full access to abn verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to abn verifications" ON public.abn_verifications USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: ai_evaluation_runs Service role full access to ai evaluation runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to ai evaluation runs" ON public.ai_evaluation_runs USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: ai_review_decisions Service role full access to ai review decisions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to ai review decisions" ON public.ai_review_decisions USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: business_subscription_status Service role full access to business subscription status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to business subscription status" ON public.business_subscription_status USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: council_contacts Service role full access to council contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to council contacts" ON public.council_contacts USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: cron_job_runs Service role full access to cron job runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to cron job runs" ON public.cron_job_runs USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: daily_ops_digests Service role full access to daily ops digests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to daily ops digests" ON public.daily_ops_digests USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: emergency_resource_verification_events Service role full access to emergency resource verification eve; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to emergency resource verification eve" ON public.emergency_resource_verification_events USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: emergency_resource_verification_runs Service role full access to emergency resource verification run; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to emergency resource verification run" ON public.emergency_resource_verification_runs USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: emergency_resources Service role full access to emergency resources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to emergency resources" ON public.emergency_resources USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: emergency_triage_feedback Service role full access to emergency triage feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to emergency triage feedback" ON public.emergency_triage_feedback USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: emergency_triage_logs Service role full access to emergency triage logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to emergency triage logs" ON public.emergency_triage_logs USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: emergency_triage_weekly_metrics Service role full access to emergency triage weekly metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to emergency triage weekly metrics" ON public.emergency_triage_weekly_metrics USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: error_alert_events Service role full access to error alert events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to error alert events" ON public.error_alert_events USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: error_alerts Service role full access to error alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to error alerts" ON public.error_alerts USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: error_logs Service role full access to error logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to error logs" ON public.error_logs USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: featured_placement_events Service role full access to featured placement events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to featured placement events" ON public.featured_placement_events USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: featured_placement_queue Service role full access to featured placement queue; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to featured placement queue" ON public.featured_placement_queue USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: featured_placements Service role full access to featured placements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to featured placements" ON public.featured_placements USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: latency_metrics Service role full access to latency metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to latency metrics" ON public.latency_metrics USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: ops_overrides Service role full access to ops overrides; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to ops overrides" ON public.ops_overrides USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: payment_audit Service role full access to payment audit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to payment audit" ON public.payment_audit USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: search_telemetry Service role full access to search telemetry; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to search telemetry" ON public.search_telemetry USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: triage_events Service role full access to triage events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to triage events" ON public.triage_events USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: triage_logs Service role full access to triage logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to triage logs" ON public.triage_logs USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: webhook_events Service role full access to webhook events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role full access to webhook events" ON public.webhook_events USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: businesses Trainers can insert own businesses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Trainers can insert own businesses" ON public.businesses FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: businesses Trainers can update own businesses; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Trainers can update own businesses" ON public.businesses FOR UPDATE USING ((auth.uid() = profile_id));


--
-- Name: reviews Users can insert reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert reviews" ON public.reviews FOR INSERT WITH CHECK (true);


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((auth.uid() = id));


--
-- Name: abn_fallback_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.abn_fallback_events ENABLE ROW LEVEL SECURITY;

--
-- Name: abn_verifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.abn_verifications ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_evaluation_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_evaluation_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: ai_review_decisions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_review_decisions ENABLE ROW LEVEL SECURITY;

--
-- Name: business_subscription_status; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.business_subscription_status ENABLE ROW LEVEL SECURITY;

--
-- Name: businesses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

--
-- Name: council_contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.council_contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: cron_job_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cron_job_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_ops_digests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_ops_digests ENABLE ROW LEVEL SECURITY;

--
-- Name: emergency_resource_verification_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.emergency_resource_verification_events ENABLE ROW LEVEL SECURITY;

--
-- Name: emergency_resource_verification_runs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.emergency_resource_verification_runs ENABLE ROW LEVEL SECURITY;

--
-- Name: emergency_resources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.emergency_resources ENABLE ROW LEVEL SECURITY;

--
-- Name: emergency_triage_feedback; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.emergency_triage_feedback ENABLE ROW LEVEL SECURITY;

--
-- Name: emergency_triage_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.emergency_triage_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: emergency_triage_weekly_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.emergency_triage_weekly_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: error_alert_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.error_alert_events ENABLE ROW LEVEL SECURITY;

--
-- Name: error_alerts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.error_alerts ENABLE ROW LEVEL SECURITY;

--
-- Name: error_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: featured_placement_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.featured_placement_events ENABLE ROW LEVEL SECURITY;

--
-- Name: featured_placement_queue; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.featured_placement_queue ENABLE ROW LEVEL SECURITY;

--
-- Name: featured_placements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.featured_placements ENABLE ROW LEVEL SECURITY;

--
-- Name: latency_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.latency_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: ops_overrides; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ops_overrides ENABLE ROW LEVEL SECURITY;

--
-- Name: payment_audit; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.payment_audit ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: search_telemetry; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.search_telemetry ENABLE ROW LEVEL SECURITY;

--
-- Name: abn_fallback_events service-role-abn-fallback-events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-abn-fallback-events" ON public.abn_fallback_events USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: abn_verifications service-role-abn-verifications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-abn-verifications" ON public.abn_verifications USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: ai_evaluation_runs service-role-ai-evaluation-runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-ai-evaluation-runs" ON public.ai_evaluation_runs USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: ai_review_decisions service-role-ai-review-decisions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-ai-review-decisions" ON public.ai_review_decisions USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: business_subscription_status service-role-business-subscription-status; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-business-subscription-status" ON public.business_subscription_status USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: council_contacts service-role-council-contacts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-council-contacts" ON public.council_contacts USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: cron_job_runs service-role-cron-job-runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-cron-job-runs" ON public.cron_job_runs USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: daily_ops_digests service-role-daily-ops-digests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-daily-ops-digests" ON public.daily_ops_digests USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: emergency_resource_verification_events service-role-emergency-resource-verification-events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-emergency-resource-verification-events" ON public.emergency_resource_verification_events USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: emergency_resource_verification_runs service-role-emergency-resource-verification-runs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-emergency-resource-verification-runs" ON public.emergency_resource_verification_runs USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: emergency_resources service-role-emergency-resources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-emergency-resources" ON public.emergency_resources USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: emergency_triage_feedback service-role-emergency-triage-feedback; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-emergency-triage-feedback" ON public.emergency_triage_feedback USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: emergency_triage_logs service-role-emergency-triage-logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-emergency-triage-logs" ON public.emergency_triage_logs USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: emergency_triage_weekly_metrics service-role-emergency-triage-weekly-metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-emergency-triage-weekly-metrics" ON public.emergency_triage_weekly_metrics USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: error_alert_events service-role-error-alert-events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-error-alert-events" ON public.error_alert_events USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: error_alerts service-role-error-alerts; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-error-alerts" ON public.error_alerts USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: error_logs service-role-error-logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-error-logs" ON public.error_logs USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: featured_placement_events service-role-featured-placement-events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-featured-placement-events" ON public.featured_placement_events USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: featured_placement_queue service-role-featured-placement-queue; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-featured-placement-queue" ON public.featured_placement_queue USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: featured_placements service-role-featured-placements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-featured-placements" ON public.featured_placements USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: latency_metrics service-role-latency-metrics; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-latency-metrics" ON public.latency_metrics USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: ops_overrides service-role-ops-overrides; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-ops-overrides" ON public.ops_overrides USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: payment_audit service-role-payment-audit; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-payment-audit" ON public.payment_audit USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: triage_events service-role-triage-events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-triage-events" ON public.triage_events USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: triage_logs service-role-triage-logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-triage-logs" ON public.triage_logs USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: webhook_events service-role-webhook-events; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "service-role-webhook-events" ON public.webhook_events USING ((auth.role() = 'service_role'::text)) WITH CHECK ((auth.role() = 'service_role'::text));


--
-- Name: triage_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.triage_events ENABLE ROW LEVEL SECURITY;

--
-- Name: triage_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.triage_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: webhook_events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict N5UdAhQ7crLkQ9bzdqM3Z9BYsyhoz3NWDebo0MbimDq71eazJ2DTfu0AHThEDmc

