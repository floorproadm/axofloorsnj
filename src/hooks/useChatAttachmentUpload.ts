import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB

export interface UploadedAttachment {
  url: string;
  type: string;
  name: string;
}

/**
 * Uploads a file to the `chat-attachments` storage bucket and returns the public URL.
 * Use `prefix="portal"` for anonymous portal uploads (only allowed folder for anon).
 */
export function useChatAttachmentUpload(prefix: "admin" | "team" | "field" | "portal" = "admin") {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File): Promise<UploadedAttachment | null> => {
    if (!file) return null;
    if (file.size > MAX_BYTES) {
      toast.error("Arquivo muito grande (máx 15MB)");
      return null;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("chat-attachments")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) {
        toast.error("Falha no upload: " + error.message);
        return null;
      }
      const { data } = supabase.storage.from("chat-attachments").getPublicUrl(path);
      return { url: data.publicUrl, type: file.type || "application/octet-stream", name: file.name };
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading };
}
