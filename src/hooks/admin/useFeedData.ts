import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface FeedPost {
  id: string;
  project_id: string | null;
  post_type: string;
  title: string;
  description: string | null;
  location: string | null;
  category: string | null;
  tags: string[];
  visibility: string;
  status: string;
  folder_id: string | null;
  author_name: string;
  author_id: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  images?: FeedPostImage[];
}

export interface FeedPostImage {
  id: string;
  feed_post_id: string;
  file_url: string;
  file_type: string;
  display_order: number;
  created_at: string;
}

export interface FeedFolder {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  item_count: number;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export function useFeedPosts(search?: string) {
  return useQuery({
    queryKey: ["feed-posts", search],
    queryFn: async () => {
      let query = (supabase as any)
        .from("feed_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (search) {
        query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%,category.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch images for all posts
      const postIds = (data || []).map((p: any) => p.id);
      let images: any[] = [];
      if (postIds.length > 0) {
        const { data: imgData } = await (supabase as any)
          .from("feed_post_images")
          .select("*")
          .in("feed_post_id", postIds)
          .order("display_order", { ascending: true });
        images = imgData || [];
      }

      return (data || []).map((post: any) => ({
        ...post,
        tags: post.tags || [],
        images: images.filter((img: any) => img.feed_post_id === post.id),
      })) as FeedPost[];
    },
  });
}

export function useFeedFolders() {
  return useQuery({
    queryKey: ["feed-folders"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("feed_folders")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as FeedFolder[];
    },
  });
}
