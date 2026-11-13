import React, { useState } from 'react';
import {
  User as UserIcon,
  Lock,
  Sun,
  Moon,
  Laptop,
  Save,
  CheckCircle,
  KeyRound,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/shared/FormField';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { useToast } from '@/components/shared/Toast';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+91 98201 12345');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, phone });
    toast({
      title: 'Profile Saved',
      description: 'Your user profile details have been updated.',
      variant: 'success',
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: 'Invalid Password',
        description: 'New password must be at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords Mismatch',
        description: 'New password and confirm password must match.',
        variant: 'destructive',
      });
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast({
      title: 'Password Updated',
      description: 'Your security credentials have been successfully updated.',
      variant: 'success',
    });
  };

  const displayName = user?.business_name || user?.name || (user?.email ? user.email.split('@')[0] : 'Business User');
  const displayRole = user?.role ? String(user.role).toUpperCase() : 'USER';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Personal Profile & Account Security"
        description="Manage your identity credentials, password security, and interface appearance"
        badge={
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase border border-primary/20 inline-block">
            {displayRole}
          </span>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Card */}
        <Card className="md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <UserAvatar user={user} size="2xl" className="shadow-lg shadow-primary/25 ring-4 ring-primary/20" />
            <div>
              <h3 className="font-bold text-lg text-foreground">{displayName}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
            </div>
            <div className="pt-0.5">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary uppercase border border-primary/20 inline-block">
                {displayRole}
              </span>
            </div>

            <div className="w-full pt-4 border-t text-left text-xs space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>Account Status:</span>
                <span className="font-semibold text-emerald-600 capitalize">{user?.status || 'Active'}</span>
              </div>
              <div className="flex justify-between">
                <span>Session Duration:</span>
                <span className="font-semibold text-foreground">8 Hours (JWT)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details & Password */}
        <div className="space-y-6 md:col-span-2">
          {/* Personal Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">User Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                <FormField label="Full Name" required>
                  <Input value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-xs" />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Email (Corporate Identifier)">
                    <Input value={email} disabled className="h-9 text-xs bg-muted/40 font-mono" />
                  </FormField>

                  <FormField label="Phone Number">
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 text-xs" />
                  </FormField>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" className="gap-1.5 text-xs">
                    <Save className="h-3.5 w-3.5" /> Save Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Change Security Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <FormField label="Current Password" required>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-9 text-xs"
                    required
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-3">
                  <FormField label="New Password" required>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </FormField>

                  <FormField label="Confirm New Password" required>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-9 text-xs"
                      required
                    />
                  </FormField>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" size="sm" variant="secondary" className="gap-1.5 text-xs">
                    <KeyRound className="h-3.5 w-3.5" /> Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Theme Preference */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Appearance & Theme Preference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                    theme === 'light' ? 'border-primary bg-primary/10 text-primary' : 'bg-muted/40 hover:bg-muted'
                  }`}
                >
                  <Sun className="h-4 w-4" /> Light Mode
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-xs font-semibold transition-all ${
                    theme === 'dark' ? 'border-primary bg-primary/10 text-primary' : 'bg-muted/40 hover:bg-muted'
                  }`}
                >
                  <Moon className="h-4 w-4" /> Dark Mode
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
