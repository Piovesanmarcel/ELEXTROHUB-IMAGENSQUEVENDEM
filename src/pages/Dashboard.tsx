import { useUserRole } from "@/hooks/useUserRole";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { UserDashboard } from "@/components/dashboard/UserDashboard";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { isAdmin, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return isAdmin ? <AdminDashboard /> : <UserDashboard />;
};

export default Dashboard;
