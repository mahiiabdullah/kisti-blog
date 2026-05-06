-- Indexes for performance improvements

-- Main listing query index: order by published_at for published posts
CREATE INDEX IF NOT EXISTS posts_status_published_at_idx ON posts(status, published_at DESC);

-- Index for translations by post_id (often joined)
CREATE INDEX IF NOT EXISTS post_translations_post_id_idx ON post_translations(post_id);

-- Index for tags by post_id
CREATE INDEX IF NOT EXISTS post_tags_post_id_idx ON post_tags(post_id);

-- Index for comment listing: post_id and approved status
CREATE INDEX IF NOT EXISTS comments_post_id_approved_idx ON comments(post_id, approved);
