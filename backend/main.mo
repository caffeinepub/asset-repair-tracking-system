import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

// Enables explicit migration
(with migration = Migration.run)
actor {
  public type AssetStatus = {
    #inField;
    #inRepair;
    #inProgramming;
    #deployed;
    #scrapped;
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

  public type RepairTicket = {
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

  public type AppUserRole = {
    #technician;
    #supervisor;
    #admin;
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

  // ── User management types (from implementation plan) ──────────────────────

  public type ManagedUserRole = {
    #Admin;
    #User;
  };

  public type ManagedUser = {
    id : Nat;
    username : Text;
    passwordHash : Text;
    role : ManagedUserRole;
  };

  public type ManagedUserPublic = {
    id : Nat;
    username : Text;
    role : ManagedUserRole;
  };

  public type LoginResult = {
    #ok : Text;
    #err : Text;
  };

  type Result = {
    #ok;
    #err : ResultError;
  };

  type ResultError = {
    #clientNotFound;
    #nameTaken : Text;
    #clientIdTaken;
    #emptyName;
    #noPermission;
    #invalidName : Text;
  };

  public type Config = { discriminator : Text };

  stable let config : Config = {
    discriminator = "backend-with-configs";
  };

  public query ({ caller }) func getConfig() : async Config {
    config;
  };

  // State
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let assets = Map.empty<Text, Asset>();
  let repairTickets = Map.empty<Text, RepairTicket>();
  let parts = Map.empty<Text, Part>();
  let auditEntries = Map.empty<Text, AuditEntry>();
  let appUsers = Map.empty<Text, AppUser>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let clients = Map.empty<Text, Client>();

  // ── Managed users (implementation plan) ──────────────────────────────────
  let managedUsers = Map.empty<Nat, ManagedUser>();
  stable var nextUserId : Nat = 1;
  stable var managedUsersSeeded : Bool = false;

  // Simple hash function for passwords (deterministic)
  func hashPassword(password : Text) : Text {
    // Simple deterministic hash using character codes
    var hash : Nat = 5381;
    for (c in password.chars()) {
      let code = Nat32.toNat(Char.toNat32(c));
      hash := ((hash * 33) + code) % 4294967296;
    };
    "hash_" # hash.toText();
  };

  // Seed default admin on first deploy
  func seedDefaultAdmin() {
    if (not managedUsersSeeded) {
      let adminUser : ManagedUser = {
        id = 0;
        username = "admin";
        passwordHash = hashPassword("admin123");
        role = #Admin;
      };
      managedUsers.add(0, adminUser);
      managedUsersSeeded := true;
    };
  };

  // Initialize seed
  seedDefaultAdmin();

  func assetStatusToText(status : AssetStatus) : Text {
    switch (status) {
      case (#inField) { "inField" };
      case (#inRepair) { "inRepair" };
      case (#inProgramming) { "inProgramming" };
      case (#deployed) { "deployed" };
      case (#scrapped) { "scrapped" };
    };
  };

  func repairOutcomeToText(outcome : RepairOutcome) : Text {
    switch (outcome) {
      case (#fixed) { "fixed" };
      case (#replaced) { "replaced" };
      case (#scrapped) { "scrapped" };
      case (#pending) { "pending" };
    };
  };

  func appUserRoleToText(role : AppUserRole) : Text {
    switch (role) {
      case (#technician) { "technician" };
      case (#supervisor) { "supervisor" };
      case (#admin) { "admin" };
    };
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  func generateId(prefix : Text) : Text {
    let timestamp = Time.now();
    prefix # "_" # timestamp.toText();
  };

  func addAuditEntry(entityType : Text, entityId : Text, changedBy : Text, description : Text) {
    let entry : AuditEntry = {
      entryId = generateId("audit");
      entityType = entityType;
      entityId = entityId;
      changedBy = changedBy;
      timestamp = Time.now();
      changeDescription = description;
    };
    auditEntries.add(entry.entryId, entry);
  };

  // ── CRUD: Clients ─────────────────────────────────────────────────────────

  func validateClientName(name : Text) : ?ResultError {
    if (name.size() == 0) {
      return ?#emptyName;
    };
    if (name.contains(#char '.')) {
      return ?#invalidName("Name cannot contain '.'");
    };
    if (name.contains(#text("  "))) {
      return ?#invalidName("Name cannot consist only of spaces");
    };
    null;
  };

  func removeTrailingDot(name : Text) : Text {
    if (name.endsWith(#text("."))) {
      name.trimEnd(#char '.');
    } else {
      name;
    };
  };

  func isNameTaken(name : Text) : Bool {
    let nameTrimmed = name.trimEnd(#char ' ');
    if (nameTrimmed == name and not name.startsWith(#text(nameTrimmed))) {
      return false;
    };
    for ((id, client) in clients.entries()) {
      if (client.name == nameTrimmed or client.name == name) {
        return true;
      };
      let nameWithoutDot = if (client.name.endsWith(#text("."))) {
        removeTrailingDot(client.name);
      } else {
        client.name;
      };

      if (nameWithoutDot == nameTrimmed or nameWithoutDot == name) {
        return true;
      };
      if (
        not client.name.endsWith(#text(".")) and
        client.name.trimEnd(#char ' ') == name
      ) {
        return true;
      };
      if (not nameTrimmed.endsWith(#text("."))) {
        let nameWithDot = nameTrimmed # ".";
        if (client.name == nameWithDot) { return true };
        if (
          not client.name.endsWith(#text(".")) and
          (client.name.trimEnd(#char ' ') == nameWithDot)
        ) { return true };
      };
    };
    false;
  };

  func getClientByName(_name : Text) : ?Client {
    for ((_, client) in clients.entries()) {
      let nameWithoutTrailingDot = client.name.trimEnd(#char '.');
      if (
        client.name == _name or
        nameWithoutTrailingDot == _name or _name.trimEnd(#char '.') == client.name
      ) {
        return ?client;
      };
    };
    null;
  };

  func validateNameInput(newName : Text, currentClient : Client) : Result {
    if (newName.size() == 0) {
      return #err(#emptyName);
    };
    if (newName.contains(#char '.')) {
      return #err(#invalidName("Name cannot contain '.'"));
    };
    if (newName.contains(#text("  "))) {
      return #err(#invalidName("Name cannot consist only of spaces"));
    };
    if (currentClient.name == newName) {
      return #ok;
    };
    if (isNameTaken(newName)) {
      return #err(#nameTaken(newName));
    };
    #ok;
  };

  public shared ({ caller }) func addClient(name : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can manage clients");
    };

    switch (validateClientName(name)) {
      case (?err) { return #err(err) };
      case (null) {};
    };

    if (isNameTaken(name)) {
      return #err(#nameTaken(name));
    };

    let client : Client = {
      id = name;
      name;
      createTime = Time.now();
    };
    clients.add(client.id, client);

    addAuditEntry("Client", client.id, caller.toText(), "Client added: " # name);
    #ok;
  };

  public shared ({ caller }) func renameClient(clientId : Text, newName : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can manage clients");
    };

    switch (clients.get(clientId)) {
      case (null) { #err(#clientNotFound) };
      case (?existingClient) {
        let validationResult = validateNameInput(newName, existingClient);
        switch (validationResult) {
          case (#err(e)) { return #err(e) };
          case (#ok) {};
        };
        let newClient : Client = {
          id = existingClient.id;
          name = newName;
          createTime = existingClient.createTime;
        };
        clients.add(clientId, newClient);
        addAuditEntry("Client", clientId, caller.toText(), "Client renamed from " # existingClient.name # " to " # newName);
        #ok;
      };
    };
  };

  public shared ({ caller }) func deleteClient(clientId : Text) : async Result {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can manage clients");
    };

    switch (clients.get(clientId)) {
      case (null) { #err(#clientNotFound) };
      case (?existingClient) {
        clients.remove(clientId);
        addAuditEntry("Client", clientId, caller.toText(), "Client deleted: " # existingClient.name);
        #ok;
      };
    };
  };

  public query ({ caller }) func listClients() : async [Client] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list clients");
    };
    clients.values().toArray();
  };

  // ── User Profile (required by frontend) ──────────────────────────────────

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can get their profile");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // ── Asset CRUD ────────────────────────────────────────────────────────────

  public shared ({ caller }) func addAsset(asset : Asset) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add assets");
    };
    assets.add(asset.serialNumber, asset);
    addAuditEntry("Asset", asset.serialNumber, caller.toText(), "Asset created with status: " # assetStatusToText(asset.status));
  };

  public shared ({ caller }) func updateAsset(serialNumber : Text, updatedAsset : Asset) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update assets");
    };
    switch (assets.get(serialNumber)) {
      case (?existingAsset) {
        assets.add(serialNumber, updatedAsset);
        addAuditEntry(
          "Asset",
          serialNumber,
          caller.toText(),
          "Asset updated. Status: " # assetStatusToText(existingAsset.status) # " -> " # assetStatusToText(updatedAsset.status),
        );
      };
      case (null) {
        Runtime.trap("Asset not found");
      };
    };
  };

  public query ({ caller }) func getAsset(serialNumber : Text) : async Asset {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view assets");
    };
    switch (assets.get(serialNumber)) {
      case (?asset) { asset };
      case (null) { Runtime.trap("Asset not found") };
    };
  };

  public query ({ caller }) func listAssets() : async [Asset] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list assets");
    };
    assets.values().toArray();
  };

  public shared ({ caller }) func deleteAsset(serialNumber : Text) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete assets");
    };
    assets.remove(serialNumber);
    addAuditEntry("Asset", serialNumber, caller.toText(), "Asset deleted");
  };

  // ── Batch Asset Import ────────────────────────────────────────────

  public type BatchImportResult = {
    importedCount : Nat;
    existingCount : Nat;
    errorCount : Nat;
    errors : [Text];
  };

  public shared ({ caller }) func importAssetBatch(serialNumbers : [Text]) : async BatchImportResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can import assets");
    };

    var importedCount = 0;
    var existingCount = 0;
    var errorCount = 0;
    let errors = List.empty<Text>();

    for (serial in serialNumbers.values()) {
      let trimmedSerial = serial.trim(#char ' ');

      if (trimmedSerial.size() == 0) {
        errors.add("empty_serial_number");
        errorCount += 1;
      } else {
        switch (assets.get(trimmedSerial)) {
          case (?_existing) {
            existingCount += 1;
          };
          case (null) {
            let newAsset = {
              serialNumber = trimmedSerial;
              model = "Unknown";
              client = "Unknown";
              status = #inField;
              condition = "Not specified";
              dateFirstRegistered = Time.now();
            };
            assets.add(trimmedSerial, newAsset);
            importedCount += 1;
            addAuditEntry("Asset", trimmedSerial, caller.toText(), "Asset batch imported with default values");
          };
        };
      };
    };

    {
      importedCount;
      existingCount;
      errorCount;
      errors = errors.toArray();
    };
  };

  // ── Repair Ticket Functions ───────────────────────────────────────────────

  public shared ({ caller }) func createRepairTicket(ticket : RepairTicket) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create repair tickets");
    };
    repairTickets.add(ticket.ticketId, ticket);
    addAuditEntry("RepairTicket", ticket.ticketId, caller.toText(), "Repair ticket created for serial: " # ticket.serialNumber);

    // Decrement parts stock for parts used in this ticket
    for (partUsed in ticket.partsReplaced.vals()) {
      switch (parts.get(partUsed.partNumber)) {
        case (?existingPart) {
          let newQty : Nat = if (existingPart.quantityInStock >= partUsed.qty) {
            existingPart.quantityInStock - partUsed.qty;
          } else {
            0;
          };
          let updatedPart = {
            partNumber = existingPart.partNumber;
            partName = existingPart.partName;
            compatibleModel = existingPart.compatibleModel;
            quantityInStock = newQty;
            lowStockThreshold = existingPart.lowStockThreshold;
          };
          parts.add(partUsed.partNumber, updatedPart);
          addAuditEntry("Part", partUsed.partNumber, caller.toText(), "Stock decremented by " # partUsed.qty.toText() # " for repair ticket " # ticket.ticketId);
        };
        case (null) {};
      };
    };

    // Handle outcome-driven asset status update
    switch (ticket.outcome) {
      case (#fixed) {
        switch (assets.get(ticket.serialNumber)) {
          case (?asset) {
            let updated = {
              serialNumber = asset.serialNumber;
              model = asset.model;
              client = asset.client;
              status = #inField;
              condition = asset.condition;
              dateFirstRegistered = asset.dateFirstRegistered;
            };
            assets.add(asset.serialNumber, updated);
            addAuditEntry("Asset", asset.serialNumber, caller.toText(), "Status set to inField after repair outcome: fixed");
          };
          case (null) {};
        };
      };
      case (#replaced) {
        switch (assets.get(ticket.serialNumber)) {
          case (?asset) {
            let updated = {
              serialNumber = asset.serialNumber;
              model = asset.model;
              client = asset.client;
              status = #deployed;
              condition = asset.condition;
              dateFirstRegistered = asset.dateFirstRegistered;
            };
            assets.add(asset.serialNumber, updated);
            addAuditEntry("Asset", asset.serialNumber, caller.toText(), "Status set to deployed after repair outcome: replaced");
          };
          case (null) {};
        };
      };
      case (#scrapped) {
        switch (assets.get(ticket.serialNumber)) {
          case (?asset) {
            let updated = {
              serialNumber = asset.serialNumber;
              model = asset.model;
              client = asset.client;
              status = #scrapped;
              condition = asset.condition;
              dateFirstRegistered = asset.dateFirstRegistered;
            };
            assets.add(asset.serialNumber, updated);
            addAuditEntry("Asset", asset.serialNumber, caller.toText(), "Status set to scrapped after repair outcome: scrapped");
          };
          case (null) {};
        };
      };
      case (#pending) {};
    };
  };

  public shared ({ caller }) func updateRepairTicket(ticketId : Text, updatedTicket : RepairTicket) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update repair tickets");
    };
    switch (repairTickets.get(ticketId)) {
      case (?existingTicket) {
        repairTickets.add(ticketId, updatedTicket);
        addAuditEntry(
          "RepairTicket",
          ticketId,
          caller.toText(),
          "Repair ticket updated. Outcome: " # repairOutcomeToText(existingTicket.outcome) # " -> " # repairOutcomeToText(updatedTicket.outcome),
        );

        // Handle outcome-driven asset status updates when outcome changes
        let outcomeChanged = repairOutcomeToText(existingTicket.outcome) != repairOutcomeToText(updatedTicket.outcome);
        if (outcomeChanged) {
          switch (updatedTicket.outcome) {
            case (#fixed) {
              switch (assets.get(updatedTicket.serialNumber)) {
                case (?asset) {
                  let updated = {
                    serialNumber = asset.serialNumber;
                    model = asset.model;
                    client = asset.client;
                    status = #inField;
                    condition = asset.condition;
                    dateFirstRegistered = asset.dateFirstRegistered;
                  };
                  assets.add(asset.serialNumber, updated);
                  addAuditEntry("Asset", asset.serialNumber, caller.toText(), "Status set to inField after repair outcome updated to: fixed");
                };
                case (null) {};
              };
            };
            case (#replaced) {
              switch (assets.get(updatedTicket.serialNumber)) {
                case (?asset) {
                  let updated = {
                    serialNumber = asset.serialNumber;
                    model = asset.model;
                    client = asset.client;
                    status = #deployed;
                    condition = asset.condition;
                    dateFirstRegistered = asset.dateFirstRegistered;
                  };
                  assets.add(asset.serialNumber, updated);
                  addAuditEntry("Asset", asset.serialNumber, caller.toText(), "Status set to deployed after repair outcome updated to: replaced");
                };
                case (null) {};
              };
            };
            case (#scrapped) {
              switch (assets.get(updatedTicket.serialNumber)) {
                case (?asset) {
                  let updated = {
                    serialNumber = asset.serialNumber;
                    model = asset.model;
                    client = asset.client;
                    status = #scrapped;
                    condition = asset.condition;
                    dateFirstRegistered = asset.dateFirstRegistered;
                  };
                  assets.add(asset.serialNumber, updated);
                  addAuditEntry("Asset", asset.serialNumber, caller.toText(), "Status set to scrapped after repair outcome updated to: scrapped");
                };
                case (null) {};
              };
            };
            case (#pending) {};
          };
        };
      };
      case (null) {
        Runtime.trap("Repair ticket not found");
      };
    };
  };

  public query ({ caller }) func getRepairTicket(ticketId : Text) : async RepairTicket {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view repair tickets");
    };
    switch (repairTickets.get(ticketId)) {
      case (?ticket) { ticket };
      case (null) { Runtime.trap("Repair ticket not found") };
    };
  };

  public query ({ caller }) func getRepairsBySerial(serialNumber : Text) : async [RepairTicket] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view repair tickets");
    };
    let result = List.empty<RepairTicket>();
    for (ticket in repairTickets.values()) {
      if (ticket.serialNumber == serialNumber) {
        result.add(ticket);
      };
    };
    result.toArray();
  };

  public query ({ caller }) func listAllRepairs() : async [RepairTicket] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list repairs");
    };
    repairTickets.values().toArray();
  };

  // ── Parts Inventory ───────────────────────────────────────────────────────

  public shared ({ caller }) func addPart(part : Part) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add parts");
    };
    parts.add(part.partNumber, part);
    addAuditEntry("Part", part.partNumber, caller.toText(), "Part added: " # part.partName);
  };

  public shared ({ caller }) func updatePartStock(partNumber : Text, delta : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update part stock");
    };
    switch (parts.get(partNumber)) {
      case (?existingPart) {
        let currentQty : Int = existingPart.quantityInStock;
        let newQtyInt : Int = currentQty + delta;
        if (newQtyInt < 0) {
          Runtime.trap("Quantity cannot be negative");
        };
        let newQty : Nat = Int.abs(newQtyInt);
        let updatedPart = {
          partNumber = existingPart.partNumber;
          partName = existingPart.partName;
          compatibleModel = existingPart.compatibleModel;
          quantityInStock = newQty;
          lowStockThreshold = existingPart.lowStockThreshold;
        };
        parts.add(partNumber, updatedPart);
        addAuditEntry(
          "Part",
          partNumber,
          caller.toText(),
          "Stock updated from " # existingPart.quantityInStock.toText() # " to " # newQty.toText(),
        );
      };
      case (null) {
        Runtime.trap("Part not found");
      };
    };
  };

  public query ({ caller }) func getPart(partNumber : Text) : async Part {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view parts");
    };
    switch (parts.get(partNumber)) {
      case (?part) { part };
      case (null) { Runtime.trap("Part not found") };
    };
  };

  public query ({ caller }) func listParts() : async [Part] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list parts");
    };
    parts.values().toArray();
  };

  public query ({ caller }) func getLowStockParts() : async [Part] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view low stock parts");
    };
    let result = List.empty<Part>();
    for (part in parts.values()) {
      if (part.quantityInStock <= part.lowStockThreshold) {
        result.add(part);
      };
    };
    result.toArray();
  };

  // ── Reporting / Analytics ─────────────────────────────────────────────────

  public query ({ caller }) func getRepairFrequency(serialNumber : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view reports");
    };
    var count : Nat = 0;
    for (ticket in repairTickets.values()) {
      if (ticket.serialNumber == serialNumber) {
        count += 1;
      };
    };
    count;
  };

  public query ({ caller }) func getRepeatedFaultAssets(threshold : Nat) : async [Asset] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view reports");
    };
    let countMap = Map.empty<Text, Nat>();
    for (ticket in repairTickets.values()) {
      switch (countMap.get(ticket.serialNumber)) {
        case (?c) { countMap.add(ticket.serialNumber, c + 1) };
        case (null) { countMap.add(ticket.serialNumber, 1) };
      };
    };
    let result = List.empty<Asset>();
    for (asset in assets.values()) {
      switch (countMap.get(asset.serialNumber)) {
        case (?c) {
          if (c >= threshold) {
            result.add(asset);
          };
        };
        case (null) {};
      };
    };
    result.toArray();
  };

  public query ({ caller }) func getMeanTimeBetweenFailures(serialNumber : Text) : async ?Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view reports");
    };
    let startDates = List.empty<Int>();
    for (ticket in repairTickets.values()) {
      if (ticket.serialNumber == serialNumber) {
        startDates.add(ticket.repairStartDate);
      };
    };
    let arr = startDates.toArray().sort();
    let n = arr.size();
    if (n < 2) {
      return null;
    };
    var totalGap : Int = 0;
    var i = 1;
    while (i < n) {
      totalGap += arr[i] - arr[i - 1];
      i += 1;
    };
    let nanosPerDay : Int = 86_400_000_000_000;
    let avgNanos : Int = totalGap / (n - 1);
    ?(avgNanos / nanosPerDay);
  };

  public query ({ caller }) func getMostReplacedParts(topN : Nat) : async [(Text, Text, Nat)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view reports");
    };
    let countMap = Map.empty<Text, Nat>();
    let nameMap = Map.empty<Text, Text>();
    for (ticket in repairTickets.values()) {
      for (p in ticket.partsReplaced.vals()) {
        switch (countMap.get(p.partNumber)) {
          case (?c) { countMap.add(p.partNumber, c + p.qty) };
          case (null) { countMap.add(p.partNumber, p.qty) };
        };
        nameMap.add(p.partNumber, p.partName);
      };
    };
    let entries = List.empty<(Text, Text, Nat)>();
    for ((pn, qty) in countMap.entries()) {
      let name = switch (nameMap.get(pn)) {
        case (?n) { n };
        case (null) { "" };
      };
      entries.add((pn, name, qty));
    };
    let arr = entries.toArray().sort(
      func(a : (Text, Text, Nat), b : (Text, Text, Nat)) : Order.Order {
        if (a.2 > b.2) { #less } else if (a.2 < b.2) { #greater } else { #equal };
      },
    );
    if (arr.size() <= topN) { arr } else {
      Array.tabulate(topN, func(i) { arr[i] });
    };
  };

  public query ({ caller }) func getTechnicianWorkload(technicianName : Text, startDate : Int, endDate : Int) : async (Nat, [RepairTicket]) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view reports");
    };
    let result = List.empty<RepairTicket>();
    for (ticket in repairTickets.values()) {
      if (
        ticket.technicianName == technicianName and
        ticket.repairStartDate >= startDate and
        ticket.repairStartDate <= endDate
      ) {
        result.add(ticket);
      };
    };
    let arr = result.toArray();
    (arr.size(), arr);
  };

  public query ({ caller }) func getRepairsExceedingYearlyLimit(limit : Nat, year : Int) : async [Asset] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view reports");
    };
    let nanosPerYear : Int = 365 * 86_400_000_000_000;
    let yearStart : Int = (year - 1970) * nanosPerYear;
    let yearEnd : Int = yearStart + nanosPerYear;
    let countMap = Map.empty<Text, Nat>();
    for (ticket in repairTickets.values()) {
      if (ticket.repairStartDate >= yearStart and ticket.repairStartDate < yearEnd) {
        switch (countMap.get(ticket.serialNumber)) {
          case (?c) { countMap.add(ticket.serialNumber, c + 1) };
          case (null) { countMap.add(ticket.serialNumber, 1) };
        };
      };
    };
    let result = List.empty<Asset>();
    for (asset in assets.values()) {
      switch (countMap.get(asset.serialNumber)) {
        case (?c) {
          if (c > limit) {
            result.add(asset);
          };
        };
        case (null) {};
      };
    };
    result.toArray();
  };

  // ── Search and Filter ─────────────────────────────────────────────────────

  public query ({ caller }) func searchBySerial(queryText : Text) : async [Asset] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can search assets");
    };
    let result = List.empty<Asset>();
    for (asset in assets.values()) {
      if (asset.serialNumber.contains(#text(queryText))) {
        result.add(asset);
      };
    };
    result.toArray();
  };

  public query ({ caller }) func filterAssets(model : ?Text, client : ?Text, status : ?AssetStatus) : async [Asset] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can filter assets");
    };
    let result = List.empty<Asset>();
    for (asset in assets.values()) {
      let modelMatch = switch (model) {
        case (?m) { asset.model == m };
        case (null) { true };
      };
      let clientMatch = switch (client) {
        case (?c) { asset.client == c };
        case (null) { true };
      };
      let statusMatch = switch (status) {
        case (?s) { assetStatusToText(asset.status) == assetStatusToText(s) };
        case (null) { true };
      };
      if (modelMatch and clientMatch and statusMatch) {
        result.add(asset);
      };
    };
    result.toArray();
  };

  public query ({ caller }) func filterRepairs(
    model : ?Text,
    client : ?Text,
    startDate : ?Int,
    endDate : ?Int,
    faultKeyword : ?Text,
  ) : async [RepairTicket] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can filter repairs");
    };
    let result = List.empty<RepairTicket>();
    for (ticket in repairTickets.values()) {
      let asset = assets.get(ticket.serialNumber);
      let modelMatch = switch (model, asset) {
        case (?m, ?a) { a.model == m };
        case (?_, null) { false };
        case (null, _) { true };
      };
      let clientMatch = switch (client, asset) {
        case (?c, ?a) { a.client == c };
        case (?_, null) { false };
        case (null, _) { true };
      };
      let startMatch = switch (startDate) {
        case (?sd) { ticket.dateReceived >= sd };
        case (null) { true };
      };
      let endMatch = switch (endDate) {
        case (?ed) { ticket.dateReceived <= ed };
        case (null) { true };
      };
      let keywordMatch = switch (faultKeyword) {
        case (?kw) {
          ticket.faultDescription.contains(#text(kw)) or
          ticket.diagnosis.contains(#text(kw));
        };
        case (null) { true };
      };
      if (modelMatch and clientMatch and startMatch and endMatch and keywordMatch) {
        result.add(ticket);
      };
    };
    result.toArray();
  };

  public query ({ caller }) func getAuditTrail(entityId : ?Text, startDate : ?Int, endDate : ?Int) : async [AuditEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view audit trail");
    };
    let result = List.empty<AuditEntry>();
    for (entry in auditEntries.values()) {
      let entityMatch = switch (entityId) {
        case (?eid) { entry.entityId == eid };
        case (null) { true };
      };
      let startMatch = switch (startDate) {
        case (?sd) { entry.timestamp >= sd };
        case (null) { true };
      };
      let endMatch = switch (endDate) {
        case (?ed) { entry.timestamp <= ed };
        case (null) { true };
      };
      if (entityMatch and startMatch and endMatch) {
        result.add(entry);
      };
    };
    result.toArray();
  };

  // ── App User Management (legacy) ──────────────────────────────────────────

  public shared ({ caller }) func addUser(user : AppUser) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add users");
    };
    appUsers.add(user.userId, user);
  };

  public query ({ caller }) func getUser(userId : Text) : async AppUser {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view user info");
    };
    switch (appUsers.get(userId)) {
      case (?user) { user };
      case (null) { Runtime.trap("User not found") };
    };
  };

  public query ({ caller }) func listUsers() : async [AppUser] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can list all users");
    };
    appUsers.values().toArray();
  };

  public shared ({ caller }) func updateUserRole(userId : Text, newRole : AppUserRole) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update user roles");
    };
    switch (appUsers.get(userId)) {
      case (?existingUser) {
        let updatedUser = {
          userId = existingUser.userId;
          name = existingUser.name;
          role = newRole;
        };
        appUsers.add(userId, updatedUser);
      };
      case (null) {
        Runtime.trap("User not found");
      };
    };
  };

  public query ({ caller }) func getCurrentUserRole(userId : Text) : async ?AppUserRole {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can query roles");
    };
    switch (appUsers.get(userId)) {
      case (?user) { ?user.role };
      case (null) { null };
    };
  };

  // ── Managed User Management (implementation plan) ─────────────────────────

  // login: No auth check needed - this is how users authenticate.
  // Returns a session token (username:role) on success, or an error.
  public shared func login(username : Text, password : Text) : async LoginResult {
    let hashedInput = hashPassword(password);
    for ((_, user) in managedUsers.entries()) {
      if (user.username == username and user.passwordHash == hashedInput) {
        let roleText = switch (user.role) {
          case (#Admin) { "Admin" };
          case (#User) { "User" };
        };
        return #ok("session_" # username # "_" # roleText # "_" # user.id.toText());
      };
    };
    #err("Invalid username or password");
  };

  // getUsers: Admin only
  public query ({ caller }) func getUsers() : async [ManagedUserPublic] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view all users");
    };
    let result = List.empty<ManagedUserPublic>();
    for ((_, user) in managedUsers.entries()) {
      result.add({
        id = user.id;
        username = user.username;
        role = user.role;
      });
    };
    result.toArray();
  };

  // createUser: Admin only
  public shared ({ caller }) func createUser(username : Text, password : Text, role : ManagedUserRole) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can create users");
    };
    // Check for duplicate username
    for ((_, existingUser) in managedUsers.entries()) {
      if (existingUser.username == username) {
        Runtime.trap("Username already exists");
      };
    };
    let newId = nextUserId;
    nextUserId += 1;
    let newUser : ManagedUser = {
      id = newId;
      username = username;
      passwordHash = hashPassword(password);
      role = role;
    };
    managedUsers.add(newId, newUser);
    newId;
  };

  // updateUser: Admin only
  public shared ({ caller }) func updateUser(id : Nat, username : Text, password : Text, role : ManagedUserRole) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update users");
    };
    switch (managedUsers.get(id)) {
      case (null) {
        Runtime.trap("User not found");
      };
      case (?existingUser) {
        // Check for duplicate username (excluding current user)
        for ((_, u) in managedUsers.entries()) {
          if (u.username == username and u.id != id) {
            Runtime.trap("Username already taken by another user");
          };
        };
        let updatedUser : ManagedUser = {
          id = existingUser.id;
          username = username;
          passwordHash = if (password.size() > 0) {
            hashPassword(password);
          } else {
            existingUser.passwordHash;
          };
          role = role;
        };
        managedUsers.add(id, updatedUser);
      };
    };
  };

  // deleteUser: Admin only
  public shared ({ caller }) func deleteUser(id : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can delete users");
    };
    // Prevent deleting the default admin (id=0)
    if (id == 0) {
      Runtime.trap("Cannot delete the default admin account");
    };
    switch (managedUsers.get(id)) {
      case (null) {
        Runtime.trap("User not found");
      };
      case (?_) {
        managedUsers.remove(id);
      };
    };
  };

  // ── Stage and Model Counts ────────────────────────────────────────────────

  public type StageCount = {
    awaitingParts : Nat;
    closed : Nat;
    deployed : Nat;
    diagnosing : Nat;
    programming : Nat;
    qaTesting : Nat;
    readyDeploy : Nat;
    received : Nat;
    repairing : Nat;
  };

  public type ModelCount = {
    vx680 : Nat;
    vx820 : Nat;
    m400 : Nat;
    carbon10 : Nat;
    carbon8 : Nat;
  };

  public query ({ caller }) func getStageCounts() : async StageCount {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can query stage counts");
    };
    var awaitingParts = 0;
    var closed = 0;
    var deployed = 0;
    var diagnosing = 0;
    var programming = 0;
    var qaTesting = 0;
    var readyDeploy = 0;
    var received = 0;
    var repairing = 0;

    for (ticket in repairTickets.values()) {
      switch (ticket.currentStage) {
        case ("Awaiting Parts") { awaitingParts += 1 };
        case ("Closed") { closed += 1 };
        case ("Deployed") { deployed += 1 };
        case ("Diagnosing") { diagnosing += 1 };
        case ("Programming") { programming += 1 };
        case ("QA Testing") { qaTesting += 1 };
        case ("Ready Deploy") { readyDeploy += 1 };
        case ("Received") { received += 1 };
        case ("Repairing") { repairing += 1 };
        case (_) {};
      };
    };
    {
      awaitingParts;
      closed;
      deployed;
      diagnosing;
      programming;
      qaTesting;
      readyDeploy;
      received;
      repairing;
    };
  };

  public query ({ caller }) func getDeviceModelCounts() : async ModelCount {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can query model counts");
    };
    let countMap = Map.empty<Text, Nat>();
    for (ticket in repairTickets.values()) {
      switch (countMap.get(ticket.serialNumber)) {
        case (?c) { countMap.add(ticket.serialNumber, c + 1) };
        case (null) { countMap.add(ticket.serialNumber, 1) };
      };
    };
    var vx680 = 0;
    var vx820 = 0;
    var m400 = 0;
    var carbon10 = 0;
    var carbon8 = 0;

    for (asset in assets.values()) {
      switch (countMap.get(asset.serialNumber)) {
        case (?count) {
          switch (asset.model) {
            case ("VX680") { vx680 += count };
            case ("VX820") { vx820 += count };
            case ("M400") { m400 += count };
            case ("Carbon 10") { carbon10 += count };
            case ("Carbon 8") { carbon8 += count };
            case (_) {};
          };
        };
        case (null) {};
      };
    };
    { vx680; vx820; m400; carbon10; carbon8 };
  };
};
