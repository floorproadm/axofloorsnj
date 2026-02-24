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

export interface FeedComment {
  id: string;
  feed_post_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export function useFeedPosts(search?: string, page = 0, pageSize = 20) {
  return useQuery({
    queryKey: ["feed-posts", search, page, pageSize],
    queryFn: async () => {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from("feed_posts")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (search) {
        query = query.or(`title.ilike.%${search}%,location.ilike.%${search}%,category.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      const postIds = (data || []).map((p) => p.id);
      let images: FeedPostImage[] = [];
      if (postIds.length > 0) {
        const { data: imgData } = await supabase
          .from("feed_post_images")
          .select("*")
          .in("feed_post_id", postIds)
          .order("display_order", { ascending: true });
        images = (imgData || []) as FeedPostImage[];
      }

      const posts = (data || []).map((post) => ({
        ...post,
        tags: post.tags || [],
        images: images.filter((img) => img.feed_post_id === post.id),
      })) as FeedPost[];

      return { posts, totalCount: count ?? posts.length };
    },
  });
}

export function useFeedPost(postId: string | undefined) {
  return useQuery({
    queryKey: ["feed-post", postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_posts")
        .select("*")
        .eq("id", postId!)
        .single();
      if (error) throw error;

      const { data: imgData } = await supabase
        .from("feed_post_images")
        .select("*")
        .eq("feed_post_id", postId!)
        .order("display_order", { ascending: true });

      return {
        ...data,
        tags: data.tags || [],
        images: (imgData || []) as FeedPostImage[],
      } as FeedPost;
    },
  });
}

export function useFeedComments(postId: string | undefined) {
  return useQuery({
    queryKey: ["feed-comments", postId],
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_comments")
        .select("*")
        .eq("feed_post_id", postId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as FeedComment[];
    },
  });
}

export function useFeedFolders() {
  return useQuery({
    queryKey: ["feed-folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_folders")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as FeedFolder[];
    },
  });
}

export function useCreateFeedPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (post: {
      title: string;
      description?: string;
      post_type?: string;
      location?: string;
      category?: string;
      tags?: string[];
      visibility?: string;
      status?: string;
      folder_id?: string | null;
      project_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("feed_posts")
        .insert(post)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast({ title: "Post criado com sucesso" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao criar post", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateFeedPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FeedPost> & { id: string }) => {
      const { data, error } = await supabase
        .from("feed_posts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed-post", data.id] });
      toast({ title: "Post atualizado com sucesso" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao atualizar post", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteFeedPostImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, postId }: { id: string; postId: string }) => {
      const { error } = await supabase.from("feed_post_images").delete().eq("id", id);
      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ["feed-post", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
    },
  });
}

export function useUploadFeedImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, file, order }: { postId: string; file: File; order: number }) => {
      const ext = file.name.split(".").pop();
      const legacyPath = `${postId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const fileType = file.type.startsWith("video") ? "video" : "image";

      // LEGACY: upload to feed-media bucket
      const { error: uploadError } = await supabase.storage
        .from("feed-media")
        .upload(legacyPath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("feed-media").getPublicUrl(legacyPath);

      // LEGACY: insert into feed_post_images
      const { error: dbError } = await supabase.from("feed_post_images").insert({
        feed_post_id: postId,
        file_url: urlData.publicUrl,
        file_type: fileType,
        display_order: order,
      });
      if (dbError) throw dbError;

      // DUAL-WRITE: upload to media bucket + media_files table
      try {
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 8);
        const mediaPath = `feed/${postId}/${timestamp}-${random}.${ext}`;

        await supabase.storage.from("media").upload(mediaPath, file);

        await supabase.from("media_files").insert({
          feed_post_id: postId,
          source_type: "feed",
          visibility: "internal",
          folder_type: "job_progress",
          file_type: fileType,
          storage_path: mediaPath,
          display_order: order,
        });
      } catch (dualWriteErr) {
        console.warn("Dual-write to media_files failed (non-blocking):", dualWriteErr);
      }

      return urlData.publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["media-files"] });
    },
  });
}

export function useDeleteFeedPost() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (postId: string) => {
      // 1. Delete images
      const { error: imgErr } = await supabase
        .from("feed_post_images")
        .delete()
        .eq("feed_post_id", postId);
      if (imgErr) throw imgErr;

      // 2. Delete comments
      const { error: cmtErr } = await supabase
        .from("feed_comments")
        .delete()
        .eq("feed_post_id", postId);
      if (cmtErr) throw cmtErr;

      // 3. Delete post
      const { error: postErr } = await supabase
        .from("feed_posts")
        .delete()
        .eq("id", postId);
      if (postErr) throw postErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["feed-folders"] });
      toast({ title: "Post deletado com sucesso" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao deletar post", description: err.message, variant: "destructive" });
    },
  });
}

export function useAddFeedComment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ postId, content, authorName }: { postId: string; content: string; authorName?: string }) => {
      const { data, error } = await supabase
        .from("feed_comments")
        .insert({
          feed_post_id: postId,
          content,
          author_name: authorName || "Admin",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feed-comments", data.feed_post_id] });
      queryClient.invalidateQueries({ queryKey: ["feed-post", data.feed_post_id] });
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast({ title: "Comentário adicionado" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao comentar", description: err.message, variant: "destructive" });
    },
  });
}
