import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ManagedUserPublic, ManagedUserRole } from '../backend';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: ManagedUserPublic | null;
  onUpdateUser: (id: bigint, username: string, password: string, role: ManagedUserRole) => Promise<void>;
}

export default function EditUserDialog({ open, onOpenChange, user, onUpdateUser }: EditUserDialogProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<ManagedUserRole>(ManagedUserRole.User);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string }>({});

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setPassword('');
      setRole(user.role);
      setErrors({});
    }
  }, [user]);

  const validate = () => {
    const newErrors: { username?: string } = {};
    if (!username.trim()) newErrors.username = 'Username is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validate()) return;
    setIsLoading(true);
    try {
      await onUpdateUser(user.id, username.trim(), password, role);
      toast.success('User updated successfully.');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user account details. Leave password blank to keep unchanged.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-username">Username</Label>
            <Input
              id="edit-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              disabled={isLoading}
            />
            {errors.username && <p className="text-destructive text-xs">{errors.username}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-password">New Password <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              id="edit-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as ManagedUserRole)}
              disabled={isLoading}
            >
              <SelectTrigger id="edit-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ManagedUserRole.Admin}>Admin</SelectItem>
                <SelectItem value={ManagedUserRole.User}>User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
