import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Trash2,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { useToast } from '@/components/shared/Toast';
import { formatDateTime } from '@/utils/formatters';
import { AppNotification } from '@/types';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsRead,
  clearAllNotifications,
} from '@/api/notifications';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err: any) {
      toast({ title: 'Error loading notifications', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markNotificationAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast({ title: 'All Read', description: 'All notifications marked as read.', variant: 'success' });
  };

  const handleClearAll = async () => {
    await clearAllNotifications();
    setNotifications([]);
    toast({ title: 'Cleared', description: 'Notification tray cleared.', variant: 'info' });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Enterprise System Alerts & Notifications"
        description="Real-time webhooks, invoice overdue warnings, low-inventory thresholds, and approval requests"
        actions={
          <>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="h-9 gap-1.5 text-xs">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                <span>Mark All Read</span>
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All</span>
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const icons = {
              overdue: <Clock className="h-5 w-5 text-rose-500" />,
              low_stock: <AlertTriangle className="h-5 w-5 text-amber-500" />,
              approval: <CheckCircle className="h-5 w-5 text-pink-600 dark:text-pink-400" />,
              auth: <ShieldAlert className="h-5 w-5 text-rose-600" />,
              info: <Info className="h-5 w-5 text-primary" />,
            };

            return (
              <Card
                key={notif.id}
                className={`transition-all hover:shadow-sm ${
                  !notif.read ? 'border-primary/40 bg-primary/5' : 'bg-card'
                }`}
              >
                <CardContent className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-muted shrink-0 mt-0.5">
                      {icons[notif.type] || <Bell className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{notif.title}</span>
                        {!notif.read && (
                          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {formatDateTime(notif.timestamp)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {notif.actionUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1"
                        onClick={() => {
                          handleMarkAsRead(notif.id);
                          navigate(notif.actionUrl!);
                        }}
                      >
                        Action <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                    {!notif.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        Mark Read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="p-12 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto opacity-30 mb-2" />
            <h3 className="font-semibold text-base text-foreground">All Caught Up!</h3>
            <p className="text-xs mt-1">No active notifications or pending approvals.</p>
          </Card>
        )}
      </div>
    </div>
  );
};
