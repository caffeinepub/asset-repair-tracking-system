import React, { useState } from 'react';
import { Plus, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useListUsers,
  useAddUser,
  useUpdateUserRole,
  useGetClients,
  useAddClient,
  useRenameClient,
  useDeleteClient,
} from '@/hooks/useQueries';
import { AppUser, AppUserRole, Result } from '@/backend';

function AddUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addUser = useAddUser();
  const [form, setForm] = useState({ userId: '', name: '', role: AppUserRole.technician });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addUser.mutateAsync(form);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Add User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-foreground">User ID</Label>
            <Input
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              required
              className="bg-background text-foreground border-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground">Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="bg-background text-foreground border-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground">Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm({ ...form, role: v as AppUserRole })}
            >
              <SelectTrigger className="bg-background text-foreground border-input">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                <SelectItem value={AppUserRole.technician}>Technician</SelectItem>
                <SelectItem value={AppUserRole.supervisor}>Supervisor</SelectItem>
                <SelectItem value={AppUserRole.admin}>Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border text-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={addUser.isPending}>
              {addUser.isPending ? 'Adding...' : 'Add User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddClientDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addClient = useAddClient();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const result: Result = await addClient.mutateAsync(name);
    if (result.__kind__ !== 'ok') {
      setError('Failed to add client. Name may already be taken.');
      return;
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Add Client</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-foreground">Client Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-background text-foreground border-input"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border text-foreground">
              Cancel
            </Button>
            <Button type="submit" disabled={addClient.isPending}>
              {addClient.isPending ? 'Adding...' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsPage() {
  const [showAddUser, setShowAddUser] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);

  const { data: users, isLoading: usersLoading } = useListUsers();
  const { data: clients, isLoading: clientsLoading } = useGetClients();
  const updateRole = useUpdateUserRole();
  const deleteClient = useDeleteClient();
  const renameClient = useRenameClient();

  const [renamingClientId, setRenamingClientId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleRenameSubmit = async (clientId: string) => {
    if (!renameValue.trim()) return;
    await renameClient.mutateAsync({ clientId, newName: renameValue.trim() });
    setRenamingClientId(null);
    setRenameValue('');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage users, roles, and client registry</p>
      </div>

      {/* Users Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold text-card-foreground">User Management</CardTitle>
            </div>
            <Button size="sm" onClick={() => setShowAddUser(true)} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !users || users.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">No users configured.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">User ID</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Role</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: AppUser) => (
                  <TableRow key={user.userId} className="border-border hover:bg-muted/50">
                    <TableCell className="font-mono text-xs text-foreground">{user.userId}</TableCell>
                    <TableCell className="text-sm text-foreground">{user.name}</TableCell>
                    <TableCell>
                      <Select
                        value={String(user.role)}
                        onValueChange={(v) =>
                          updateRole.mutate({ userId: user.userId, role: v as AppUserRole })
                        }
                      >
                        <SelectTrigger className="w-32 h-7 text-xs bg-background text-foreground border-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground border-border">
                          <SelectItem value={AppUserRole.technician}>Technician</SelectItem>
                          <SelectItem value={AppUserRole.supervisor}>Supervisor</SelectItem>
                          <SelectItem value={AppUserRole.admin}>Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">—</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Clients Section */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-card-foreground">Client Registry</CardTitle>
            <Button size="sm" onClick={() => setShowAddClient(true)} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add Client
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {clientsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !clients || clients.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">No clients registered.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Client ID</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Created</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="border-border hover:bg-muted/50">
                    <TableCell className="font-mono text-xs text-foreground">{client.id}</TableCell>
                    <TableCell className="text-sm text-foreground">
                      {renamingClientId === client.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="h-7 text-xs w-40 bg-background text-foreground border-input"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleRenameSubmit(client.id)}
                            disabled={renameClient.isPending}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => { setRenamingClientId(null); setRenameValue(''); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        client.name
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(Number(client.createTime) / 1_000_000).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-foreground hover:bg-accent h-7"
                          onClick={() => {
                            setRenamingClientId(client.id);
                            setRenameValue(client.name);
                          }}
                        >
                          Rename
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
                          onClick={() => deleteClient.mutate(client.id)}
                          disabled={deleteClient.isPending}
                        >
                          Delete
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

      {showAddUser && <AddUserDialog open={showAddUser} onClose={() => setShowAddUser(false)} />}
      {showAddClient && <AddClientDialog open={showAddClient} onClose={() => setShowAddClient(false)} />}
    </div>
  );
}
