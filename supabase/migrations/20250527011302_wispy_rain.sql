/*
  # Add Reporting Functions

  1. Changes
    - Add functions for generating reports
    - Add functions for aggregating metrics
    - Add helper functions for date calculations
    
  2. Security
    - Add proper security policies
    - Ensure functions are accessible to authenticated users
*/

-- Create function to get sessions in date range
CREATE OR REPLACE FUNCTION get_sessions_report(
  p_start_date date,
  p_end_date date,
  p_therapist_id uuid DEFAULT NULL,
  p_client_id uuid DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  therapist_id uuid,
  start_time timestamptz,
  end_time timestamptz,
  status text,
  notes text,
  created_at timestamptz,
  client_name text,
  therapist_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.client_id,
    s.therapist_id,
    s.start_time,
    s.end_time,
    s.status,
    s.notes,
    s.created_at,
    c.full_name as client_name,
    t.full_name as therapist_name
  FROM sessions s
  JOIN clients c ON s.client_id = c.id
  JOIN therapists t ON s.therapist_id = t.id
  WHERE s.start_time >= p_start_date
    AND s.start_time <= (p_end_date + interval '1 day')
    AND (p_therapist_id IS NULL OR s.therapist_id = p_therapist_id)
    AND (p_client_id IS NULL OR s.client_id = p_client_id)
    AND (p_status IS NULL OR s.status = p_status)
  ORDER BY s.start_time DESC;
END;
$$;

-- Create function to get client metrics
CREATE OR REPLACE FUNCTION get_client_metrics(
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  total_clients bigint,
  active_clients bigint,
  inactive_clients bigint,
  new_clients bigint,
  service_preferences jsonb,
  sessions_per_client jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_clients bigint;
  v_active_clients bigint;
  v_inactive_clients bigint;
  v_new_clients bigint;
  v_service_preferences jsonb;
  v_sessions_per_client jsonb;
BEGIN
  -- Get total clients
  SELECT COUNT(*) INTO v_total_clients FROM clients;
  
  -- Get active clients (those with sessions in date range)
  SELECT COUNT(DISTINCT client_id) INTO v_active_clients
  FROM sessions
  WHERE start_time >= p_start_date
    AND start_time <= (p_end_date + interval '1 day');
  
  -- Calculate inactive clients
  v_inactive_clients := v_total_clients - v_active_clients;
  
  -- Get new clients (created in date range)
  SELECT COUNT(*) INTO v_new_clients
  FROM clients
  WHERE created_at >= p_start_date
    AND created_at <= (p_end_date + interval '1 day');
  
  -- Get service preferences distribution
  WITH preferences AS (
    SELECT 
      unnest(service_preference) as preference,
      COUNT(*) as count
    FROM clients
    GROUP BY preference
  )
  SELECT jsonb_object_agg(preference, count) INTO v_service_preferences
  FROM preferences;
  
  -- Get sessions per client
  WITH client_sessions AS (
    SELECT 
      c.id,
      c.full_name,
      COUNT(s.id) as session_count
    FROM clients c
    LEFT JOIN sessions s ON c.id = s.client_id
      AND s.start_time >= p_start_date
      AND s.start_time <= (p_end_date + interval '1 day')
    GROUP BY c.id, c.full_name
    ORDER BY session_count DESC
    LIMIT 10
  )
  SELECT jsonb_object_agg(full_name, session_count) INTO v_sessions_per_client
  FROM client_sessions;
  
  -- Return results
  RETURN QUERY SELECT 
    v_total_clients,
    v_active_clients,
    v_inactive_clients,
    v_new_clients,
    v_service_preferences,
    v_sessions_per_client;
END;
$$;

-- Create function to get therapist metrics
CREATE OR REPLACE FUNCTION get_therapist_metrics(
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  total_therapists bigint,
  active_therapists bigint,
  inactive_therapists bigint,
  specialties jsonb,
  service_types jsonb,
  sessions_per_therapist jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_therapists bigint;
  v_active_therapists bigint;
  v_inactive_therapists bigint;
  v_specialties jsonb;
  v_service_types jsonb;
  v_sessions_per_therapist jsonb;
BEGIN
  -- Get total therapists
  SELECT COUNT(*) INTO v_total_therapists FROM therapists;
  
  -- Get active therapists (those with sessions in date range)
  SELECT COUNT(DISTINCT therapist_id) INTO v_active_therapists
  FROM sessions
  WHERE start_time >= p_start_date
    AND start_time <= (p_end_date + interval '1 day');
  
  -- Calculate inactive therapists
  v_inactive_therapists := v_total_therapists - v_active_therapists;
  
  -- Get specialties distribution
  WITH specs AS (
    SELECT 
      unnest(specialties) as specialty,
      COUNT(*) as count
    FROM therapists
    GROUP BY specialty
  )
  SELECT jsonb_object_agg(specialty, count) INTO v_specialties
  FROM specs;
  
  -- Get service types distribution
  WITH types AS (
    SELECT 
      unnest(service_type) as service_type,
      COUNT(*) as count
    FROM therapists
    GROUP BY service_type
  )
  SELECT jsonb_object_agg(service_type, count) INTO v_service_types
  FROM types;
  
  -- Get sessions per therapist
  WITH therapist_sessions AS (
    SELECT 
      t.id,
      t.full_name,
      COUNT(s.id) as session_count
    FROM therapists t
    LEFT JOIN sessions s ON t.id = s.therapist_id
      AND s.start_time >= p_start_date
      AND s.start_time <= (p_end_date + interval '1 day')
    GROUP BY t.id, t.full_name
    ORDER BY session_count DESC
    LIMIT 10
  )
  SELECT jsonb_object_agg(full_name, session_count) INTO v_sessions_per_therapist
  FROM therapist_sessions;
  
  -- Return results
  RETURN QUERY SELECT 
    v_total_therapists,
    v_active_therapists,
    v_inactive_therapists,
    v_specialties,
    v_service_types,
    v_sessions_per_therapist;
END;
$$;

-- Create function to get authorization metrics
CREATE OR REPLACE FUNCTION get_authorization_metrics(
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  total_authorizations bigint,
  approved_authorizations bigint,
  pending_authorizations bigint,
  denied_authorizations bigint,
  expired_authorizations bigint,
  total_requested_units bigint,
  total_approved_units bigint,
  units_by_service_code jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_authorizations bigint;
  v_approved_authorizations bigint;
  v_pending_authorizations bigint;
  v_denied_authorizations bigint;
  v_expired_authorizations bigint;
  v_total_requested_units bigint;
  v_total_approved_units bigint;
  v_units_by_service_code jsonb;
BEGIN
  -- Get authorization counts by status
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'denied'),
    COUNT(*) FILTER (WHERE status = 'expired')
  INTO 
    v_total_authorizations,
    v_approved_authorizations,
    v_pending_authorizations,
    v_denied_authorizations,
    v_expired_authorizations
  FROM authorizations
  WHERE start_date <= p_end_date
    AND end_date >= p_start_date;
  
  -- Get total requested and approved units
  SELECT 
    COALESCE(SUM(s.requested_units), 0),
    COALESCE(SUM(s.approved_units), 0)
  INTO 
    v_total_requested_units,
    v_total_approved_units
  FROM authorizations a
  JOIN authorization_services s ON a.id = s.authorization_id
  WHERE a.start_date <= p_end_date
    AND a.end_date >= p_start_date;
  
  -- Get units by service code
  WITH service_units AS (
    SELECT 
      s.service_code,
      SUM(s.approved_units) as units
    FROM authorizations a
    JOIN authorization_services s ON a.id = s.authorization_id
    WHERE a.start_date <= p_end_date
      AND a.end_date >= p_start_date
    GROUP BY s.service_code
  )
  SELECT jsonb_object_agg(service_code, units) INTO v_units_by_service_code
  FROM service_units;
  
  -- Return results
  RETURN QUERY SELECT 
    v_total_authorizations,
    v_approved_authorizations,
    v_pending_authorizations,
    v_denied_authorizations,
    v_expired_authorizations,
    v_total_requested_units,
    v_total_approved_units,
    v_units_by_service_code;
END;
$$;

-- Create function to get billing metrics
CREATE OR REPLACE FUNCTION get_billing_metrics(
  p_start_date date,
  p_end_date date
)
RETURNS TABLE (
  total_billed numeric,
  paid_amount numeric,
  pending_amount numeric,
  rejected_amount numeric,
  amount_by_status jsonb,
  amount_by_client jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_billed numeric;
  v_paid_amount numeric;
  v_pending_amount numeric;
  v_rejected_amount numeric;
  v_amount_by_status jsonb;
  v_amount_by_client jsonb;
BEGIN
  -- Get billing amounts by status
  SELECT 
    COALESCE(SUM(amount), 0),
    COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0),
    COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0),
    COALESCE(SUM(amount) FILTER (WHERE status = 'rejected'), 0)
  INTO 
    v_total_billed,
    v_paid_amount,
    v_pending_amount,
    v_rejected_amount
  FROM billing_records
  WHERE created_at >= p_start_date
    AND created_at <= (p_end_date + interval '1 day');
  
  -- Get amount by status
  SELECT jsonb_build_object(
    'paid', v_paid_amount,
    'pending', v_pending_amount,
    'rejected', v_rejected_amount
  ) INTO v_amount_by_status;
  
  -- Get amount by client
  WITH client_billing AS (
    SELECT 
      c.full_name,
      COALESCE(SUM(b.amount), 0) as total_amount
    FROM clients c
    LEFT JOIN sessions s ON c.id = s.client_id
    LEFT JOIN billing_records b ON s.id = b.session_id
      AND b.created_at >= p_start_date
      AND b.created_at <= (p_end_date + interval '1 day')
    GROUP BY c.full_name
    ORDER BY total_amount DESC
    LIMIT 10
  )
  SELECT jsonb_object_agg(full_name, total_amount) INTO v_amount_by_client
  FROM client_billing;
  
  -- Return results
  RETURN QUERY SELECT 
    v_total_billed,
    v_paid_amount,
    v_pending_amount,
    v_rejected_amount,
    v_amount_by_status,
    v_amount_by_client;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_sessions_report(date, date, uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_metrics(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_therapist_metrics(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_authorization_metrics(date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION get_billing_metrics(date, date) TO authenticated;