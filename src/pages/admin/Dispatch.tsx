import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, MapPin } from "lucide-react";
import { DispatchView } from "@/components/admin/schedule/DispatchView";
import { MapView } from "@/components/admin/schedule/MapView";

export default function Dispatch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get("tab") === "map" ? "map" : "dispatch") as "dispatch" | "map";
  const setTab = (v: "dispatch" | "map") => {
    const next = new URLSearchParams(searchParams);
    if (v === "map") next.set("tab", "map");
    else next.delete("tab");
    setSearchParams(next, { replace: true });
  };
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <AdminLayout title="Dispatch">
      <div className="flex flex-col h-full">
        <div className="px-4 pt-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "dispatch" | "map")}>
            <TabsList className="bg-transparent border-b border-border rounded-none p-0 h-auto w-auto">
              <TabsTrigger
                value="dispatch"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <Truck className="w-4 h-4 mr-1.5" />
                Dispatch
              </TabsTrigger>
              <TabsTrigger
                value="map"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 pt-1"
              >
                <MapPin className="w-4 h-4 mr-1.5" />
                Map
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 overflow-auto">
          {tab === "dispatch" ? (
            <DispatchView date={currentDate} onChangeDate={setCurrentDate} />
          ) : (
            <div className="p-3"><MapView date={currentDate} /></div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
