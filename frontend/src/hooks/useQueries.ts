import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Asset, RepairTicket, Part, AppUser, AuditEntry, AssetStatus, AppUserRole, UserProfile, Client, StageCount, ModelCount } from '../backend';
import { toast } from 'sonner';

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

export function useFilterAssets(model: string | null, client: string | null, status: AssetStatus | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Asset[]>({
    queryKey: ['assets', 'filter', model, client, status],
    queryFn: async () => {
      if (!actor) return [];
      return actor.filterAssets(model, client, status);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchBySerial(query: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Asset[]>({
    queryKey: ['assets', 'search', query],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchBySerial(query);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetRepairsBySerial(serialNumber: string) {
  const { actor, isFetching } = useActor();
  return useQuery<RepairTicket[]>({
    queryKey: ['repairs', 'bySerial', serialNumber],
    queryFn: async () => {
      if (!actor || !serialNumber) return [];
      return actor.getRepairsBySerial(serialNumber);
    },
    enabled: !!actor && !isFetching && !!serialNumber,
  });
}

// ── Repair Tickets ────────────────────────────────────────────────────────────

export function useListAllRepairs() {
  const { actor, isFetching } = useActor();
  return useQuery<RepairTicket[]>({
    queryKey: ['repairs'],
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
      return actor.createRepairTicket(ticket);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['parts'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
      queryClient.invalidateQueries({ queryKey: ['repairsByStage'] });
      queryClient.invalidateQueries({ queryKey: ['topFailingModels'] });
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
      queryClient.invalidateQueries({ queryKey: ['repairs'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
      queryClient.invalidateQueries({ queryKey: ['repairsByStage'] });
      queryClient.invalidateQueries({ queryKey: ['topFailingModels'] });
    },
  });
}

export function useFilterRepairs(
  model: string | null,
  client: string | null,
  startDate: bigint | null,
  endDate: bigint | null,
  faultKeyword: string | null
) {
  const { actor, isFetching } = useActor();
  return useQuery<RepairTicket[]>({
    queryKey: ['repairs', 'filter', model, client, startDate?.toString(), endDate?.toString(), faultKeyword],
    queryFn: async () => {
      if (!actor) return [];
      return actor.filterRepairs(model, client, startDate, endDate, faultKeyword);
    },
    enabled: !!actor && !isFetching,
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
    queryKey: ['parts', 'lowStock'],
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
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
    },
  });
}

// ── Reports ───────────────────────────────────────────────────────────────────

export function useGetRepairFrequency(serialNumber: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ['reports', 'repairFrequency', serialNumber],
    queryFn: async () => {
      if (!actor || !serialNumber) return BigInt(0);
      return actor.getRepairFrequency(serialNumber);
    },
    enabled: !!actor && !isFetching && !!serialNumber,
  });
}

export function useGetRepeatedFaultAssets(threshold: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Asset[]>({
    queryKey: ['reports', 'repeatedFaults', threshold.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRepeatedFaultAssets(threshold);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMeanTimeBetweenFailures(serialNumber: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint | null>({
    queryKey: ['reports', 'mtbf', serialNumber],
    queryFn: async () => {
      if (!actor || !serialNumber) return null;
      return actor.getMeanTimeBetweenFailures(serialNumber);
    },
    enabled: !!actor && !isFetching && !!serialNumber,
  });
}

export function useGetMostReplacedParts(topN: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Array<[string, string, bigint]>>({
    queryKey: ['reports', 'mostReplacedParts', topN.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMostReplacedParts(topN);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTechnicianWorkload(technicianName: string, startDate: bigint, endDate: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<[bigint, RepairTicket[]]>({
    queryKey: ['reports', 'techWorkload', technicianName, startDate.toString(), endDate.toString()],
    queryFn: async () => {
      if (!actor || !technicianName) return [BigInt(0), []];
      return actor.getTechnicianWorkload(technicianName, startDate, endDate);
    },
    enabled: !!actor && !isFetching && !!technicianName,
  });
}

export function useGetRepairsExceedingYearlyLimit(limit: bigint, year: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery<Asset[]>({
    queryKey: ['reports', 'yearlyLimit', limit.toString(), year.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRepairsExceedingYearlyLimit(limit, year);
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Audit Trail ───────────────────────────────────────────────────────────────

export function useGetAuditTrail(entityId: string | null, startDate: bigint | null, endDate: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<AuditEntry[]>({
    queryKey: ['auditTrail', entityId, startDate?.toString(), endDate?.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAuditTrail(entityId, startDate, endDate);
    },
    enabled: !!actor && !isFetching,
  });
}

// ── App Users ─────────────────────────────────────────────────────────────────

export function useListUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<AppUser[]>({
    queryKey: ['users'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: AppUser) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addUser(user);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppUserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateUserRole(userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
      const result = await actor.addClient(name);
      if (result.__kind__ === 'err') {
        const err = result.err;
        if (err.__kind__ === 'nameTaken') throw new Error(`Client name "${err.nameTaken}" is already taken`);
        if (err.__kind__ === 'emptyName') throw new Error('Client name cannot be empty');
        if (err.__kind__ === 'invalidName') throw new Error(`Invalid name: ${err.invalidName}`);
        throw new Error('Failed to add client');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
      toast.success('Client added successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to add client');
    },
  });
}

export function useRenameClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clientId, newName }: { clientId: string; newName: string }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.renameClient(clientId, newName);
      if (result.__kind__ === 'err') {
        const err = result.err;
        if (err.__kind__ === 'nameTaken') throw new Error(`Client name "${err.nameTaken}" is already taken`);
        if (err.__kind__ === 'emptyName') throw new Error('Client name cannot be empty');
        if (err.__kind__ === 'invalidName') throw new Error(`Invalid name: ${err.invalidName}`);
        if (err.__kind__ === 'clientNotFound') throw new Error('Client not found');
        throw new Error('Failed to rename client');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
      toast.success('Client renamed successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to rename client');
    },
  });
}

export function useDeleteClient() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.deleteClient(clientId);
      if (result.__kind__ === 'err') {
        const err = result.err;
        if (err.__kind__ === 'clientNotFound') throw new Error('Client not found');
        throw new Error('Failed to delete client');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['auditTrail'] });
      toast.success('Client deleted successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete client');
    },
  });
}

// ── Dashboard Charts ──────────────────────────────────────────────────────────

export function useRepairsByStage() {
  const { actor, isFetching } = useActor();
  return useQuery<StageCount>({
    queryKey: ['repairsByStage'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getStageCounts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTopFailingModels() {
  const { actor, isFetching } = useActor();
  return useQuery<ModelCount>({
    queryKey: ['topFailingModels'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getDeviceModelCounts();
    },
    enabled: !!actor && !isFetching,
  });
}
