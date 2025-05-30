/*
  # Add Client and Therapist Availability Tables

  1. New Tables
    - `client_availability`
      - Client availability schedule
      - Weekly recurring schedule
      - Time slots and preferences
    
    - `therapist_availability` 
      - Therapist availability schedule
      - Weekly recurring schedule
      - Time slots and service types

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create client_availability table
CREATE TABLE IF NOT EXISTS client_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  location_preference text[],
  is_recurring boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_day CHECK (
    day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')
  ),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Create therapist_availability table
CREATE TABLE IF NOT EXISTS therapist_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id uuid REFERENCES therapists(id) ON DELETE CASCADE NOT NULL,
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  service_types text[],
  is_recurring boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_day CHECK (
    day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')
  ),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Enable RLS
ALTER TABLE client_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_availability ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS client_availability_client_id_idx ON client_availability(client_id);
CREATE INDEX IF NOT EXISTS client_availability_day_idx ON client_availability(day_of_week);
CREATE INDEX IF NOT EXISTS therapist_availability_therapist_id_idx ON therapist_availability(therapist_id);
CREATE INDEX IF NOT EXISTS therapist_availability_day_idx ON therapist_availability(day_of_week);

-- Add RLS policies for client_availability
CREATE POLICY "Clients can view their own availability"
  ON client_availability
  FOR SELECT
  TO authenticated
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      WHERE EXISTS (
        SELECT 1 FROM sessions s
        WHERE s.client_id = c.id
        AND s.therapist_id = auth.uid()
      )
    )
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

CREATE POLICY "Clients can manage their own availability"
  ON client_availability
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Add RLS policies for therapist_availability
CREATE POLICY "Therapists can view availability"
  ON therapist_availability
  FOR SELECT
  TO authenticated
  USING (
    therapist_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

CREATE POLICY "Therapists can manage their own availability"
  ON therapist_availability
  FOR ALL
  TO authenticated
  USING (
    therapist_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  )
  WITH CHECK (
    therapist_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_client_availability_updated_at
  BEFORE UPDATE ON client_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_therapist_availability_updated_at
  BEFORE UPDATE ON therapist_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migrate existing availability data
DO $$
DECLARE
  client_record RECORD;
  therapist_record RECORD;
  day_name text;
  start_time text;
  end_time text;
BEGIN
  -- Migrate client availability
  FOR client_record IN SELECT * FROM clients LOOP
    FOR day_name IN SELECT unnest(ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']) LOOP
      -- Extract start and end times for the current day
      start_time := (client_record.availability_hours->day_name->>'start');
      end_time := (client_record.availability_hours->day_name->>'end');
      
      -- Only insert if both start and end times exist
      IF start_time IS NOT NULL AND end_time IS NOT NULL THEN
        INSERT INTO client_availability (
          client_id,
          day_of_week,
          start_time,
          end_time,
          location_preference
        ) VALUES (
          client_record.id,
          day_name,
          start_time::time,
          end_time::time,
          client_record.service_preference
        );
      END IF;
    END LOOP;
  END LOOP;

  -- Migrate therapist availability
  FOR therapist_record IN SELECT * FROM therapists LOOP
    FOR day_name IN SELECT unnest(ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']) LOOP
      -- Extract start and end times for the current day
      start_time := (therapist_record.availability_hours->day_name->>'start');
      end_time := (therapist_record.availability_hours->day_name->>'end');
      
      -- Only insert if both start and end times exist
      IF start_time IS NOT NULL AND end_time IS NOT NULL THEN
        INSERT INTO therapist_availability (
          therapist_id,
          day_of_week,
          start_time,
          end_time,
          service_types
        ) VALUES (
          therapist_record.id,
          day_name,
          start_time::time,
          end_time::time,
          therapist_record.service_type
        );
      END IF;
    END LOOP;
  END LOOP;
END $$;