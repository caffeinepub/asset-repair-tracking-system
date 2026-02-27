import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  Asset,
  RepairTicket,
  Part,
  AuditEntry,
  AppUser,
  AppUserRole,
  Client,
  UserProfile,
  ManagedUserPublic,
  ManagedUserRole,
  BatchImportResult,
  UserRole,
} from '../backend';
import { Principal } from '@dfinity/principal';

// ── Actor Role ────────────────────────────────────────────────────────────────

export function useGetCallerRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['callerRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerRole();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 30_000,
  });
}

// ── User Profile ──────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

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

export function useGetAssets() {
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

// Alias for backward compatibility
export const useListAssets = useGetAssets;

export function useAddAsset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (asset: Asset) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAsset(asset);
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
      return actor.updateAsset(serialNumber, asset);
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
      return actor.deleteAsset(serialNumber);
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

export function useGetRepairTickets() {
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

// Alias for backward compatibility
export const useListAllRepairs = useGetRepairTickets;

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

export function useCreateRepairTicket() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticket: RepairTicket) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createRepairTicket(ticket);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairTickets'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
    },
  });
}

export function useUpdateRepairTicket() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ticketId, ticket }: { ticketId: string; ticket: RepairTicket }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateRepairTicket(ticketId, ticket);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairTickets'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
    },
  });
}

// ── Parts ─────────────────────────────────────────────────────────────────────

export function useGetParts() {
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

// Alias for backward compatibility
export const useListParts = useGetParts;

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
      return actor.addPart(part);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockParts'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
    },
  });
}

export function useUpdatePart() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (part: Part) => {
      if (!actor) throw new Error('Actor not available');
      // addPart overwrites the existing entry by partNumber key
      return actor.addPart(part);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockParts'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
    },
  });
}

export function useUpdatePartStock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ partNumber, delta }: { partNumber: string; delta: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updatePartStock(partNumber, delta);
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
    queryKey: [
      'auditTrail',
      entityId,
      startDate !== null ? startDate.toString() : null,
      endDate !== null ? endDate.toString() : null,
    ],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAuditTrail(entityId, startDate, endDate);
    },
    enabled: !!actor && !isFetching,
  });
}

// ── App Users (legacy) ────────────────────────────────────────────────────────

export function useGetAppUsers() {
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

// Alias for backward compatibility
export const useListUsers = useGetAppUsers;

export function useUpdateUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppUserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateUserRole(userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appUsers'] });
    },
  });
}

// Alias for backward compatibility
export const useUpdateRole = useUpdateUserRole;

// ── Managed Users ─────────────────────────────────────────────────────────────

export function useGetManagedUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<ManagedUserPublic[]>({
    queryKey: ['managedUsers'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUsers();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useCreateUser() {
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
      return actor.createUser(username, password, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
    },
  });
}

// Alias for backward compatibility
export const useCreateManagedUser = useCreateUser;

export function useUpdateUser() {
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
      return actor.updateUser(id, username, password, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managedUsers'] });
    },
  });
}

// Alias for backward compatibility
export const useUpdateManagedUser = useUpdateUser;

export function useDeleteUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteUser(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
    },
  });
}

// Alias for backward compatibility
export const useDeleteManagedUser = useDeleteUser;

// ── Admin Role Management ─────────────────────────────────────────────────────

export function useGrantAdminRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.grantAdminRole(userPrincipal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['callerRole'] });
    },
  });
}

export function useRevokeAdminRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.revokeAdminRole(userPrincipal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['callerRole'] });
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
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
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
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
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
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
    },
  });
}

// ── Reports ───────────────────────────────────────────────────────────────────

export function useGetStageCounts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['stageCounts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getStageCounts();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compatibility
export const useRepairsByStage = useGetStageCounts;

export function useGetDeviceModelCounts() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['deviceModelCounts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getDeviceModelCounts();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compatibility
export const useTopFailingModels = useGetDeviceModelCounts;

export function useGetMostReplacedParts(topN: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, string, bigint]>>({
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

  return useQuery<Asset[]>({
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

  return useQuery<Asset[]>({
    queryKey: ['repairsExceedingYearlyLimit', limit.toString(), year.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRepairsExceedingYearlyLimit(limit, year);
    },
    enabled: !!actor && !isFetching,
  });
}
