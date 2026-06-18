import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Props = {
  floorName: string;
};

export default function RequestEstimateCta({ floorName }: Props) {
  const navigate = useNavigate();
  return (
    <Button
      size="lg"
      className="w-full"
      onClick={() => {
        toast.success("Great choice!", {
          description: `We'll help you bring ${floorName} into your home. Let's get in touch.`,
        });
        // No public estimate route yet — send to landing page contact area.
        setTimeout(() => navigate("/"), 600);
      }}
    >
      Request estimate with this preview
      <ArrowRight className="h-4 w-4 ml-2" />
    </Button>
  );
}
