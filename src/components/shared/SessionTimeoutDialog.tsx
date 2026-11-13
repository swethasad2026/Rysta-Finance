import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { useToast } from './Toast';

export const SessionTimeoutDialog: React.FC = () => {
  const {
    isAuthenticated,
    showSessionWarning,
    extendSession,
    logout,
    checkTokenExpiration,
    expiresAt,
  } = useAuthStore();
  const { toast } = useToast();

  // Periodically check token expiration every 60 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      checkTokenExpiration();
    }, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, checkTokenExpiration]);

  const handleExtend = () => {
    extendSession();
    toast({
      title: 'Session Extended',
      description: 'Your authentication session has been refreshed for another 8 hours.',
      variant: 'success',
    });
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  if (!isAuthenticated || !showSessionWarning) return null;

  const minutesRemaining = expiresAt ? Math.max(1, Math.round((expiresAt - Date.now()) / 60000)) : 15;

  return (
    <Dialog open={showSessionWarning} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg">Session Expiring Soon</DialogTitle>
              <DialogDescription className="mt-1 text-sm">
                Your session will expire in approximately{' '}
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {minutesRemaining} minutes
                </span>
                . Would you like to extend your session?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-4 flex gap-2">
          <Button variant="outline" onClick={handleLogout} className="gap-1.5">
            <LogOut className="h-4 w-4" />
            Log Out Now
          </Button>
          <Button onClick={handleExtend} className="gap-1.5">
            <RefreshCw className="h-4 w-4" />
            Extend Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
