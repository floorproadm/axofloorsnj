import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CollaboratorProfile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const initials = user?.email?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-heading font-bold text-foreground">Perfil</h1>

      <Card>
        <CardContent className="p-6 flex flex-col items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="text-center space-y-1">
            <p className="font-semibold text-foreground">
              {user?.user_metadata?.full_name || "Colaborador"}
            </p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full gap-2 text-destructive hover:text-destructive"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4" />
        Sair da Conta
      </Button>
    </div>
  );
}
