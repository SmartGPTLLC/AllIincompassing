/*
  # Add Chat History Table

  1. New Tables
    - `chat_history`
      - Store conversation history
      - Link messages to users
      - Track message context and actions
    
  2. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  context jsonb DEFAULT '{}',
  action_type text,
  action_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_history_conversation_id ON chat_history(conversation_id);
CREATE INDEX idx_chat_history_created_at ON chat_history(created_at);

-- Add RLS policies
CREATE POLICY "Users can view their own chat history"
  ON chat_history
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own chat messages"
  ON chat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_chat_history_updated_at
  BEFORE UPDATE ON chat_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add function to get recent chat history
CREATE OR REPLACE FUNCTION get_recent_chat_history(
  p_conversation_id uuid DEFAULT NULL,
  p_limit integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  role text,
  content text,
  context jsonb,
  action_type text,
  action_data jsonb,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ch.id,
    ch.role,
    ch.content,
    ch.context,
    ch.action_type,
    ch.action_data,
    ch.created_at
  FROM chat_history ch
  WHERE ch.user_id = auth.uid()
  AND (p_conversation_id IS NULL OR ch.conversation_id = p_conversation_id)
  ORDER BY ch.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_recent_chat_history(uuid, integer) TO authenticated;