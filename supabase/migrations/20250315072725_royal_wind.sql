/*
  # Add initial therapists

  1. Data
    - Insert 4 therapists with their:
      - Full names
      - Service types (In clinic, In home, Telehealth)
      - Weekly hours range
      - Availability schedule
*/

INSERT INTO therapists (
  email,
  full_name,
  service_type,
  weekly_hours_min,
  weekly_hours_max,
  availability_hours,
  specialties
) VALUES
(
  'brenna@example.com',
  'Brenna',
  ARRAY['In clinic', 'In home'],
  25,
  30,
  '{
    "monday": {"start": "10:00", "end": "18:30"},
    "tuesday": {"start": "10:00", "end": "18:30"},
    "wednesday": {"start": "10:00", "end": "18:30"},
    "thursday": {"start": "10:00", "end": "18:30"},
    "friday": {"start": "10:00", "end": "18:30"},
    "saturday": {"start": "08:00", "end": "18:30"}
  }'::jsonb,
  ARRAY['ABA Therapy']
),
(
  'aaron@example.com',
  'Aaron',
  ARRAY['Telehealth'],
  10,
  15,
  '{
    "monday": {"start": "12:00", "end": "17:00"},
    "tuesday": {"start": "12:00", "end": "17:00"},
    "wednesday": {"start": "12:00", "end": "17:00"},
    "thursday": {"start": "12:00", "end": "17:00"},
    "friday": {"start": "12:00", "end": "17:00"},
    "saturday": {"start": null, "end": null}
  }'::jsonb,
  ARRAY['ABA Therapy']
),
(
  'eric@example.com',
  'Eric',
  ARRAY['In clinic'],
  15,
  20,
  '{
    "monday": {"start": "10:00", "end": "18:30"},
    "tuesday": {"start": null, "end": null},
    "wednesday": {"start": "10:00", "end": "18:30"},
    "thursday": {"start": null, "end": null},
    "friday": {"start": "10:00", "end": "18:30"},
    "saturday": {"start": "08:00", "end": "18:30"}
  }'::jsonb,
  ARRAY['ABA Therapy']
),
(
  'john@example.com',
  'John',
  ARRAY['In clinic', 'In home'],
  10,
  15,
  '{
    "monday": {"start": "10:00", "end": "14:00"},
    "tuesday": {"start": "10:00", "end": "14:00"},
    "wednesday": {"start": "10:00", "end": "14:00"},
    "thursday": {"start": "10:00", "end": "14:00"},
    "friday": {"start": "10:00", "end": "14:00"},
    "saturday": {"start": null, "end": null}
  }'::jsonb,
  ARRAY['ABA Therapy']
);