import React, { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users, Building2, Shield, ShieldOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CreateUserDialog from '../components/CreateUserDialog';
import EditUserDialog from '../components/EditUserDialog';
import {
  useGetManagedUsers,
  useDeleteUser,
  useGetClients,
  useAddClient,
  useRenameClient,
  useDeleteClient,
  useGetCallerRole,
} from '../hooks/useQueries';
import { useAuth } from '../contexts/AuthContext';
import { ManagedUserPublic, ManagedUserRole, UserRole } from '../backend';
import ClientRegistrySection from '../components/ClientRegistrySection';

export default function SettingsPage() {
  const { user } = useAuth();
  const { data: callerRole, isLoading: roleLoading } = useGetCallerRole();
  const isPrincipalAdmin = callerRole === UserRole.admin;

  const { data: managedUsers = [], isLoading: usersLoading, error: usersError } = useGetManagedUsers();
  const deleteUserMutation = useDeleteUser();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUserPublic | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<bigint | null>(null);

  const currentUserId = user?.id ? String(user.id) : '';

  const handleDeleteUser = async () => {
    if (deletingUserId === null) return;
    try {
      await deleteUserMutation.mutateAsync(deletingUserId);
      toast.success('User deleted successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isPrincipalAdmin) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only administrators can access the Settings page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage users and system configuration</p>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          {usersError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {(usersError as Error)?.message || 'Failed to load users. Make sure you are signed in as admin.'}
              </AlertDescription>
            </Alert>
          )}

          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  managedUsers.map((u) => {
                    const isCurrentUser = String(u.id) === currentUserId;
                    const isDefaultAdmin = u.id === BigInt(0);
                    return (
                      <TableRow key={String(u.id)}>
                        <TableCell className="font-medium">
                          {u.username}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={u.role === ManagedUserRole.Admin ? 'default' : 'secondary'}
                            className="flex items-center gap-1 w-fit"
                          >
                            {u.role === ManagedUserRole.Admin && <Shield className="h-3 w-3" />}
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingUser(u)}
                              className="h-8 w-8"
                              title="Edit user"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {!isDefaultAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeletingUserId(u.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Client Registry */}
      <ClientRegistrySection />

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateUserDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      )}

      {editingUser && (
        <EditUserDialog
          open={!!editingUser}
          onOpenChange={(open) => { if (!open) setEditingUser(null); }}
          user={editingUser}
        />
      )}

      <AlertDialog open={deletingUserId !== null} onOpenChange={(open) => { if (!open) setDeletingUserId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
