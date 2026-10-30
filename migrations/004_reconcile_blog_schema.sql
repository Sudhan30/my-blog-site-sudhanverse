-- Reconcile blog_db schema with Sudhanverse Bun SSR blog expectations
-- Safe and idempotent to run multiple times

-- 1. Reconcile comments table (bridge legacy author_name/approved with display_name/status)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE comments ALTER COLUMN author_name SET DEFAULT 'Anonymous';
ALTER TABLE comments ALTER COLUMN author_name DROP NOT NULL;
UPDATE comments SET display_name = COALESCE(display_name, author_name, 'Anonymous') WHERE display_name IS NULL;
ALTER TABLE comments ALTER COLUMN display_name SET DEFAULT 'Anonymous';

ALTER TABLE comments ADD COLUMN IF NOT EXISTS status VARCHAR(32) DEFAULT 'approved';
UPDATE comments SET status = CASE WHEN approved IS FALSE THEN 'rejected' ELSE 'approved' END WHERE status IS NULL;

ALTER TABLE comments ADD COLUMN IF NOT EXISTS client_id UUID;
CREATE INDEX IF NOT EXISTS idx_comments_client_id ON comments(client_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);

-- Keep author_name and display_name in sync via trigger if either is omitted
CREATE OR REPLACE FUNCTION sync_comment_author_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.display_name IS NULL AND NEW.author_name IS NOT NULL THEN
        NEW.display_name := NEW.author_name;
    ELSIF NEW.author_name IS NULL AND NEW.display_name IS NOT NULL THEN
        NEW.author_name := NEW.display_name;
    ELSIF NEW.display_name IS NULL AND NEW.author_name IS NULL THEN
        NEW.display_name := 'Anonymous';
        NEW.author_name := 'Anonymous';
    END IF;
    IF NEW.status IS NULL THEN
        NEW.status := CASE WHEN NEW.approved IS FALSE THEN 'rejected' ELSE 'approved' END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_comment_author_columns ON comments;
CREATE TRIGGER trg_sync_comment_author_columns
    BEFORE INSERT OR UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION sync_comment_author_columns();

-- 2. Create comment_likes table (003_comment_likes.sql)
CREATE TABLE IF NOT EXISTS comment_likes (
    id BIGSERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(comment_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_client_id ON comment_likes(client_id);

-- 3. Create comment_summaries table if missing
CREATE TABLE IF NOT EXISTS comment_summaries (
    id SERIAL PRIMARY KEY,
    post_id VARCHAR(255) UNIQUE NOT NULL,
    summary_text TEXT NOT NULL,
    comment_count INTEGER DEFAULT 0,
    last_comment_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_comment_summaries_post_id ON comment_summaries(post_id);

-- 4. Create newsletter and telemetry tables (001_telemetry_schema.sql)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed'))
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribed_at ON newsletter_subscribers(subscribed_at);

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    viewport_width INTEGER,
    viewport_height INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at);

CREATE TABLE IF NOT EXISTS page_views (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    referrer TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_url ON page_views(url);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES user_sessions(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_name ON events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_data ON events USING GIN(event_data);

-- 5. Remove fake seed rows from bootstrap init script
DELETE FROM likes WHERE post_id IN ('sample-post-1', 'sample-post-2');
DELETE FROM comments WHERE post_id IN ('sample-post-1', 'sample-post-2');
