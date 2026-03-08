import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus, Truck, Users, MapPin, Phone, Mail, Wrench,
  Loader2, Trash2, Edit3, CheckCircle2, Circle,
  Star, Hash
} from "lucide-react";
import { cn } from "@/lib/utils";

const REGIONS = ["North NJ", "Central NJ", "South NJ", "NYC/Tri-State", "All Regions"];
const EMPLOYMENT_TYPES = ["Head", "Full-Time Employee", "Daily Rate", "Subcontractor"];
const ROLES = [
  "Sanding & Refinishing", "Hardwood Installation", "Vinyl/LVP",
  "Laminate", "Tile", "Demolition", "Trim & Molding", "Supervisor"
];
const VAN_STATUSES = ["Available", "In Use", "Maintenance", "Out of Service"];

interface CrewMember {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface VanEntry {
  id: string;
  description: string | null;
  notes: string | null;
  amount: number;
  payment_date: string;
  category: string;
  status: string;
}

// We store crew members in profiles table, vans as a local state + payments category
// Using profiles for crew, and a dedicated "fleet" payment category for van costs

export default function CrewsVans() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"crew" | "vans">("crew");
  const [showNewCrew, setShowNewCrew] = useState(false);
  const [showNewVan, setShowNewVan] = useState(false);
  const [editCrew, setEditCrew] = useState<CrewMember | null>(null);

  const [crewForm, setCrewForm] = useState({
    full_name: "", phone: "", email: "", role: "", bio: "",
    employment_type: "", region: "", daily_rate: ""
  });

  const [vanForm, setVanForm] = useState({
    name: "", plate: "", year: "", make: "", model: "",
    region: "", status: "Available", notes: ""
  });

  // Fetch crew from profiles
  const { data: crew = [], isLoading: loadingCrew } = useQuery({
    queryKey: ["crew-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, role, bio, avatar_url, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CrewMember[];
    },
  });

  // Fetch van records (stored as payments with category "fleet")
  const { data: vanRecords = [], isLoading: loadingVans } = useQuery({
    queryKey: ["van-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, description, notes, amount, payment_date, category, status")
        .eq("category", "fleet")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Add crew member (update profile)
  const addCrewMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").insert({
        full_name: crewForm.full_name,
        phone: crewForm.phone || null,
        email: crewForm.email || null,
        role: crewForm.role || null,
        bio: [
          crewForm.employment_type && `Type: ${crewForm.employment_type}`,
          crewForm.region && `Region: ${crewForm.region}`,
          crewForm.daily_rate && `Rate: $${crewForm.daily_rate}/day`,
          crewForm.bio,
        ].filter(Boolean).join(" · ") || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Crew member added");
      qc.invalidateQueries({ queryKey: ["crew-members"] });
      setShowNewCrew(false);
      setCrewForm({ full_name: "", phone: "", email: "", role: "", bio: "", employment_type: "", region: "", daily_rate: "" });
    },
    onError: (e: any) => toast.error(e.message || "Failed to add crew member"),
  });

  // Add van record
  const addVanMutation = useMutation({
    mutationFn: async () => {
      const description = [
        vanForm.year, vanForm.make, vanForm.model,
        vanForm.plate && `(${vanForm.plate})`,
        `— ${vanForm.name || "Van"}`
      ].filter(Boolean).join(" ");

      const { error } = await supabase.from("payments").insert({
        amount: 0,
        category: "fleet",
        description,
        notes: [
          vanForm.region && `Region: ${vanForm.region}`,
          `Status: ${vanForm.status}`,
          vanForm.notes
        ].filter(Boolean).join(" · ") || null,
        payment_date: new Date().toISOString().split("T")[0],
        status: vanForm.status === "Available" ? "confirmed" : "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Van added to fleet");
      qc.invalidateQueries({ queryKey: ["van-records"] });
      setShowNewVan(false);
      setVanForm({ name: "", plate: "", year: "", make: "", model: "", region: "", status: "Available", notes: "" });
    },
    onError: (e: any) => toast.error(e.message || "Failed to add van"),
  });

  const deleteCrewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Removed"); qc.invalidateQueries({ queryKey: ["crew-members"] }); },
  });

  const deleteVanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Van removed"); qc.invalidateQueries({ queryKey: ["van-records"] }); },
  });

  const toggleVanStatus = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: string }) => {
      const next = current === "confirmed" ? "pending" : "confirmed";
      const { error } = await supabase.from("payments").update({ status: next }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["van-records"] }),
  });

  const initials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const roleColors: Record<string, string> = {
    "Sanding & Refinishing": "bg-amber-500/10 text-amber-600 border-amber-500/20",
    "Hardwood Installation": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    "Supervisor": "bg-purple-500/10 text-purple-600 border-purple-500/20",
    "Tile": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };

  return (
    <AdminLayout title="Crews & Vans">
      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Crews & Fleet</h1>
              <p className="text-xs text-muted-foreground">
                {crew.length} workers · {vanRecords.length} vehicles
              </p>
            </div>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => tab === "crew" ? setShowNewCrew(true) : setShowNewVan(true)}>
            <Plus className="w-4 h-4" /> {tab === "crew" ? "Add Worker" : "Add Van"}
          </Button>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "crew" | "vans")}>
          <TabsList className="w-full max-w-xs h-10 bg-muted/50 p-1">
            <TabsTrigger value="crew" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-card">
              <Users className="w-3.5 h-3.5" /> Crew ({crew.length})
            </TabsTrigger>
            <TabsTrigger value="vans" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-card">
              <Truck className="w-3.5 h-3.5" /> Fleet ({vanRecords.length})
            </TabsTrigger>
          </TabsList>

          {/* CREW TAB */}
          <TabsContent value="crew" className="mt-4">
            {loadingCrew ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : crew.length === 0 ? (
              <Card className="border-dashed border-2 border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                  <Users className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No crew members yet</p>
                  <Button size="sm" variant="outline" onClick={() => setShowNewCrew(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add First Worker
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {crew.map((member) => (
                  <Card key={member.id} className="border-border/50 hover:border-primary/30 transition-colors group">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0 font-bold text-sm text-primary">
                          {initials(member.full_name || "?")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{member.full_name}</p>
                          {member.role && (
                            <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5 mt-0.5", roleColors[member.role] || "")}>
                              {member.role}
                            </Badge>
                          )}
                          {member.bio && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{member.bio}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {member.phone && (
                              <a href={`tel:${member.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                <Phone className="w-3 h-3" /> {member.phone}
                              </a>
                            )}
                            {member.email && (
                              <a href={`mailto:${member.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                <Mail className="w-3 h-3" /> {member.email.split("@")[0]}
                              </a>
                            )}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          onClick={() => deleteCrewMutation.mutate(member.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* VANS TAB */}
          <TabsContent value="vans" className="mt-4">
            {loadingVans ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : vanRecords.length === 0 ? (
              <Card className="border-dashed border-2 border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                  <Truck className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No vehicles registered</p>
                  <Button size="sm" variant="outline" onClick={() => setShowNewVan(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add First Van
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {vanRecords.map((van: any) => {
                  const isAvailable = van.status === "confirmed";
                  return (
                    <Card key={van.id} className="border-border/50 hover:border-primary/30 transition-colors group">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                          isAvailable
                            ? "bg-emerald-500/10 border border-emerald-500/20"
                            : "bg-amber-500/10 border border-amber-500/20"
                        )}>
                          <Truck className={cn("w-5 h-5", isAvailable ? "text-emerald-500" : "text-amber-500")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{van.description ?? "Vehicle"}</p>
                          {van.notes && (
                            <p className="text-xs text-muted-foreground truncate">{van.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => toggleVanStatus.mutate({ id: van.id, current: van.status })}
                            className={cn(
                              "text-xs px-2.5 py-1 rounded-full border font-medium transition-colors",
                              isAvailable
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20"
                            )}
                          >
                            {isAvailable ? "Available" : "In Use"}
                          </button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteVanMutation.mutate(van.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ADD CREW DIALOG */}
      <Dialog open={showNewCrew} onOpenChange={setShowNewCrew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Add Crew Member
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input placeholder="e.g. Carlos Silva" value={crewForm.full_name} onChange={e => setCrewForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Select value={crewForm.role} onValueChange={v => setCrewForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Employment Type</Label>
                <Select value={crewForm.employment_type} onValueChange={v => setCrewForm(f => ({ ...f, employment_type: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>{EMPLOYMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input placeholder="(732) 555-0000" value={crewForm.phone} onChange={e => setCrewForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Daily Rate ($)</Label>
                <Input type="number" placeholder="250" value={crewForm.daily_rate} onChange={e => setCrewForm(f => ({ ...f, daily_rate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Region</Label>
                <Select value={crewForm.region} onValueChange={v => setCrewForm(f => ({ ...f, region: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input placeholder="worker@email.com" value={crewForm.email} onChange={e => setCrewForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Input placeholder="Optional notes..." value={crewForm.bio} onChange={e => setCrewForm(f => ({ ...f, bio: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewCrew(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!crewForm.full_name || addCrewMutation.isPending} onClick={() => addCrewMutation.mutate()}>
                {addCrewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Member"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ADD VAN DIALOG */}
      <Dialog open={showNewVan} onOpenChange={setShowNewVan}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-4 h-4" /> Add Vehicle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Van Name / ID *</Label>
                <Input placeholder='e.g. "Van 1" or "North Jersey Crew"' value={vanForm.name} onChange={e => setVanForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Year</Label>
                <Input placeholder="2022" value={vanForm.year} onChange={e => setVanForm(f => ({ ...f, year: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Make / Model</Label>
                <Input placeholder="Ford Transit" value={vanForm.make} onChange={e => setVanForm(f => ({ ...f, make: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">License Plate</Label>
                <Input placeholder="NJR 1234" value={vanForm.plate} onChange={e => setVanForm(f => ({ ...f, plate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Region</Label>
                <Select value={vanForm.region} onValueChange={v => setVanForm(f => ({ ...f, region: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>{REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={vanForm.status} onValueChange={v => setVanForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{VAN_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Input placeholder="Insurance, mileage, assigned driver..." value={vanForm.notes} onChange={e => setVanForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewVan(false)}>Cancel</Button>
              <Button className="flex-1" disabled={!vanForm.name || addVanMutation.isPending} onClick={() => addVanMutation.mutate()}>
                {addVanMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Van"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
