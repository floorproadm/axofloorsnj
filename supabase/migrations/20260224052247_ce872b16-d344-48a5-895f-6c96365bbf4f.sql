
-- Add share_token column to feed_posts
ALTER TABLE public.feed_posts ADD COLUMN share_token uuid DEFAULT NULL;

-- Create unique index for fast lookup
CREATE UNIQUE INDEX idx_feed_posts_share_token ON public.feed_posts(share_token) WHERE share_token IS NOT NULL;

-- RLS policy: anyone can read a post if they have the share_token
CREATE POLICY "feed_posts_shared_read"
ON public.feed_posts
FOR SELECT
USING (share_token IS NOT NULL);

-- RLS policy: anyone can read images of shared posts
CREATE POLICY "feed_post_images_shared_read"
ON public.feed_post_images
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM feed_posts fp
  WHERE fp.id = feed_post_images.feed_post_id
  AND fp.share_token IS NOT NULL
));
