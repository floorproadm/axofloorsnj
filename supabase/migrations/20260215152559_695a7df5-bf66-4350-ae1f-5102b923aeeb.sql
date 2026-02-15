
-- 1. feed_folders
CREATE TABLE public.feed_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  cover_image_url text,
  item_count integer NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feed_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_folders_admin_all" ON public.feed_folders FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "feed_folders_public_read" ON public.feed_folders FOR SELECT USING (true);

CREATE TRIGGER update_feed_folders_updated_at BEFORE UPDATE ON public.feed_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. feed_posts
CREATE TABLE public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  post_type text NOT NULL DEFAULT 'photo',
  title text NOT NULL DEFAULT '',
  description text,
  location text,
  category text,
  tags text[] DEFAULT '{}',
  visibility text NOT NULL DEFAULT 'internal',
  status text NOT NULL DEFAULT 'draft',
  folder_id uuid REFERENCES public.feed_folders(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT 'Admin',
  author_id uuid,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_posts_admin_all" ON public.feed_posts FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "feed_posts_public_read" ON public.feed_posts FOR SELECT USING (visibility = 'public' AND status = 'published');

CREATE TRIGGER update_feed_posts_updated_at BEFORE UPDATE ON public.feed_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. feed_post_images
CREATE TABLE public.feed_post_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text NOT NULL DEFAULT 'image',
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feed_post_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_post_images_admin_all" ON public.feed_post_images FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "feed_post_images_public_read" ON public.feed_post_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.feed_posts fp WHERE fp.id = feed_post_id AND fp.visibility = 'public' AND fp.status = 'published')
);

-- 4. feed_comments
CREATE TABLE public.feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Admin',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feed_comments_admin_all" ON public.feed_comments FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
