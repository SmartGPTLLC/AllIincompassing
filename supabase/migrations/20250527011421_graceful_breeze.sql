/*
  # Create Client Onboarding Storage

  1. Changes
    - Create storage bucket for client onboarding documents
    - Add RLS policies for document access
    - Add functions for document management
    
  2. Security
    - Ensure proper access controls
    - Restrict access to authorized users only
*/

-- Create function to handle client document uploads
CREATE OR REPLACE FUNCTION process_client_document(
  p_client_id uuid,
  p_document_type text,
  p_file_path text,
  p_file_name text,
  p_file_size integer,
  p_file_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_document jsonb;
  v_documents jsonb;
BEGIN
  -- Check if user can access client documents
  IF NOT can_access_client_documents(p_client_id) THEN
    RAISE EXCEPTION 'You do not have permission to upload documents for this client';
  END IF;

  -- Create document metadata
  v_document := jsonb_build_object(
    'type', p_document_type,
    'path', p_file_path,
    'name', p_file_name,
    'size', p_file_size,
    'file_type', p_file_type,
    'uploaded_at', now(),
    'uploaded_by', auth.uid()
  );

  -- Get existing documents
  SELECT documents INTO v_documents
  FROM clients
  WHERE id = p_client_id;

  -- If no documents exist yet, initialize as empty array
  IF v_documents IS NULL THEN
    v_documents := '[]'::jsonb;
  END IF;

  -- Add new document to array
  v_documents := v_documents || v_document;

  -- Update client record
  UPDATE clients
  SET documents = v_documents
  WHERE id = p_client_id;

  RETURN v_document;
END;
$$;

-- Create function to get client documents
CREATE OR REPLACE FUNCTION get_client_documents(
  p_client_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_documents jsonb;
BEGIN
  -- Check if user can access client documents
  IF NOT can_access_client_documents(p_client_id) THEN
    RAISE EXCEPTION 'You do not have permission to view documents for this client';
  END IF;

  -- Get documents
  SELECT documents INTO v_documents
  FROM clients
  WHERE id = p_client_id;

  -- If no documents exist yet, return empty array
  IF v_documents IS NULL THEN
    v_documents := '[]'::jsonb;
  END IF;

  RETURN v_documents;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_client_document(uuid, text, text, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_client_documents(uuid) TO authenticated;