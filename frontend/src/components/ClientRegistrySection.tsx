import React, { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { useGetClients, useAddClient, useRenameClient, useDeleteClient } from '../hooks/useQueries';
import { Client } from '../backend';

export default function ClientRegistrySection() {
  const { data: clients = [], isLoading, error } = useGetClients();
  const addClientMutation = useAddClient();
  const renameClientMutation = useRenameClient();
  const deleteClientMutation = useDeleteClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  const handleAddClient = async () => {
    if (!newClientName.trim()) {
      toast.error('Client name cannot be empty');
      return;
    }
    try {
      const result = await addClientMutation.mutateAsync(newClientName.trim());
      if (result.__kind__ === 'ok') {
        toast.success('Client added successfully');
        setNewClientName('');
        setShowAddDialog(false);
      } else {
        const err = result.err;
        if (err.__kind__ === 'nameTaken') {
          toast.error(`Client name "${err.nameTaken}" is already taken`);
        } else if (err.__kind__ === 'emptyName') {
          toast.error('Client name cannot be empty');
        } else if (err.__kind__ === 'invalidName') {
          toast.error(`Invalid name: ${err.invalidName}`);
        } else {
          toast.error('Failed to add client');
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add client');
    }
  };

  const handleRenameClient = async () => {
    if (!editingClient || !editName.trim()) {
      toast.error('Client name cannot be empty');
      return;
    }
    try {
      const result = await renameClientMutation.mutateAsync({
        clientId: editingClient.id,
        newName: editName.trim(),
      });
      if (result.__kind__ === 'ok') {
        toast.success('Client renamed successfully');
        setEditingClient(null);
        setEditName('');
      } else {
        const err = result.err;
        if (err.__kind__ === 'nameTaken') {
          toast.error(`Name "${err.nameTaken}" is already taken`);
        } else if (err.__kind__ === 'emptyName') {
          toast.error('Client name cannot be empty');
        } else if (err.__kind__ === 'invalidName') {
          toast.error(`Invalid name: ${err.invalidName}`);
        } else {
          toast.error('Failed to rename client');
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to rename client');
    }
  };

  const handleDeleteClient = async () => {
    if (!deletingClientId) return;
    try {
      const result = await deleteClientMutation.mutateAsync(deletingClientId);
      if (result.__kind__ === 'ok') {
        toast.success('Client deleted successfully');
      } else {
        toast.error('Failed to delete client');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete client');
    } finally {
      setDeletingClientId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Client Registry
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {(error as Error)?.message || 'Failed to load clients'}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No clients registered
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{client.id}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingClient(client);
                              setEditName(client.name);
                            }}
                            className="h-8 w-8"
                            title="Rename client"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingClientId(client.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete client"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Client Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input
                id="clientName"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Enter client name"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddClient(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setNewClientName(''); }}>
              Cancel
            </Button>
            <Button onClick={handleAddClient} disabled={addClientMutation.isPending}>
              {addClientMutation.isPending ? 'Adding...' : 'Add Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={(open) => { if (!open) { setEditingClient(null); setEditName(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="editClientName">New Name</Label>
              <Input
                id="editClientName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter new client name"
                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameClient(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingClient(null); setEditName(''); }}>
              Cancel
            </Button>
            <Button onClick={handleRenameClient} disabled={renameClientMutation.isPending}>
              {renameClientMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Client Confirmation */}
      <AlertDialog open={!!deletingClientId} onOpenChange={(open) => { if (!open) setDeletingClientId(null); }}>
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
              {deleteClientMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
