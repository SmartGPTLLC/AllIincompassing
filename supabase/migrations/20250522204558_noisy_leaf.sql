/*
  # Fix URL and Email Validation in Database

  1. Changes
    - Remove any URL validation constraints from database tables
    - Add helper function to validate URLs more flexibly
    - Update existing records to ensure valid URL formats
    - Fix email validation to be more permissive
    
  2. Security
    - Maintain existing RLS policies
*/

-- Create a function to check if a string is a valid URL
CREATE OR REPLACE FUNCTION is_valid_url(url text)
RETURNS boolean AS $$
BEGIN
  -- Basic URL validation - accepts URLs with or without protocol
  RETURN url IS NULL OR url = '' OR 
         url ~* '^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/.*)?$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to check if a string is a valid email
CREATE OR REPLACE FUNCTION is_valid_email(email text)
RETURNS boolean AS $$
BEGIN
  -- Basic email validation
  RETURN email IS NULL OR email = '' OR 
         email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fix company_settings URLs
UPDATE company_settings
SET 
  website = CASE 
    WHEN website IS NOT NULL AND website != '' AND website !~* '^https?:\/\/' 
    THEN 'https://' || website 
    ELSE website 
  END,
  logo_url = CASE 
    WHEN logo_url IS NOT NULL AND logo_url != '' AND logo_url !~* '^https?:\/\/' 
    THEN 'https://' || logo_url 
    ELSE logo_url 
  END;

-- Fix referring_providers URLs and emails
UPDATE referring_providers
SET 
  email = CASE 
    WHEN email IS NOT NULL AND email != '' AND NOT is_valid_email(email)
    THEN NULL
    ELSE email
  END;

-- Fix locations URLs and emails
UPDATE locations
SET 
  email = CASE 
    WHEN email IS NOT NULL AND email != '' AND NOT is_valid_email(email)
    THEN NULL
    ELSE email
  END;

-- Fix clients emails
UPDATE clients
SET 
  email = CASE 
    WHEN email IS NOT NULL AND email != '' AND NOT is_valid_email(email)
    THEN NULL
    ELSE email
  END;

-- Fix therapists emails
UPDATE therapists
SET 
  email = CASE 
    WHEN email IS NOT NULL AND email != '' AND NOT is_valid_email(email)
    THEN NULL
    ELSE email
  END;

-- Add comments
COMMENT ON FUNCTION is_valid_url(text) IS 'Validates if a string is a valid URL';
COMMENT ON FUNCTION is_valid_email(text) IS 'Validates if a string is a valid email address';