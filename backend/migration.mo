import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type OldRepairTicket = {
    ticketId : Text;
    serialNumber : Text;
    dateReceived : Int;
    timeReceived : Text;
    faultDescription : Text;
    diagnosis : Text;
    partsReplaced : [PartReplaced];
    technicianName : Text;
    repairStartDate : Int;
    repairCompletionDate : ?Int;
    sentToProgrammingDate : ?Int;
    dateDeployedToField : ?Int;
    outcome : RepairOutcome;
  };

  type NewRepairTicket = {
    ticketId : Text;
    serialNumber : Text;
    dateReceived : Int;
    timeReceived : Text;
    currentStage : Text;
    faultDescription : Text;
    diagnosis : Text;
    partsReplaced : [PartReplaced];
    technicianName : Text;
    repairStartDate : Int;
    repairCompletionDate : ?Int;
    sentToProgrammingDate : ?Int;
    dateDeployedToField : ?Int;
    outcome : RepairOutcome;
  };

  type OldActor = {
    assets : Map.Map<Text, Asset>;
    repairTickets : Map.Map<Text, OldRepairTicket>;
    parts : Map.Map<Text, Part>;
    auditEntries : Map.Map<Text, AuditEntry>;
    appUsers : Map.Map<Text, AppUser>;
    userProfiles : Map.Map<Principal, UserProfile>;
    clients : Map.Map<Text, Client>;
  };

  type NewActor = {
    assets : Map.Map<Text, Asset>;
    repairTickets : Map.Map<Text, NewRepairTicket>;
    parts : Map.Map<Text, Part>;
    auditEntries : Map.Map<Text, AuditEntry>;
    appUsers : Map.Map<Text, AppUser>;
    userProfiles : Map.Map<Principal, UserProfile>;
    clients : Map.Map<Text, Client>;
  };

  public type RepairOutcome = {
    #fixed;
    #replaced;
    #scrapped;
    #pending;
  };

  public type PartReplaced = {
    partNumber : Text;
    partName : Text;
    qty : Nat;
  };

  public type Asset = {
    serialNumber : Text;
    model : Text;
    client : Text;
    status : AssetStatus;
    condition : Text;
    dateFirstRegistered : Int;
  };

  public type Part = {
    partNumber : Text;
    partName : Text;
    compatibleModel : Text;
    quantityInStock : Nat;
    lowStockThreshold : Nat;
  };

  public type AuditEntry = {
    entryId : Text;
    entityType : Text;
    entityId : Text;
    changedBy : Text;
    timestamp : Int;
    changeDescription : Text;
  };

  public type AppUser = {
    userId : Text;
    name : Text;
    role : AppUserRole;
  };

  public type UserProfile = {
    name : Text;
    appRole : AppUserRole;
  };

  public type Client = {
    id : Text;
    name : Text;
    createTime : Int;
  };

  public type AppUserRole = {
    #technician;
    #supervisor;
    #admin;
  };

  public type AssetStatus = {
    #inField;
    #inRepair;
    #inProgramming;
    #deployed;
    #scrapped;
  };

  public func run(old : OldActor) : NewActor {
    let newRepairTickets = old.repairTickets.map<Text, OldRepairTicket, NewRepairTicket>(
      func(_id, oldTicket) {
        {
          ticketId = oldTicket.ticketId;
          serialNumber = oldTicket.serialNumber;
          dateReceived = oldTicket.dateReceived;
          timeReceived = oldTicket.timeReceived;
          currentStage = "Unknown";
          faultDescription = oldTicket.faultDescription;
          diagnosis = oldTicket.diagnosis;
          partsReplaced = oldTicket.partsReplaced;
          technicianName = oldTicket.technicianName;
          repairStartDate = oldTicket.repairStartDate;
          repairCompletionDate = oldTicket.repairCompletionDate;
          sentToProgrammingDate = oldTicket.sentToProgrammingDate;
          dateDeployedToField = oldTicket.dateDeployedToField;
          outcome = oldTicket.outcome;
        };
      }
    );
    {
      old with
      repairTickets = newRepairTickets
    };
  };
};
