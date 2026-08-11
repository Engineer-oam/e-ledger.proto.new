

import { CountryConfig, Sector, UserRole, User, Batch, ERPType } from './types';

// Default roles for sectors to apply to all countries
const DEFAULT_EXCISE_ROLES = [
  { role: UserRole.DISTILLERY, label: 'Distillery / Producer', description: 'Production and manufacturing node for spirits' },
  { role: UserRole.BREWERY, label: 'Brewery', description: 'Production and manufacturing node for beer' },
  { role: UserRole.WHOLESALER, label: 'Wholesale Licensee (L-1 / FL-1)', description: 'Bulk storage and logistics hub' },
  { role: UserRole.RETAIL_VEND, label: 'Retail Vend', description: 'Point of sale to consumers (Liquor Shop)' },
  { role: UserRole.BAR_RESTAURANT, label: 'Bar / Restaurant', description: 'On-premise consumption' },
  { role: UserRole.STATE_EXCISE_COMMISSIONER, label: 'State Excise Commissioner', description: 'State-level government oversight and tax enforcement' },
  { role: UserRole.DISTRICT_EXCISE_OFFICER, label: 'District Excise Officer', description: 'District-level enforcement and monitoring' },
  { role: UserRole.AUDITOR, label: 'Excise & Tax Auditor', description: 'Statutory Revenue, Duty & Supply Chain Audit Agency' }
];

// Updated for Global Pharma Structure
const DEFAULT_PHARMA_ROLES = [
  { role: UserRole.MANUFACTURER, label: 'Manufacturer / Marketer', description: 'Own Manufacturing, Contract Mfg, or Third Party' },
  { role: UserRole.CF_AGENT, label: 'C&F Agent', description: 'Carrying and Forwarding Agent' },
  { role: UserRole.SUPER_STOCKIST, label: 'Super Stockist', description: 'Primary bulk distribution node' },
  { role: UserRole.STOCKIST, label: 'Stockist', description: 'Regional distribution node' },
  { role: UserRole.SUB_STOCKIST, label: 'Sub-Stockist', description: 'Secondary distribution node' },
  { role: UserRole.PHARMACIST, label: 'Registered Pharmacist', description: 'Retail or Hospital Pharmacist (PCI Registered)' },
  { role: UserRole.CDSCO_OFFICIAL, label: 'CDSCO Regulator', description: 'Central Drugs Standard Control Organization' },
  { role: UserRole.SLA_OFFICIAL, label: 'State Licensing Authority', description: 'State Drug Control Department' },
  { role: UserRole.NPPA_OFFICIAL, label: 'NPPA Official', description: 'National Pharmaceutical Pricing Authority' },
  { role: UserRole.AUDITOR, label: 'GxP / Financial Auditor', description: 'Statutory GxP Quality, Financial & Supply Chain Auditor' }
];

const DEFAULT_FMCG_ROLES = [
  { role: UserRole.MANUFACTURER, label: 'FMCG Plant', description: 'High-volume consumer goods production' },
  { role: UserRole.DISTRIBUTOR, label: 'Distribution Center', description: 'Primary logistics and sortation' },
  { role: UserRole.RETAILER, label: 'Retail Chain / Store', description: 'Consumer marketplace' },
  { role: UserRole.REGULATOR, label: 'Standards Authority', description: 'Consumer protection and standards' },
  { role: UserRole.AUDITOR, label: 'Quality & Tax Auditor', description: 'Supply chain integrity and financial audit' }
];

const DEFAULT_AGRI_ROLES = [
  { role: UserRole.MANUFACTURER, label: 'Farmer / Aggregator', description: 'Cultivation and primary processing' },
  { role: UserRole.DISTRIBUTOR, label: 'Mandi / Wholesaler', description: 'Market yard and bulk distribution' },
  { role: UserRole.RETAILER, label: 'Retailer / Exporter', description: 'Consumer sales or export house' },
  { role: UserRole.REGULATOR, label: 'APEDA / Board', description: 'Agricultural export authority' },
  { role: UserRole.INSPECTION_AGENCY, label: 'Phytosanitary Inspector', description: 'Quality and pest control certification' },
  { role: UserRole.AUDITOR, label: 'Agricultural Supply Chain Auditor', description: 'Traceability and organic certification auditor' }
];

const DEFAULT_TEXTILE_ROLES = [
  { role: UserRole.MANUFACTURER, label: 'Mill / Garment Unit', description: 'Spinning, weaving, or garmenting' },
  { role: UserRole.DISTRIBUTOR, label: 'Sourcing Agent', description: 'Buying house or logistics hub' },
  { role: UserRole.RETAILER, label: 'Brand / Retailer', description: 'Fashion brand or retail chain' },
  { role: UserRole.REGULATOR, label: 'Textile Committee', description: 'Quality and origin certification' },
  { role: UserRole.INSPECTION_AGENCY, label: 'Quality Auditor', description: 'Fabric and labor standard audit' },
  { role: UserRole.AUDITOR, label: 'Compliance & ESG Auditor', description: 'Social compliance and supply chain auditor' }
];

const DEFAULT_GENERAL_ROLES = [
  { role: UserRole.MANUFACTURER, label: 'Exporter / Producer', description: 'Goods manufacturer' },
  { role: UserRole.DISTRIBUTOR, label: 'Logistics Provider', description: 'Freight forwarder or 3PL' },
  { role: UserRole.RETAILER, label: 'Importer / Buyer', description: 'Overseas buyer or distributor' },
  { role: UserRole.REGULATOR, label: 'Customs / DGFT', description: 'Trade compliance authority' },
  { role: UserRole.FINANCIER, label: 'Trade Bank', description: 'Letter of Credit and trade finance' },
  { role: UserRole.AUDITOR, label: 'Statutory & Systems Auditor', description: 'Independent supply chain and ledger auditor' }
];

export const PHARMA_SUB_CATEGORIES = [
  'Active Ingredients (API)',
  'Formulations (FDF)',
  'Contract Manufacturer',
  'Third Party Manufacturing',
  'Logistics Provider',
  'Super Stockist',
  'Wholesale Distributor',
  'Franchise Partner',
  'Retail Pharmacy',
  'Hospital Pharmacy',
  'Community Health Center',
  'Online Pharmacy',
  'Cold Chain Logistics',
  'GxP Quality Audit',
  'Financial & Tax Audit',
  'Serialization & SGTIN Audit'
];

export const EXCISE_SUB_CATEGORIES = [
  'IMFL (Indian Made Foreign Liquor)',
  'Country Liquor (CL)',
  'Beer',
  'Wine',
  'BIO (Bottled In Origin)',
  'RTD (Ready to Drink)',
  'ENA (Extra Neutral Alcohol)',
  'Rectified Spirit (RS)',
  'Denatured Spirit',
  'Revenue & Tax Audit',
  'Proof Liters Reconciliation'
];

const createCountry = (code: string, name: string): CountryConfig => ({
  code,
  name,
  sectors: {
    [Sector.PHARMA]: { roles: DEFAULT_PHARMA_ROLES },
    [Sector.EXCISE]: { roles: DEFAULT_EXCISE_ROLES },
    [Sector.FMCG]: { roles: DEFAULT_FMCG_ROLES },
    [Sector.AGRICULTURE]: { roles: DEFAULT_AGRI_ROLES },
    [Sector.TEXTILE]: { roles: DEFAULT_TEXTILE_ROLES },
    [Sector.GENERAL]: { roles: DEFAULT_GENERAL_ROLES }
  }
});

export const REGISTRY_CONFIG: CountryConfig[] = [
  createCountry('GL', 'Global Trade Zone'),
  createCountry('IN', 'India'),
  createCountry('US', 'United States'),
  createCountry('EU', 'European Union'),
];

export const MOCK_USERS: User[] = [
  {
    id: 'user-mfg-01',
    name: 'Dr. Robert Chen',
    role: UserRole.MANUFACTURER,
    gln: '0890001234567',
    orgName: 'Global Life Sciences Corp',
    country: 'GL',
    sector: Sector.PHARMA,
    positionLabel: 'Manufacturer / Marketer',
    erpType: ERPType.MANUAL,
    erpStatus: 'CONNECTED',
    subCategories: ['Formulations (FDF)', 'Contract Manufacturer']
  },
  {
    id: 'user-audit-01',
    name: 'CA Rajesh Varma',
    role: UserRole.AUDITOR,
    gln: '0890009988776',
    orgName: 'National GxP & Tax Audit Bureau',
    country: 'IN',
    sector: Sector.PHARMA,
    positionLabel: 'GxP / Financial Auditor',
    erpType: ERPType.MANUAL,
    erpStatus: 'CONNECTED',
    subCategories: ['GxP Quality Audit', 'Financial & Tax Audit', 'Serialization & SGTIN Audit'],
    drugLicenseNo: 'AUD-NABL-2026-991',
    gstin: '27AABCN8899Z1Z4'
  }
];

export const INITIAL_BATCHES: Batch[] = [];