import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Activity } from 'lucide-react';
import { useAdminQueueMonitor, type AdminJob } from '@/hooks/useAdminQueueMonitor';
import { AdminQueueStatsCards } from '@/components/admin/queue/AdminQueueStats';
import { AdminUserJobsCard } from '@/components/admin/queue/AdminUserJobsCard';
import { AdminJobsTable } from '@/components/admin/queue/AdminJobsTable';
import { AdminJobDetailsModal } from '@/components/admin/queue/AdminJobDetailsModal';
import { AdminJobsTimeline } from '@/components/admin/queue/AdminJobsTimeline';
import { AdminQueueAlerts } from '@/components/admin/queue/AdminQueueAlerts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminQueueMonitor() {
  const {
    stats,
    recentJobs,
    userActiveJobs,
    isLoading,
    lastUpdate,
    refreshData,
    cancelJob,
    retryJob
  } = useAdminQueueMonitor();

  const [selectedJob, setSelectedJob] = useState<AdminJob | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Monitor de Jobs
            <Badge variant="outline" className="ml-2">ADMIN</Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento em tempo real de todos os jobs do sistema
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground">
            Última atualização: {format(lastUpdate, "HH:mm:ss", { locale: ptBR })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Alerts */}
      <AdminQueueAlerts stats={stats} jobs={recentJobs} isLoading={isLoading} />

      {/* Stats Cards */}
      <AdminQueueStatsCards stats={stats} isLoading={isLoading} />

      {/* Timeline Chart */}
      <AdminJobsTimeline jobs={recentJobs} isLoading={isLoading} />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Active Jobs - Takes 1/3 */}
        <div className="lg:col-span-1">
          <AdminUserJobsCard
            userActiveJobs={userActiveJobs}
            onCancelJob={cancelJob}
            isLoading={isLoading}
          />
        </div>

        {/* Jobs Table - Takes 2/3 */}
        <div className="lg:col-span-2">
          <AdminJobsTable
            jobs={recentJobs}
            onCancelJob={cancelJob}
            onRetryJob={retryJob}
            onViewJob={setSelectedJob}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Job Details Modal */}
      <AdminJobDetailsModal
        job={selectedJob}
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
}
