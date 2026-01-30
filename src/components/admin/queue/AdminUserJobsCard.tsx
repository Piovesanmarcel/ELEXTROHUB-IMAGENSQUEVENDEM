import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, ChevronDown, ChevronUp, User, Clock, Loader2, AlertTriangle } from 'lucide-react';
import type { UserActiveJobs, AdminJob } from '@/hooks/useAdminQueueMonitor';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AdminUserJobsCardProps {
  userActiveJobs: UserActiveJobs[];
  onCancelJob: (jobId: string) => void;
  isLoading?: boolean;
}

export function AdminUserJobsCard({ userActiveJobs, onCancelJob, isLoading }: AdminUserJobsCardProps) {
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const toggleUser = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const totalActiveUsers = userActiveJobs.length;
  const usersAtLimit = userActiveJobs.filter(u => u.activeJobs >= u.maxJobs).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Jobs Ativos por Usuário
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">{totalActiveUsers} usuários</Badge>
            {usersAtLimit > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {usersAtLimit} no limite
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Carregando...
          </div>
        ) : userActiveJobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum job ativo no momento
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {userActiveJobs.map((user) => (
              <Collapsible
                key={user.userId}
                open={expandedUsers.has(user.userId)}
                onOpenChange={() => toggleUser(user.userId)}
              >
                <CollapsibleTrigger asChild>
                  <div
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      user.activeJobs >= user.maxJobs
                        ? 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30'
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.userId.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={user.activeJobs >= user.maxJobs ? 'destructive' : 'secondary'}
                        className="font-mono"
                      >
                        {user.activeJobs}/{user.maxJobs}
                      </Badge>
                      {expandedUsers.has(user.userId) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-12 pr-4 py-2">
                  <div className="space-y-2">
                    {user.jobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-2 rounded border bg-background/50"
                      >
                        <div className="flex items-center gap-2">
                          {job.status === 'processing' ? (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          )}
                          <div>
                            <p className="text-xs font-medium">{job.generation_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {job.created_at && formatDistanceToNow(new Date(job.created_at), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-7 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            onCancelJob(job.id);
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
