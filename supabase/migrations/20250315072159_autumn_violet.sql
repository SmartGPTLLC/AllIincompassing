/*
  # Add initial clients

  1. New Data
    - Adding 4 initial clients with their:
      - Service hours per week
      - Service delivery preferences
      - Availability schedules
      
  2. Notes
    - Using placeholder emails with client initials
    - Setting default date of birth as needed
    - Structured availability hours for each day
*/

INSERT INTO clients (
  email,
  full_name,
  date_of_birth,
  service_preference,
  authorized_hours,
  availability_hours
) VALUES
(
  'pika@example.com',
  'PIKA',
  '2020-01-01',
  ARRAY['In clinic', 'In home'],
  12,
  '{
    "monday": {"start": null, "end": null},
    "tuesday": {"start": "10:00", "end": "18:00"},
    "wednesday": {"start": "10:00", "end": "18:00"},
    "thursday": {"start": "10:00", "end": "18:00"},
    "friday": {"start": null, "end": null},
    "saturday": {"start": null, "end": null}
  }'::jsonb
),
(
  'boop@example.com',
  'BOOP',
  '2020-01-01',
  ARRAY['In home'],
  10,
  '{
    "monday": {"start": "15:00", "end": "18:00"},
    "tuesday": {"start": "15:00", "end": "18:00"},
    "wednesday": {"start": "15:00", "end": "18:00"},
    "thursday": {"start": "15:00", "end": "18:00"},
    "friday": {"start": "15:00", "end": "18:00"},
    "saturday": {"start": null, "end": null}
  }'::jsonb
),
(
  'moog@example.com',
  'MOOG',
  '2020-01-01',
  ARRAY['Telehealth'],
  20,
  '{
    "monday": {"start": "12:00", "end": "18:00"},
    "tuesday": {"start": "12:00", "end": "18:00"},
    "wednesday": {"start": "12:00", "end": "18:00"},
    "thursday": {"start": "12:00", "end": "18:00"},
    "friday": {"start": "12:00", "end": "18:00"},
    "saturday": {"start": null, "end": null}
  }'::jsonb
),
(
  'mega@example.com',
  'MEGA',
  '2020-01-01',
  ARRAY['In clinic', 'In home'],
  25,
  '{
    "monday": {"start": "12:00", "end": "18:00"},
    "tuesday": {"start": "12:00", "end": "18:00"},
    "wednesday": {"start": "12:00", "end": "18:00"},
    "thursday": {"start": "12:00", "end": "18:00"},
    "friday": {"start": "12:00", "end": "18:00"},
    "saturday": {"start": "08:00", "end": "18:00"}
  }'::jsonb
);