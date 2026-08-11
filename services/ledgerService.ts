import { Batch, BatchStatus, TraceEvent, User, UserRole, LogisticsUnit, VerificationRequest, VerificationStatus, PaymentDetails, GSTDetails, EWayBill, ReturnReason, Sector, ERPType, AuditLog, AuditObservation, EngagementLetter, PrintAuditRecord } from '../types';

const LEDGER_STORAGE_KEY = 'eledger_data';
const SSCC_STORAGE_KEY = 'eledger_sscc';
const AUDIT_STORAGE_KEY = 'eledger_audit_logs';
const AUDIT_OBS_STORAGE_KEY = 'eledger_audit_observations';
const ENGAGEMENT_STORAGE_KEY = 'eledger_engagements';
const PRINT_AUDIT_STORAGE_KEY = 'eledger_print_audits';
const DELAY_MS = 200;

/**
 * AWS NETWORK CONFIGURATION
 */
const getApiUrl = () => {
  // If hosted on AWS, we use relative paths (/api) handled by Nginx or Amplify
  const isProduction = typeof window !== 'undefined' && 
    (window.location.hostname.includes('amplifyapp.com') || 
     window.location.hostname.includes('compute.amazonaws.com') ||
     !['localhost', '127.0.0.1'].includes(window.location.hostname));

  if (isProduction) return '/api';
  return process.env.API_GATEWAY_URL || localStorage.getItem('ELEDGER_API_URL') || 'http://localhost:3001/api';
};

/**
 * Remote detection: If we are in the cloud, we MUST use the centralized DB.
 * However, for AI Studio preview environments (*.run.app), we default to local storage
 * unless explicitly configured otherwise, to prevent "AWS Centralized DB unreachable" errors.
 */
const isRemote = () => {
  if (typeof window === 'undefined') return false;
  
  // Explicit override
  if (localStorage.getItem('ELEDGER_USE_REMOTE') === 'true') return true;
  if (localStorage.getItem('ELEDGER_USE_REMOTE') === 'false') return false;

  // Check for known cloud environments that SHOULD use remote DB
  const isCloud = ['amplifyapp.com', 'compute.amazonaws.com'].some(d => window.location.hostname.includes(d));
  
  // Explicitly exclude AI Studio preview domains from "cloud" behavior by default
  if (window.location.hostname.includes('run.app')) return false;

  return isCloud;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const sha256 = async (message: string) => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

const getLedgerStateLocal = (): Batch[] => {
  try {
    const stored = localStorage.getItem(LEDGER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) { return []; }
};

const logAuditLocal = (gln: string, action: string, resourceId: string, details: string) => {
  try {
    const logs: AuditLog[] = JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || '[]');
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      userGLN: gln,
      action,
      resourceId,
      details
    };
    // Keep last 500 logs
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify([newLog, ...logs].slice(0, 500)));
  } catch (e) { console.error("Local audit log failed", e); }
};

export const LedgerService = {
  getBatches: async (user: User): Promise<Batch[]> => {
    if (isRemote()) {
      try {
        const res = await fetch(`${getApiUrl()}/batches?gln=${user.gln}&role=${user.role}`);
        if (res.ok) return await res.json();
      } catch (e) {
        console.error("AWS Centralized DB unreachable.");
      }
    }
    
    // Fallback to local only if not in cloud
    await delay(DELAY_MS);
    const allBatches = getLedgerStateLocal();

    // REGULATOR: sees everything across the network
    if (user.role === UserRole.REGULATOR) {
      return allBatches;
    }

    // AUDITOR / CA: only sees batches of firms where an ACTIVE engagement letter exists
    if (user.role === UserRole.AUDITOR) {
      const engagements = await LedgerService.getEngagementLetters(user);
      const activeEngagements = engagements.filter(e => e.status === 'ACTIVE' && (e.auditorGLN === user.gln || e.auditorId === user.id));
      const engagedGLNs = activeEngagements.map(e => e.firmGLN);

      // If no engagements, return empty list (RBAC Enforced)
      if (engagedGLNs.length === 0) return [];

      return allBatches.filter(b => 
        engagedGLNs.includes(b.manufacturerGLN) ||
        engagedGLNs.includes(b.currentOwnerGLN) ||
        engagedGLNs.includes(b.intendedRecipientGLN) ||
        b.trace.some(t => engagedGLNs.includes(t.actorGLN))
      );
    }

    // Standard Supply Chain Nodes
    return allBatches.filter(b => 
      b.currentOwnerGLN === user.gln || 
      b.intendedRecipientGLN === user.gln || 
      b.trace.some(t => t.actorGLN === user.gln)
    );
  },

  getEngagementLetters: async (user?: User): Promise<EngagementLetter[]> => {
    await delay(DELAY_MS);
    const stored = localStorage.getItem(ENGAGEMENT_STORAGE_KEY);
    if (stored) {
      const parsed: EngagementLetter[] = JSON.parse(stored);
      if (user && user.role === UserRole.AUDITOR) {
        return parsed.filter(e => e.auditorGLN === user.gln || e.auditorId === user.id);
      }
      if (user && user.role !== UserRole.REGULATOR) {
        return parsed.filter(e => e.firmGLN === user.gln || e.auditorGLN === user.gln);
      }
      return parsed;
    }

    // Seed default Engagement Letters
    const defaultEngagements: EngagementLetter[] = [
      {
        id: 'ENG-2026-001',
        smartContractAddress: '0x8f3c71a9b24e0513982e442a8b9f123456789abc',
        auditorId: 'AUD-001',
        auditorName: 'CA Rajesh Varma',
        auditorGLN: '0890009988776',
        auditorFirm: 'Varma & Associates Chartered Accountants',
        caMembershipNo: 'ICAI-512890',
        firmId: 'MFG-001',
        firmName: 'Global Life Sciences Corp',
        firmGLN: '0890001234567',
        scope: 'FULL_STATUTORY_AUDIT',
        status: 'ACTIVE',
        validFrom: '2026-01-01',
        validTo: '2026-12-31',
        contractHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        terms: 'Statutory Financial & GxP Quality Audit authorization under Section 143 of the Companies Act 2013 and CDSCO Track & Trace guidelines. Grants read-only inspection rights to ledger batches, e-Way bills, tax invoices, and CoAs.',
        createdDate: '2026-01-01T09:00:00Z',
        auditorSignedAt: '2026-01-01T09:15:00Z',
        firmSignedAt: '2026-01-01T10:00:00Z'
      },
      {
        id: 'ENG-2026-002',
        smartContractAddress: '0x7a2d81f8c33a1102947e551b9d8e987654321def',
        auditorId: 'AUD-001',
        auditorName: 'CA Rajesh Varma',
        auditorGLN: '0890009988776',
        auditorFirm: 'Varma & Associates Chartered Accountants',
        caMembershipNo: 'ICAI-512890',
        firmId: 'DIST-001',
        firmName: 'Apex Pharma Distributors',
        firmGLN: '0890002345678',
        scope: 'GST_TAX_RECONCILIATION',
        status: 'PROPOSED',
        validFrom: '2026-04-01',
        validTo: '2027-03-31',
        contractHash: 'a71e89f81d9b4b0a218f4302911c7d23a1098871abf21039845722cfa098110b',
        terms: 'Quarterly GST ITC reconciliation and GSTR-2B validation engagement.',
        createdDate: '2026-02-01T11:30:00Z',
        auditorSignedAt: '2026-02-01T11:30:00Z'
      }
    ];

    localStorage.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify(defaultEngagements));
    return defaultEngagements;
  },

  createEngagementLetter: async (data: Partial<EngagementLetter>, actor: User): Promise<EngagementLetter> => {
    await delay(DELAY_MS);
    const stored = localStorage.getItem(ENGAGEMENT_STORAGE_KEY);
    const list: EngagementLetter[] = stored ? JSON.parse(stored) : [];

    const newEngagement: EngagementLetter = {
      id: `ENG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      smartContractAddress: `0x${Math.random().toString(16).substring(2, 42).padEnd(40, '0')}`,
      auditorId: actor.id,
      auditorName: actor.name,
      auditorGLN: actor.gln,
      auditorFirm: actor.caFirmName || actor.orgName || 'Independent CA Firm',
      caMembershipNo: actor.membershipNumber || 'ICAI-REG-PENDING',
      firmId: data.firmId || 'UNKNOWN_FIRM',
      firmName: data.firmName || 'Client Entity',
      firmGLN: data.firmGLN || '',
      scope: data.scope || 'FULL_STATUTORY_AUDIT',
      status: 'PROPOSED',
      validFrom: data.validFrom || new Date().toISOString().split('T')[0],
      validTo: data.validTo || `${new Date().getFullYear() + 1}-03-31`,
      contractHash: Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2),
      terms: data.terms || 'Standard CA Audit Engagement Terms under Indian Companies Act 2013 and GxP Traceability Regulations.',
      createdDate: new Date().toISOString(),
      auditorSignedAt: new Date().toISOString()
    };

    list.unshift(newEngagement);
    localStorage.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify(list));

    logAuditLocal(
      actor.gln,
      'SMART_CONTRACT_ENGAGEMENT_PROPOSED',
      newEngagement.id,
      `CA Auditor initiated Smart Contract Engagement Letter ${newEngagement.id} for client firm ${newEngagement.firmName} (${newEngagement.firmGLN}).`
    );

    return newEngagement;
  },

  signEngagementLetter: async (engagementId: string, actor: User): Promise<EngagementLetter> => {
    await delay(DELAY_MS);
    const stored = localStorage.getItem(ENGAGEMENT_STORAGE_KEY);
    const list: EngagementLetter[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex(e => e.id === engagementId);

    if (index === -1) throw new Error("Engagement letter not found");

    const item = list[index];
    item.status = 'ACTIVE';
    item.firmSignedAt = new Date().toISOString();

    list[index] = item;
    localStorage.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify(list));

    logAuditLocal(
      actor.gln,
      'SMART_CONTRACT_ENGAGEMENT_EXECUTED',
      item.id,
      `Smart Contract Engagement ${item.id} executed on-chain (${item.smartContractAddress}). Read-only audit access granted to CA ${item.auditorName}.`
    );

    return item;
  },

  terminateEngagementLetter: async (engagementId: string, actor: User): Promise<boolean> => {
    await delay(DELAY_MS);
    const stored = localStorage.getItem(ENGAGEMENT_STORAGE_KEY);
    const list: EngagementLetter[] = stored ? JSON.parse(stored) : [];
    const index = list.findIndex(e => e.id === engagementId);

    if (index === -1) return false;

    list[index].status = 'TERMINATED';
    localStorage.setItem(ENGAGEMENT_STORAGE_KEY, JSON.stringify(list));

    logAuditLocal(
      actor.gln,
      'SMART_CONTRACT_ENGAGEMENT_TERMINATED',
      engagementId,
      `Engagement Letter ${engagementId} terminated on-chain. Read-only audit access revoked.`
    );

    return true;
  },

  getAuditLogs: async (user: User): Promise<AuditLog[]> => {
    if (isRemote()) {
      try {
        const res = await fetch(`${getApiUrl()}/audit/logs?role=${user.role}&gln=${user.gln}`);
        if (res.ok) return await res.json();
      } catch (e) { console.error("Audit fetch failed", e); }
    }
    const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
    const logs = stored ? JSON.parse(stored) : [];
    // Filter locally if not regulator
    if (user.role !== UserRole.REGULATOR && user.role !== UserRole.AUDITOR) {
        return logs.filter((l: AuditLog) => l.userGLN === user.gln);
    }
    return logs;
  },

  exportLedger: async (): Promise<Batch[]> => {
    if (isRemote()) {
       try {
         const res = await fetch(`${getApiUrl()}/batches?role=AUDITOR`); 
         if (res.ok) return await res.json();
       } catch (e) {}
    }
    return getLedgerStateLocal();
  },

  getBatchByID: async (batchID: string): Promise<Batch | undefined> => {
    if (isRemote()) {
      try {
        const res = await fetch(`${getApiUrl()}/batches/${batchID}`);
        if (res.ok) return await res.json();
      } catch(e) {}
    }
    return getLedgerStateLocal().find(b => b.batchID === batchID);
  },

  createBatch: async (batchData: Partial<Batch>, actor: User): Promise<string> => {
    const timestamp = new Date().toISOString();
    const identityString = `${batchData.gtin}-${batchData.lotNumber}-${actor.gln}-${timestamp}`;
    const genesisHash = await sha256(identityString);
    const batchID = `BATCH-${Date.now()}`;
    const blockchainId = `BLK-${genesisHash.substring(0,12)}`;

    const newBatch: Batch = {
      ...batchData as Batch,
      batchID,
      blockchainId,
      genesisHash,
      manufacturerGLN: actor.gln,
      currentOwnerGLN: actor.gln,
      status: batchData.status || BatchStatus.BONDED,
      integrityHash: genesisHash,
      trace: [{
        eventID: `evt-${Date.now()}`,
        type: 'MANUFACTURE',
        timestamp,
        actorGLN: actor.gln,
        actorName: actor.orgName,
        location: 'Production Unit',
        txHash: genesisHash,
        previousHash: '0'.repeat(64),
        metadata: { note: 'Genesis Block Created on AWS Node' }
      }]
    };

    if (isRemote()) {
      const res = await fetch(`${getApiUrl()}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBatch)
      });
      if (!res.ok) throw new Error("Cloud write failed");
      return batchID;
    }
    
    const local = getLedgerStateLocal();
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify([newBatch, ...local]));
    
    logAuditLocal(actor.gln, 'CREATE_BATCH', batchID, `Genesis Hash: ${genesisHash.substring(0,8)}...`);
    
    return batchID;
  },

  updateBatch: async (batch: Batch, newEvent: TraceEvent) => {
    const updatedBatch = { ...batch, trace: [...batch.trace, newEvent] };

    if (isRemote()) {
      await fetch(`${getApiUrl()}/batches/${batch.batchID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedBatch)
      });
      return updatedBatch;
    }
    
    const local = getLedgerStateLocal();
    const idx = local.findIndex(b => b.batchID === batch.batchID);
    if (idx !== -1) {
      local[idx] = updatedBatch;
      localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(local));
      
      logAuditLocal(newEvent.actorGLN, newEvent.type, batch.batchID, `TxHash: ${newEvent.txHash.substring(0,8)}...`);
    }
    return updatedBatch;
  },

  checkPOSStatus: async (batchID: string, gln: string): Promise<{status: 'VALID' | 'INVALID' | 'DUPLICATE', message: string}> => {
      const batch = await LedgerService.getBatchByID(batchID);
      if(!batch) return { status: 'INVALID', message: 'Not found in E-Ledger Network.' };
      if(batch.status === BatchStatus.SOLD) return { status: 'DUPLICATE', message: 'Anti-Counterfeit: Item already dispensed.' };
      return { status: 'VALID', message: 'Identity Verified.' };
  },

  receiveBatch: async (batchID: string, actor: User): Promise<Batch> => {
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) throw new Error("Batch not found");

    const receiveEvent: TraceEvent = {
      eventID: `evt-${Date.now()}`,
      type: 'RECEIVE',
      timestamp: new Date().toISOString(),
      actorGLN: actor.gln,
      actorName: actor.orgName,
      location: 'Inbound Warehouse',
      txHash: await sha256(`REC:${batchID}:${Date.now()}`),
      previousHash: batch.trace[batch.trace.length-1].txHash
    };

    const updated = { ...batch, currentOwnerGLN: actor.gln, status: BatchStatus.RECEIVED };
    return await LedgerService.updateBatch(updated, receiveEvent);
  },

  sellBatch: async (batchID: string, actor: User): Promise<Batch> => {
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) throw new Error("Batch not found");

    const saleEvent: TraceEvent = {
      eventID: `evt-${Date.now()}`,
      type: 'SALE',
      timestamp: new Date().toISOString(),
      actorGLN: actor.gln,
      actorName: actor.orgName,
      location: 'Point of Sale',
      txHash: await sha256(`SALE:${batchID}:${Date.now()}`),
      previousHash: batch.trace[batch.trace.length-1].txHash,
      metadata: { amount: batch.taxableValue }
    };

    const updated = { ...batch, status: BatchStatus.SOLD };
    return await LedgerService.updateBatch(updated, saleEvent);
  },

  recallBatch: async (batchID: string, reason: string, actor: User): Promise<boolean> => {
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) return false;
    const recallEvent: TraceEvent = {
      eventID: `evt-${Date.now()}`,
      type: 'RECALL',
      timestamp: new Date().toISOString(),
      actorGLN: actor.gln,
      actorName: actor.orgName,
      location: 'Regulatory Office',
      txHash: await sha256(`RECALL:${batchID}`),
      previousHash: batch.trace[batch.trace.length-1].txHash,
      metadata: { reason }
    };
    await LedgerService.updateBatch({ ...batch, status: BatchStatus.RECALLED }, recallEvent);
    logAuditLocal(actor.gln, 'RECALL', batchID, `Reason: ${reason}`);
    return true;
  },

  getLogisticsUnits: async (user: User) => {
      const stored = localStorage.getItem(SSCC_STORAGE_KEY);
      const units: LogisticsUnit[] = stored ? JSON.parse(stored) : [];
      return units.filter(u => u.creatorGLN === user.gln);
  },

  createLogisticsUnit: async (sscc: string, batchIDs: string[], user: User) => {
      const stored = localStorage.getItem(SSCC_STORAGE_KEY);
      const units: LogisticsUnit[] = stored ? JSON.parse(stored) : [];
      const newUnit: LogisticsUnit = {
          sscc,
          creatorGLN: user.gln,
          status: 'CREATED',
          contents: batchIDs,
          createdDate: new Date().toISOString(),
          txHash: await sha256(sscc + Date.now())
      };
      localStorage.setItem(SSCC_STORAGE_KEY, JSON.stringify([newUnit, ...units]));
      logAuditLocal(user.gln, 'SSCC_CREATE', sscc, `Items: ${batchIDs.length}`);
      return sscc;
  },

  verifyByHash: async (hash: string) => undefined,
  submitVerificationRequest: async (g:string, l:string, r:User) => ({} as any),
  getVerificationHistory: async (u: User) => [],
  
  transferBatches: async (ids: string[], to: string, name: string, u: User, gst?: GSTDetails, ewbPartial?: Partial<EWayBill>, payment?: any, exportDetails?: any, stakeholders?: any[]) => {
    for (const id of ids) {
        const batch = await LedgerService.getBatchByID(id);
        if (!batch) continue;
        if (batch.currentOwnerGLN !== u.gln) continue;

        // Generate e-Pass for Excise sector
        const isExcise = u.sector === Sector.EXCISE;
        const ePassNo = isExcise ? `EPASS-${Date.now()}-${Math.floor(Math.random() * 1000)}` : undefined;

        const dispatchEvent: TraceEvent = {
            eventID: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: 'DISPATCH',
            timestamp: new Date().toISOString(),
            actorGLN: u.gln,
            actorName: u.orgName,
            location: u.country === 'IN' ? 'Outbound Dock' : 'Distribution Center',
            txHash: await sha256(`DISPATCH:${id}:${to}:${Date.now()}`),
            previousHash: batch.trace[batch.trace.length - 1]?.txHash || batch.genesisHash,
            ePassNo,
            vehicleNo: ewbPartial?.vehicleNo,
            metadata: {
                recipient: name,
                recipientGLN: to,
                gst,
                ewayBill: ewbPartial ? { ...ewbPartial, generatedDate: new Date().toISOString() } : undefined,
                ePassNo,
                paymentStatus: payment?.status,
                exportDetails,
                stakeholders
            }
        };

        const updatedBatch: Batch = {
            ...batch,
            status: BatchStatus.IN_TRANSIT,
            intendedRecipientGLN: to
        };

        await LedgerService.updateBatch(updatedBatch, dispatchEvent);
    }
    return true;
  },

  reportBreakage: async (batchID: string, reason: string, evidence: string, actor: User): Promise<boolean> => {
    const batch = await LedgerService.getBatchByID(batchID);
    if (!batch) return false;

    const breakageEvent: TraceEvent = {
      eventID: `evt-${Date.now()}`,
      type: 'BREAKAGE_REPORTED',
      timestamp: new Date().toISOString(),
      actorGLN: actor.gln,
      actorName: actor.orgName,
      location: 'Warehouse / Transit',
      txHash: await sha256(`BREAKAGE:${batchID}:${Date.now()}`),
      previousHash: batch.trace[batch.trace.length-1].txHash,
      metadata: { reason, evidence }
    };

    const updated = { ...batch, status: BatchStatus.DESTROYED };
    await LedgerService.updateBatch(updated, breakageEvent);
    logAuditLocal(actor.gln, 'BREAKAGE_REPORTED', batchID, `Reason: ${reason}`);
    return true;
  },

  returnBatch: async (id: string, to: string, r: ReturnReason, q: number, u: User, refund?: number) => {
      const batch = await LedgerService.getBatchByID(id);
      if (!batch) return false;
      const returnEvent: TraceEvent = {
          eventID: `evt-${Date.now()}`,
          type: 'RETURN',
          timestamp: new Date().toISOString(),
          actorGLN: u.gln,
          actorName: u.orgName,
          location: 'Returns Dept',
          txHash: await sha256(`RET:${id}:${to}`),
          previousHash: batch.trace[batch.trace.length-1].txHash,
          returnReason: r,
          returnQuantity: q,
          returnRecipientGLN: to,
          metadata: { refundAmount: refund, returnTo: to, reason: r }
      };
      
      const newStatus = r === ReturnReason.RECALLED ? BatchStatus.RECALLED : BatchStatus.RETURNED;
      const updated = { ...batch, status: newStatus, totalReturnedQuantity: (batch.totalReturnedQuantity || 0) + q };
      await LedgerService.updateBatch(updated, returnEvent);
      return true;
  },

  getPrintAudits: async (): Promise<PrintAuditRecord[]> => {
    await delay(50);
    const stored = localStorage.getItem(PRINT_AUDIT_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    const defaultPrintAudits: PrintAuditRecord[] = [
      {
        id: 'PRT-2026-881920',
        timestamp: '2026-08-11T09:15:30Z',
        printedByGLN: '0890001234567',
        printedByName: 'Dr. Ananya Sharma',
        printedByRole: 'MANUFACTURER',
        printedByOrg: 'Global Life Sciences Corp',
        docType: 'TAX_INVOICE',
        docId: 'INV-2024-001',
        docTitle: 'Tax Invoice #INV-2024-001',
        signature: '0x8f3c71a9b24e0513982e442a8b9f123456789abc'
      },
      {
        id: 'PRT-2026-773411',
        timestamp: '2026-08-10T14:40:12Z',
        printedByGLN: '0890002345678',
        printedByName: 'Vikram Mehta',
        printedByRole: 'DISTRIBUTOR',
        printedByOrg: 'Apex Pharma Distributors',
        docType: 'SSCC_LOGISTICS_PASS',
        docId: '108900023456780001',
        docTitle: 'SSCC Logistics Pallet Pass',
        signature: '0x7a2d81f8c33a1102947e551b9d8e987654321def'
      }
    ];
    localStorage.setItem(PRINT_AUDIT_STORAGE_KEY, JSON.stringify(defaultPrintAudits));
    return defaultPrintAudits;
  },

  getPrintAuditByID: async (printId: string): Promise<PrintAuditRecord | undefined> => {
    const audits = await LedgerService.getPrintAudits();
    const clean = printId.trim().toUpperCase();
    return audits.find(a => 
      a.id.toUpperCase() === clean || 
      clean.includes(a.id.toUpperCase()) || 
      a.docId.toUpperCase() === clean
    );
  },

  createPrintAuditRecord: async (
    actor: { gln: string; name: string; role: string; orgName: string },
    docType: PrintAuditRecord['docType'],
    docId: string,
    docTitle?: string
  ): Promise<PrintAuditRecord> => {
    const audits = await LedgerService.getPrintAudits();
    
    // Return existing recent record for same docId to avoid duplicate IDs during quick re-renders
    const existing = audits.find(a => a.docId === docId && a.printedByGLN === actor.gln && (Date.now() - new Date(a.timestamp).getTime()) < 60000);
    if (existing) {
      return existing;
    }

    const randHex = Math.floor(0x100000 + Math.random() * 0x8fffff).toString(16).toUpperCase();
    const printId = `PRT-2026-${randHex}`;
    const timestamp = new Date().toISOString();
    const sigMessage = `${printId}:${actor.gln}:${docType}:${docId}:${timestamp}`;
    const signature = `0x${await sha256(sigMessage)}`;

    const newRecord: PrintAuditRecord = {
      id: printId,
      timestamp,
      printedByGLN: actor.gln || '0890000000000',
      printedByName: actor.name || 'Authorized Operator',
      printedByRole: actor.role || 'OPERATOR',
      printedByOrg: actor.orgName || 'Licensed Entity Node',
      docType,
      docId,
      docTitle: docTitle || `${docType.replace(/_/g, ' ')} #${docId}`,
      signature
    };

    audits.unshift(newRecord);
    localStorage.setItem(PRINT_AUDIT_STORAGE_KEY, JSON.stringify(audits));

    logAuditLocal(
      actor.gln,
      'DOCUMENT_PRINTED',
      docId,
      `Print Audit ID: ${printId} | Operator: ${actor.name} (${actor.gln}) | Doc: ${docType} #${docId}`
    );

    return newRecord;
  }
};