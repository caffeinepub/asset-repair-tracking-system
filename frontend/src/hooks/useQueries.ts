import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
  Asset,
  RepairTicket,
  Part,
  AuditEntry,
  AppUser,
  AppUserRole,
  AssetStatus,
  BatchImportResult,
  ManagedUserPublic,
  ManagedUserRole,
  Client,
  UserProfile,
} from '../backend';

// ── User Profile ──────────────────────────────────────────────────────────────

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// ── Assets ────────────────────────────────────────────────────────────────────

export function useListAssets() {
  const { actor, isFetching } = useActor();
  return useQuery<Asset[]>({
    queryKey: ['assets'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAssets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddAsset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (asset: Asset) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addAsset(asset);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
    },
  });
}

export function useUpdateAsset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ serialNumber, asset }: { serialNumber: string; asset: Asset }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateAsset(serialNumber, asset);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
    },
  });
}

export function useDeleteAsset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serialNumber: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteAsset(serialNumber);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
    },
  });
}

export function useImportAssetBatch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (serialNumbers: string[]): Promise<BatchImportResult> => {
      if (!actor) throw new Error('Actor not available');
      return actor.importAssetBatch(serialNumbers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
    },
  });
}

// ── Repair Tickets ────────────────────────────────────────────────────────────

export function useListAllRepairs() {
  const { actor, isFetching } = useActor();
  return useQuery<RepairTicket[]>({
    queryKey: ['repairTickets'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAllRepairs();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateRepairTicket() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticket: RepairTicket) => {
      if (!actor) throw new Error('Actor not available');
      await actor.createRepairTicket(ticket);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairTickets'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
      queryClient.invalidateQueries({ queryKey: ['parts'] });
    },
  });
}

export function useUpdateRepairTicket() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, ticket }: { ticketId: string; ticket: RepairTicket }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateRepairTicket(ticketId, ticket);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairTickets'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useGetRepairsBySerial(serialNumber: string) {
  const { actor, isFetching } = useActor();
  return useQuery<RepairTicket[]>({
    queryKey: ['repairsBySerial', serialNumber],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRepairsBySerial(serialNumber);
    },
    enabled: !!actor && !isFetching && !!serialNumber,
  });
}

// ── Parts ─────────────────────────────────────────────────────────────────────

export function useListParts() {
  const { actor, isFetching } = useActor();
  return useQuery<Part[]>({
    queryKey: ['parts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listParts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetLowStockParts() {
  const { actor, isFetching } = useActor();
  return useQuery<Part[]>({
    queryKey: ['lowStockParts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLowStockParts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddPart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (part: Part) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addPart(part);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockParts'] });
    },
  });
}

export function useUpdatePartStock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ partNumber, delta }: { partNumber: string; delta: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updatePartStock(partNumber, delta);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockParts'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
    },
  });
}

// ── Audit Trail ───────────────────────────────────────────────────────────────

export function useGetAuditTrail(
  entityId: string | null,
  startDate: bigint | null,
  endDate: bigint | null
) {
  const { actor, isFetching } = useActor();
  return useQuery<AuditEntry[]>({
    queryKey: ['auditTrail', entityId, startDate?.toString() ?? null, endDate?.toString() ?? null],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAuditTrail(entityId, startDate, endDate);
    },
    enabled: !!actor && !isFetching,
  });
}

// ── App Users (legacy) ────────────────────────────────────────────────────────

export function useListUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<AppUser[]>({
    queryKey: ['appUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppUserRole }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateUserRole(userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appUsers'] });
    },
  });
}

// ── Managed Users ─────────────────────────────────────────────────────────────

export function useGetManagedUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<ManagedUserPublic[]>({
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
    enabled: !!actor && !isFetching,
  });
}

export function useCreateManagedUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      password,
      role,
    }: {
      username: string;
      password: string;
      role: ManagedUserRole;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Pass the role enum value directly — the backend interface expects ManagedUserRole
      return actor.createUser(username, password, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managedUsers'] });
    },
  });
}

export function useUpdateManagedUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      username,
      password,
      role,
    }: {
      id: bigint;
      username: string;
      password: string;
      role: ManagedUserRole;
    }) => {
      if (!actor) throw new Error('Actor not available');
      // Pass the role enum value directly — the backend interface expects ManagedUserRole
      await actor.updateUser(id, username, password, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managedUsers'] });
    },
  });
}

export function useDeleteManagedUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managedUsers'] });
    },
  });
}

// ── Clients ───────────────────────────────────────────────────────────────────

export function useGetClients() {
  const { actor, isFetching } = useActor();
  return useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listClients();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addClient(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useRenameClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, newName }: { clientId: string; newName: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.renameClient(clientId, newName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useDeleteClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteClient(clientId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

// ── Reports / Charts ──────────────────────────────────────────────────────────

export function useRepairsByStage() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['stageCounts'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getStageCounts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTopFailingModels() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['deviceModelCounts'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDeviceModelCounts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetStageCounts() {
  return useRepairsByStage();
}

export function useGetDeviceModelCounts() {
  return useTopFailingModels();
}

export function useGetMostReplacedParts(topN: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['mostReplacedParts', topN.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMostReplacedParts(topN);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRepeatedFaultAssets(threshold: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['repeatedFaultAssets', threshold.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRepeatedFaultAssets(threshold);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRepairsExceedingYearlyLimit(limit: bigint, year: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ['repairsExceedingYearlyLimit', limit.toString(), year.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRepairsExceedingYearlyLimit(limit, year);
    },
    enabled: !!actor && !isFetching,
  });
}
