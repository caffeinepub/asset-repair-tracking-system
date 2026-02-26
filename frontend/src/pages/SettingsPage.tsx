import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../contexts/AuthContext';
import { ManagedUserRole, ManagedUserPublic } from '../backend';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from '../hooks/useActor';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { Pencil, Trash2, UserPlus, Shield, User, AlertCircle, Loader2 } from 'lucide-react';
import CreateUserDialog from '../components/CreateUserDialog';
import EditUserDialog from '../components/EditUserDialog';
import { toast } from 'sonner';

// Client management imports
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  // Redirect non-admins
  React.useEffect(() => {
    if (!isAdmin) {
      navigate({ to: '/' });
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <span>Access denied. Admins only.</span>
        </div>
      </div>
    );
  }

  return <SettingsContent currentUserId={user?.id ?? -1} actor={actor} actorFetching={actorFetching} queryClient={queryClient} />;
}

interface SettingsContentProps {
  currentUserId: number;
  actor: any;
  actorFetching: boolean;
  queryClient: any;
}

function SettingsContent({ currentUserId, actor, actorFetching, queryClient }: SettingsContentProps) {
  // ── User Management State ──────────────────────────────────────────────────
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ManagedUserPublic | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<bigint | null>(null);

  // ── Client Management State ────────────────────────────────────────────────
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [editClientOpen, setEditClientOpen] = useState(false);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientError, setClientError] = useState('');

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: users = [], isLoading: usersLoading } = useQuery<ManagedUserPublic[]>({
    queryKey: ['managedUsers'],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getUsers();
      return result.map((u: any) => ({
        id: u.id,
        username: u.username,
        role: u.role.__kind__ === 'Admin' ? ManagedUserRole.Admin : ManagedUserRole.User,
      }));
    },
    enabled: !!actor && !actorFetching,
  });

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listClients();
    },
    enabled: !!actor && !actorFetching,
  });

  // ── User Mutations ─────────────────────────────────────────────────────────
  const createUserMutation = useMutation({
    mutationFn: async ({ username, password, role }: { username: string; password: string; role: ManagedUserRole }) => {
      if (!actor) throw new Error('Actor not available');
      const backendRole = role === ManagedUserRole.Admin ? { Admin: null } : { User: null };
      await actor.createUser(username, password, backendRole);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['managedUsers'] }),
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, username, password, role }: { id: bigint; username: string; password: string; role: ManagedUserRole }) => {
      if (!actor) throw new Error('Actor not available');
      const backendRole = role === ManagedUserRole.Admin ? { Admin: null } : { User: null };
      await actor.updateUser(id, username, password, backendRole);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['managedUsers'] }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteUser(id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['managedUsers'] }),
  });

  // ── Client Mutations ───────────────────────────────────────────────────────
  const addClientMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.addClient(name);
      if (result.__kind__ === 'err') throw new Error(result.err?.nameTaken || result.err?.emptyName !== undefined ? 'Name is empty or already taken' : 'Failed to add client');
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const renameClientMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.renameClient(id, name);
      if (result.__kind__ === 'err') throw new Error('Failed to rename client');
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.deleteClient(id);
      if (result.__kind__ === 'err') throw new Error('Failed to delete client');
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCreateUser = async (username: string, password: string, role: ManagedUserRole) => {
    await createUserMutation.mutateAsync({ username, password, role });
  };

  const handleUpdateUser = async (id: bigint, username: string, password: string, role: ManagedUserRole) => {
    await updateUserMutation.mutateAsync({ id, username, password, role });
  };

  const handleDeleteUser = async () => {
    if (deleteUserId === null) return;
    try {
      await deleteUserMutation.mutateAsync(deleteUserId);
      toast.success('User deleted successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user.');
    } finally {
      setDeleteUserId(null);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) { setClientError('Client name is required.'); return; }
    setClientError('');
    try {
      await addClientMutation.mutateAsync(clientName.trim());
      toast.success('Client added successfully.');
      setClientName('');
      setAddClientOpen(false);
    } catch (err: any) {
      setClientError(err.message || 'Failed to add client.');
    }
  };

  const handleRenameClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !clientName.trim()) { setClientError('Client name is required.'); return; }
    setClientError('');
    try {
      await renameClientMutation.mutateAsync({ id: selectedClient.id, name: clientName.trim() });
      toast.success('Client renamed successfully.');
      setClientName('');
      setEditClientOpen(false);
      setSelectedClient(null);
    } catch (err: any) {
      setClientError(err.message || 'Failed to rename client.');
    }
  };

  const handleDeleteClient = async () => {
    if (!deleteClientId) return;
    try {
      await deleteClientMutation.mutateAsync(deleteClientId);
      toast.success('Client deleted successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete client.');
    } finally {
      setDeleteClientId(null);
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage users and system configuration</p>
      </div>

      {/* ── User Management ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              User Management
            </CardTitle>
            <CardDescription>Create and manage user accounts and roles</CardDescription>
          </div>
          <Button size="sm" onClick={() => setCreateUserOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No users found.</p>
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
                {users.map((u) => {
                  const isSelf = Number(u.id) === currentUserId;
                  return (
                    <TableRow key={String(u.id)}>
                      <TableCell className="font-medium flex items-center gap-2">
                        {u.role === ManagedUserRole.Admin ? (
                          <Shield className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <User className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                        {u.username}
                        {isSelf && (
                          <Badge variant="outline" className="text-xs ml-1">You</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === ManagedUserRole.Admin ? 'default' : 'secondary'}>
                          {u.role === ManagedUserRole.Admin ? 'Admin' : 'User'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => {
                              setSelectedUser(u);
                              setEditUserOpen(true);
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteUserId(u.id)}
                            disabled={isSelf}
                            title={isSelf ? "Cannot delete your own account" : "Delete user"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Client Registry ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Client Registry</CardTitle>
            <CardDescription>Manage client organizations</CardDescription>
          </div>
          <Button size="sm" onClick={() => { setClientName(''); setClientError(''); setAddClientOpen(true); }}>
            Add Client
          </Button>
        </CardHeader>
        <CardContent>
          {clientsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : clients.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No clients found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => {
                            setSelectedClient(c);
                            setClientName(c.name);
                            setClientError('');
                            setEditClientOpen(true);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteClientId(c.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <CreateUserDialog
        open={createUserOpen}
        onOpenChange={setCreateUserOpen}
        onCreateUser={handleCreateUser}
      />

      <EditUserDialog
        open={editUserOpen}
        onOpenChange={setEditUserOpen}
        user={selectedUser}
        onUpdateUser={handleUpdateUser}
      />

      {/* Delete User Confirmation */}
      <AlertDialog open={deleteUserId !== null} onOpenChange={(open) => !open && setDeleteUserId(null)}>
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Client Dialog */}
      <Dialog open={addClientOpen} onOpenChange={(open) => { if (!open) { setClientName(''); setClientError(''); } setAddClientOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
            <DialogDescription>Add a new client organization to the registry.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddClient} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="client-name">Client Name</Label>
              <Input
                id="client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
              />
              {clientError && <p className="text-destructive text-xs">{clientError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddClientOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addClientMutation.isPending}>
                {addClientMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : 'Add Client'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={editClientOpen} onOpenChange={(open) => { if (!open) { setClientName(''); setClientError(''); setSelectedClient(null); } setEditClientOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Client</DialogTitle>
            <DialogDescription>Update the client organization name.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameClient} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-client-name">Client Name</Label>
              <Input
                id="edit-client-name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter new name"
              />
              {clientError && <p className="text-destructive text-xs">{clientError}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditClientOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={renameClientMutation.isPending}>
                {renameClientMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Client Confirmation */}
      <AlertDialog open={deleteClientId !== null} onOpenChange={(open) => !open && setDeleteClientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this client? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
