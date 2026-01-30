
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';

export const SessionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [sessionActive, setSessionActive] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSessionActive(!!data.session);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSessionActive(!!session);
      }
    );

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  if (!sessionActive) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant={isOnline ? "default" : "destructive"}>
        {isOnline ? "Online" : "Offline"}
      </Badge>
      <Badge variant="secondary">
        Sessão Ativa
      </Badge>
    </div>
  );
};
