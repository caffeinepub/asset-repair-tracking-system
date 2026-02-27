import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type ResultError = {
    __kind__: "nameTaken";
    nameTaken: string;
} | {
    __kind__: "emptyName";
    emptyName: null;
} | {
    __kind__: "noPermission";
    noPermission: null;
} | {
    __kind__: "clientNotFound";
    clientNotFound: null;
} | {
    __kind__: "clientIdTaken";
    clientIdTaken: null;
} | {
    __kind__: "invalidName";
    invalidName: string;
};
export interface Part {
    lowStockThreshold: bigint;
    partNumber: string;
    quantityInStock: bigint;
    partName: string;
    compatibleModel: string;
    image?: Uint8Array;
}
export interface ModelCount {
    carbon10: bigint;
    vx680: bigint;
    vx820: bigint;
    m400: bigint;
    carbon8: bigint;
}
export interface Config {
    discriminator: string;
}
export interface StageCount {
    deployed: bigint;
    closed: bigint;
    awaitingParts: bigint;
    diagnosing: bigint;
    repairing: bigint;
    qaTesting: bigint;
    readyDeploy: bigint;
    programming: bigint;
    received: bigint;
}
export interface AuditEntry {
    changedBy: string;
    entryId: string;
    entityId: string;
    timestamp: bigint;
    entityType: string;
    changeDescription: string;
}
export interface ManagedUserPublic {
    id: bigint;
    username: string;
    role: ManagedUserRole;
}
export interface AppUser {
    userId: string;
    name: string;
    role: AppUserRole;
}
export type Result = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: ResultError;
};
export interface Asset {
    status: AssetStatus;
    client: string;
    model: string;
    dateFirstRegistered: bigint;
    serialNumber: string;
    condition: string;
}
export interface BatchImportResult {
    errors: Array<string>;
    importedCount: bigint;
    existingCount: bigint;
    errorCount: bigint;
}
export type LoginResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export interface PartReplaced {
    qty: bigint;
    partNumber: string;
    partName: string;
}
export interface Client {
    id: string;
    name: string;
    createTime: bigint;
}
export interface UserProfile {
    appRole: AppUserRole;
    name: string;
}
export interface RepairTicket {
    repairCompletionDate?: bigint;
    technicianName: string;
    faultDescription: string;
    diagnosis: string;
    ticketId: string;
    sentToProgrammingDate?: bigint;
    dateDeployedToField?: bigint;
    timeReceived: string;
    serialNumber: string;
    dateReceived: bigint;
    partsReplaced: Array<PartReplaced>;
    repairStartDate: bigint;
    currentStage: string;
    outcome: RepairOutcome;
}
export enum AppUserRole {
    supervisor = "supervisor",
    technician = "technician",
    admin = "admin"
}
export enum AssetStatus {
    deployed = "deployed",
    scrapped = "scrapped",
    inRepair = "inRepair",
    inProgramming = "inProgramming",
    inField = "inField"
}
export enum ManagedUserRole {
    User = "User",
    Admin = "Admin"
}
export enum RepairOutcome {
    fixed = "fixed",
    replaced = "replaced",
    pending = "pending",
    scrapped = "scrapped"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAsset(asset: Asset): Promise<void>;
    addClient(name: string): Promise<Result>;
    addPart(part: Part): Promise<void>;
    addUser(user: AppUser): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createRepairTicket(ticket: RepairTicket): Promise<void>;
    createUser(username: string, password: string, role: ManagedUserRole): Promise<bigint>;
    deleteAsset(serialNumber: string): Promise<void>;
    deleteClient(clientId: string): Promise<Result>;
    deleteUser(id: bigint): Promise<void>;
    filterAssets(model: string | null, client: string | null, status: AssetStatus | null): Promise<Array<Asset>>;
    filterRepairs(model: string | null, client: string | null, startDate: bigint | null, endDate: bigint | null, faultKeyword: string | null): Promise<Array<RepairTicket>>;
    getAsset(serialNumber: string): Promise<Asset>;
    getAuditTrail(entityId: string | null, startDate: bigint | null, endDate: bigint | null): Promise<Array<AuditEntry>>;
    getCallerRole(): Promise<UserRole>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConfig(): Promise<Config>;
    getCurrentUserRole(userId: string): Promise<AppUserRole | null>;
    getDeviceModelCounts(): Promise<ModelCount>;
    getLowStockParts(): Promise<Array<Part>>;
    getMeanTimeBetweenFailures(serialNumber: string): Promise<bigint | null>;
    getMostReplacedParts(topN: bigint): Promise<Array<[string, string, bigint]>>;
    getPart(partNumber: string): Promise<Part>;
    getRepairFrequency(serialNumber: string): Promise<bigint>;
    getRepairTicket(ticketId: string): Promise<RepairTicket>;
    getRepairsBySerial(serialNumber: string): Promise<Array<RepairTicket>>;
    getRepairsExceedingYearlyLimit(limit: bigint, year: bigint): Promise<Array<Asset>>;
    getRepeatedFaultAssets(threshold: bigint): Promise<Array<Asset>>;
    getStageCounts(): Promise<StageCount>;
    getTechnicianWorkload(technicianName: string, startDate: bigint, endDate: bigint): Promise<[bigint, Array<RepairTicket>]>;
    getUser(userId: string): Promise<AppUser>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUsers(): Promise<Array<ManagedUserPublic>>;
    grantAdminRole(userToPromote: Principal): Promise<void>;
    importAssetBatch(serialNumbers: Array<string>): Promise<BatchImportResult>;
    isCallerAdmin(): Promise<boolean>;
    listAllRepairs(): Promise<Array<RepairTicket>>;
    listAssets(): Promise<Array<Asset>>;
    listClients(): Promise<Array<Client>>;
    listParts(): Promise<Array<Part>>;
    listUsers(): Promise<Array<AppUser>>;
    login(username: string, password: string): Promise<LoginResult>;
    renameClient(clientId: string, newName: string): Promise<Result>;
    revokeAdminRole(adminToDemote: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchBySerial(queryText: string): Promise<Array<Asset>>;
    updateAsset(serialNumber: string, updatedAsset: Asset): Promise<void>;
    updatePartStock(partNumber: string, delta: bigint): Promise<void>;
    updateRepairTicket(ticketId: string, updatedTicket: RepairTicket): Promise<void>;
    updateUser(id: bigint, username: string, password: string, role: ManagedUserRole): Promise<void>;
    updateUserRole(userId: string, newRole: AppUserRole): Promise<void>;
}
