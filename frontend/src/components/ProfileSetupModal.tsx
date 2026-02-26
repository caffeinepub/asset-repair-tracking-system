import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { AppUserRole } from '../backend';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<AppUserRole>(AppUserRole.technician);
  const saveProfile = useSaveCallerUserProfile();

  const handleSave = async () => {
    if (!name.trim()) return;
    await saveProfile.mutateAsync({ name: name.trim(), appRole: role });
  };

  return (
    <Dialog open>
      <DialogContent className="bg-card border-border sm:max-w-md" onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-foreground">Welcome to Rebtekx!</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Please set up your profile to get started.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Your Name</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value as AppUserRole)}
              className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value={AppUserRole.technician}>Technician</option>
              <option value={AppUserRole.supervisor}>Supervisor</option>
              <option value={AppUserRole.admin}>Admin</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={saveProfile.isPending || !name.trim()}
            className="w-full"
          >
            {saveProfile.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
