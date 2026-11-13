import React, { useState, useEffect } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Lock,
  KeyRound,
  CheckCircle,
  XCircle,
  Download,
  MoreHorizontal,
  Activity,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { UserAvatar } from '@/components/shared/UserAvatar';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { FormField } from '@/components/shared/FormField';
import { useToast } from '@/components/shared/Toast';
import { formatDateTime, formatDate } from '@/utils/formatters';
import { User, LoginLog, UserRole } from '@/types';
import { fetchUsers, createUser, updateUserRole, fetchLoginLogs } from '@/api/admin';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Add Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('accountant');
  const [phone, setPhone] = useState('+91 ');

  // Edit Role Form
  const [editRole, setEditRole] = useState<UserRole>('accountant');
  const [editStatus, setEditStatus] = useState<User['status']>('active');

  const { toast } = useToast();

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [uList, lList] = await Promise.all([fetchUsers(), fetchLoginLogs()]);
      setUsers(uList);
      setLogs(lList);
    } catch (err: any) {
      toast({ title: 'Error loading users', description: err.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUser = await createUser({
        name,
        email,
        role,
        phone,
        status: 'active',
        lastLogin: new Date().toISOString(),
      });
      setUsers([...users, newUser]);
      setAddModalOpen(false);
      toast({ title: 'User Enrolled', description: `${newUser.name} assigned ${newUser.role} role.`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Failed to create user', description: err.message, variant: 'destructive' });
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const updated = await updateUserRole(selectedUser.id, editRole, editStatus);
      setUsers(users.map((u) => (u.id === updated.id ? updated : u)));
      setRoleModalOpen(false);
      toast({ title: 'Role & Status Updated', description: `${updated.name} updated.`, variant: 'success' });
    } catch (err: any) {
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleResetPassword = (user: User) => {
    toast({
      title: 'Temporary Password Issued',
      description: `Password reset instructions sent to ${user.email}.`,
      variant: 'info',
    });
  };

  const userColumns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'User Name',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-2.5">
            <UserAvatar user={u} size="sm" />
            <div>
              <div className="font-semibold text-foreground">{u.name}</div>
              <div className="text-xs text-muted-foreground">{u.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'role',
      header: 'Role Access',
      cell: ({ row }) => <StatusBadge status={row.original.role} />,
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.phone || '-'}</span>,
    },
    {
      accessorKey: 'lastLogin',
      header: 'Last Active Session',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDateTime(row.original.lastLogin)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Account Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const u = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Manage User</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedUser(u);
                  setEditRole(u.role);
                  setEditStatus(u.status);
                  setRoleModalOpen(true);
                }}
                className="cursor-pointer text-xs"
              >
                <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Change Role & Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleResetPassword(u)} className="cursor-pointer text-xs">
                <KeyRound className="mr-2 h-3.5 w-3.5 text-amber-500" /> Send Password Reset
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setUsers(users.filter((item) => item.id !== u.id));
                  toast({ title: 'User Removed', description: `${u.name} revoked.`, variant: 'success' });
                }}
                className="cursor-pointer text-xs text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const logColumns: ColumnDef<LoginLog>[] = [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: ({ row }) => formatDateTime(row.original.timestamp),
    },
    {
      accessorKey: 'email',
      header: 'Email / Username',
      cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.email}</span>,
    },
    {
      accessorKey: 'ip',
      header: 'IP Address',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.ip}</span>,
    },
    {
      accessorKey: 'userAgent',
      header: 'Browser / Device',
      cell: ({ row }) => <span className="text-xs text-muted-foreground truncate">{row.original.userAgent || '-'}</span>,
    },
    {
      accessorKey: 'success',
      header: 'Result',
      cell: ({ row }) => {
        const ok = row.original.success;
        return (
          <span
            className={`text-xs px-2 py-0.5 rounded font-semibold ${
              ok
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
            }`}
          >
            {ok ? 'Success' : `Failed (${row.original.reason || 'Auth'})`}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Role-Based Access Control"
        description="Administer ERP users, define permissions across admin, accountant, and sales roles, and monitor authentication audit logs"
        actions={
          <Button size="sm" onClick={() => setAddModalOpen(true)} className="h-9 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span>Add User</span>
          </Button>
        }
      />

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-card border p-1 rounded-xl">
          <TabsTrigger value="users" className="text-xs">Active Users ({users.length})</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">Security & Login Audit Log ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <DataTable
            columns={userColumns}
            data={users}
            searchPlaceholder="Search user by name or email..."
            exportFileName="fmcg-users-master"
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <DataTable
            columns={logColumns}
            data={logs}
            searchPlaceholder="Search audit log by email or IP..."
            exportFileName="fmcg-login-audit-log"
          />
        </TabsContent>
      </Tabs>

      {/* Add User Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Plus className="h-5 w-5" /> Enroll Enterprise User
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
            <FormField label="Full Name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kulkarni"
                className="h-9 text-xs"
                required
              />
            </FormField>

            <FormField label="Work Email Address" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@rystafmcg.com"
                className="h-9 text-xs"
                required
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Assigned Role" required>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="admin">Administrator</option>
                  <option value="accountant">Accountant</option>
                  <option value="sales">Sales Officer</option>
                </select>
              </FormField>

              <FormField label="Mobile Phone">
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98200 00000"
                  className="h-9 text-xs"
                />
              </FormField>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Enroll User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Role Modal */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5" /> Update Role: {selectedUser?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRoleSubmit} className="space-y-4 py-2">
            <FormField label="Access Role" required>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="admin">Administrator (Full Access)</option>
                <option value="accountant">Accountant (Ledgers, Taxes, Invoices, Stock)</option>
                <option value="sales">Sales Officer (Orders, Catalog, Receipts)</option>
              </select>
            </FormField>

            <FormField label="Account State" required>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                <option value="active">Active (Access Granted)</option>
                <option value="inactive">Suspended (Access Revoked)</option>
              </select>
            </FormField>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRoleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
