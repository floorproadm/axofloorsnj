import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CollaboratorProject {
  project_id: string;
  role: string;
  customer_name: string;
  project_status: string;
  project_type: string;
  address: string | null;
  city: string | null;
}

export function useCollaboratorProjects() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["collaborator-projects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("project_members")
        .select(`
          project_id,
          role,
          projects!inner (
            customer_name,
            project_status,
            project_type,
            address,
            city
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        project_id: row.project_id,
        role: row.role,
        customer_name: row.projects.customer_name,
        project_status: row.projects.project_status,
        project_type: row.projects.project_type,
        address: row.projects.address,
        city: row.projects.city,
      })) as CollaboratorProject[];
    },
    enabled: !!user?.id,
  });
}
