import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowDownCircle, ArrowUpCircle, Hammer } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectType: (type: "income" | "expense" | "payroll") => void;
}

export function PaymentActionSheet({ open, onOpenChange, onSelectType }: Props) {
  const handleSelect = (type: "income" | "expense" | "payroll") => {
    onOpenChange(false);
    onSelectType(type);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <Button
            variant="outline"
            className="w-full h-16 justify-start gap-4 text-left"
            onClick={() => handleSelect("income")}
          >
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <ArrowDownCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-semibold">Record Income</p>
              <p className="text-xs text-muted-foreground">Payment received from client</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full h-16 justify-start gap-4 text-left"
            onClick={() => handleSelect("payroll")}
          >
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Hammer className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold">Record Payroll</p>
              <p className="text-xs text-muted-foreground">Crew wages, daily rates, sub payments</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="w-full h-16 justify-start gap-4 text-left"
            onClick={() => handleSelect("expense")}
          >
            <div className="p-2 rounded-lg bg-muted">
              <ArrowUpCircle className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="font-semibold">Record Expense</p>
              <p className="text-xs text-muted-foreground">Material, supplies, or other cost</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
