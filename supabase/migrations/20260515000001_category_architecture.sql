-- 1. Add new columns to categories
ALTER TABLE categories
ADD COLUMN slug text UNIQUE,
ADD COLUMN description text,
ADD COLUMN icon_url text,
ADD COLUMN is_active boolean DEFAULT true;

-- 2. Add unique constraint to post_categories to prevent duplicate tags
ALTER TABLE post_categories
ADD CONSTRAINT post_categories_unique_relation UNIQUE (post_id, category_id);

-- 3. Data Migration for Post Categories Relation
-- This inserts missing (post_id, category_id) combinations for legacy posts
-- where the post has a 'category_bn' but no entry in 'post_categories'.
INSERT INTO post_categories (post_id, category_id)
SELECT p.id as post_id, c.id as category_id
FROM posts p
JOIN categories c ON c.name_bn = p.category_bn
WHERE NOT EXISTS (
    SELECT 1 FROM post_categories pc WHERE pc.post_id = p.id AND pc.category_id = c.id
);

-- Note: Slugs must be generated manually or via the API migration route
-- because translating Bengali to English slugs in raw SQL is difficult.
-- We will handle slug generation in the Next.js application layer.
