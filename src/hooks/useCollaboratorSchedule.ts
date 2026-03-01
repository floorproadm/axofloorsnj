import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfWeek, endOfWeek, format, addWeeks } from "date-fns";

export interface CollaboratorAppointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: string;
  duration_hours: number | null;
  status: string;
  location: string | null;
  notes: string | null;
  customer_name: string;
  project_id: string | null;
}

export function useCollaboratorSchedule(weekOffset: number = 0) {
  const { user } = useAuth();

  const referenceDate = addWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 });

  return useQuery({
    queryKey: ["collaborator-schedule", user?.id, weekOffset],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get collaborator's project IDs
      const { data: memberships } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);

      if (!memberships || memberships.length === 0) return [];

      const projectIds = memberships.map((m) => m.project_id);

      // Get appointments for those projects in the week range
      const { data, error } = await supabase
        .from("appointments")
        .select("id, appointment_date, appointment_time, appointment_type, duration_hours, status, location, notes, customer_name, project_id")
        .in("project_id", projectIds)
        .gte("appointment_date", format(weekStart, "yyyy-MM-dd"))
        .lte("appointment_date", format(weekEnd, "yyyy-MM-dd"))
        .order("appointment_date", { ascending: true })
        .order("appointment_time", { ascending: true });

      if (error) throw error;
      return (data || []) as CollaboratorAppointment[];
    },
    enabled: !!user?.id,
  });
}
