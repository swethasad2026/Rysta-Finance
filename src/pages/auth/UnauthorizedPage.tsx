import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 mb-6">
        <ShieldAlert className="h-10 w-10" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight">403 - Access Restricted</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        Your current role (<strong className="capitalize text-foreground">{user?.role || 'Guest'}</strong>) does not have permission to view or execute actions on this resource.
      </p>

      <div className="mt-6 flex gap-3">
        <Link to="/dashboard">
          <Button className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </Link>
        <Link to="/profile">
          <Button variant="outline" className="gap-2">
            View My Profile
          </Button>
        </Link>
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-6">
      <div className="text-7xl font-extrabold text-muted-foreground/30 mb-2">404</div>
      <h1 className="text-2xl font-bold tracking-tight">Page Not Found</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        The requested FMCG financial module, document, or route does not exist or may have been moved.
      </p>

      <div className="mt-6">
        <Link to="/dashboard">
          <Button className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
