-- Add client_id to comments table for tracking user identity
-- This allows updating all comments when a user changes their display name

ALTER TABLE comments ADD COLUMN IF NOT EXISTS client_id UUID;

-- Create index for faster lookups by client_id
CREATE INDEX IF NOT EXISTS idx_comments_client_id ON comments(client_id);

-- Backfill existing comments with NULL client_id
-- (they won't be updatable, but new comments will be)
COMMENT ON COLUMN comments.client_id IS 'Anonymous client ID from browser localStorage for tracking user identity';
