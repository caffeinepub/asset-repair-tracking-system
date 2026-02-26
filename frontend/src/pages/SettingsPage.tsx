import { useState } from 'react';
import {
  useListUsers,
  useAddUser,
  useUpdateUserRole,
  useGetClients,
  useAddClient,
  useRenameClient,
  useDeleteClient,
  useGetCallerUserProfile,
} from '../hooks/useQueries';
import { AppUser, AppUserRole, Client } from '../backend';
import { Plus, Edit, Trash2, Loader2, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function SettingsPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: users = [], isLoading: usersLoading } = useListUsers();
  const { data: clients = [], isLoading: clientsLoading } = useGetClients();
  const addUser = useAddUser();
  const updateRole = useUpdateUserRole();
  const addClient = useAddClient();
  const renameClient = useRenameClient();
  const deleteClient = useDeleteClient();

  const isAdmin = userProfile?.appRole === AppUserRole.admin;

  // User management state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppUserRole>(AppUserRole.technician);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editRole, setEditRole] = useState<AppUserRole>(AppUserRole.technician);

  // Client management state
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-muted-foreground">You don't have permission to access Settings.</p>
          <p className="text-sm text-muted-foreground mt-1">Admin access required.</p>
        </div>
      </div>
    );
  }

  const handleAddUser = async () => {
    if (!newUserName.trim()) return;
    await addUser.mutateAsync({
      userId: `user_${Date.now()}`,
      name: newUserName.trim(),
      role: newUserRole,
    });
    setNewUserName('');
    setShowAddUser(false);
  };

  const handleUpdateRole = async () => {
    if (!editingUser) return;
    await updateRole.mutateAsync({ userId: editingUser.userId, role: editRole });
    setEditingUser(null);
  };

  const handleAddClient = async () => {
    if (!newClientName.trim()) return;
    await addClient.mutateAsync(newClientName.trim());
    setNewClientName('');
    setShowAddClient(false);
  };

  const handleRenameClient = async () => {
    if (!editingClient || !editClientName.trim()) return;
    await renameClient.mutateAsync({ clientId: editingClient.id, newName: editClientName.trim() });
    setEditingClient(null);
    setEditClientName('');
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (!confirm(`Delete client "${clientName}"? This cannot be undone.`)) return;
    setDeletingClientId(clientId);
    try {
      await deleteClient.mutateAsync(clientId);
    } finally {
      setDeletingClientId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage users, roles, and system configuration</p>
      </div>

      {/* User Management */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">User Management</h3>
          </div>
          <Button size="sm" onClick={() => setShowAddUser(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add User
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">User ID</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usersLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(4)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground text-sm">
                    No users added yet
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.userId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-foreground font-medium">{user.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{user.userId}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/15 text-primary border border-primary/30 capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingUser(user);
                            setEditRole(user.role);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Registry */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Client Registry</h3>
          </div>
          <Button size="sm" onClick={() => setShowAddClient(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Client
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Client Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">ID</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clientsLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(4)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground text-sm">
                    No clients registered yet
                  </td>
                </tr>
              ) : (
                clients.map(client => (
                  <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 text-foreground font-medium">{client.name}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{client.id}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {new Date(Number(client.createTime) / 1_000_000).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setEditingClient(client);
                            setEditClientName(client.name);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteClient(client.id, client.name)}
                          disabled={deletingClientId === client.id}
                        >
                          {deletingClientId === client.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
              <Input
                value={newUserName}
                onChange={e => setNewUserName(e.target.value)}
                placeholder="Enter user name"
                className="bg-background border-input text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
              <select
                value={newUserRole}
                onChange={e => setNewUserRole(e.target.value as AppUserRole)}
                className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value={AppUserRole.technician}>Technician</option>
                <option value={AppUserRole.supervisor}>Supervisor</option>
                <option value={AppUserRole.admin}>Admin</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button onClick={handleAddUser} disabled={addUser.isPending || !newUserName.trim()}>
              {addUser.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Role Dialog */}
      <Dialog open={!!editingUser} onOpenChange={open => !open && setEditingUser(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Role — {editingUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
            <select
              value={editRole}
              onChange={e => setEditRole(e.target.value as AppUserRole)}
              className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value={AppUserRole.technician}>Technician</option>
              <option value={AppUserRole.supervisor}>Supervisor</option>
              <option value={AppUserRole.admin}>Admin</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button onClick={handleUpdateRole} disabled={updateRole.isPending}>
              {updateRole.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Add Client</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Client Name</label>
            <Input
              value={newClientName}
              onChange={e => setNewClientName(e.target.value)}
              placeholder="Enter client name"
              className="bg-background border-input text-foreground"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddClient(false)}>Cancel</Button>
            <Button onClick={handleAddClient} disabled={addClient.isPending || !newClientName.trim()}>
              {addClient.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Add Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={open => !open && setEditingClient(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Rename Client</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">New Name</label>
            <Input
              value={editClientName}
              onChange={e => setEditClientName(e.target.value)}
              placeholder="Enter new client name"
              className="bg-background border-input text-foreground"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClient(null)}>Cancel</Button>
            <Button onClick={handleRenameClient} disabled={renameClient.isPending || !editClientName.trim()}>
              {renameClient.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
