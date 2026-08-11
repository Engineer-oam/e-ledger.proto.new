import React, { useState, useMemo } from 'react';
import { AuthService } from '../services/authService';
import { UserRole, Sector, ERPType } from '../types';
import { REGISTRY_CONFIG } from '../constants';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UserCircle, Building2, ShieldCheck, Cpu, ArrowRight, ArrowLeft, Check, Lock,
  FileText, ClipboardCheck, Landmark, Globe, CheckCircle2, ChevronRight, Stethoscope, Factory, Truck, Store
} from 'lucide-react';
import Logo from './Logo';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: '',
    email: '',
    age: '32',
    gender: 'Female',
    phone: '',

    // Step 2: Operational Role
    sector: Sector.PHARMA,
    role: UserRole.MANUFACTURER,
    positionLabel: 'Pharma Manufacturer Node',
    country: 'IN',

    // Step 3: Legal Identity
    orgName: '',
    gstin: '27AAPCA1234A1Z5',
    gln: '',
    drugLicenseNo: '',
    pharmacistRegNo: '',
    caFirmName: '',
    membershipNumber: '',
    departmentName: '',
    officerDesignation: '',
    state: 'Maharashtra',
    address: '',

    // Step 4: System Link
    erpType: ERPType.MANUAL,
    password: '',
    confirmPassword: '',
    publicKey: ''
  });

  // Calculate Available Roles based on selected Sector
  const availableRoles = useMemo(() => {
    if (formData.sector === Sector.PHARMA) {
      return [
        { role: UserRole.MANUFACTURER, label: 'Pharma Manufacturer', desc: 'Primary Drug Serialization & Batch Issuance', icon: Factory },
        { role: UserRole.DISTRIBUTOR, label: 'Wholesale Distributor & 3PL', desc: 'SSCC Aggregation & Logistics Distribution', icon: Truck },
        { role: UserRole.RETAILER, label: 'Pharmacy & Hospital Retailer', desc: 'Point of Sale & Patient Dispensing Verification', icon: Store },
        { role: UserRole.AUDITOR, label: 'CA & Statutory Auditor', desc: 'Smart Contract Governed Read-Only Audit Access', icon: Landmark },
        { role: UserRole.REGULATOR, label: 'CDSCO & State Licensing Authority', desc: 'Regulatory Oversight & Recall Orders', icon: ShieldCheck },
      ];
    } else if (formData.sector === Sector.EXCISE) {
      return [
        { role: UserRole.DISTILLERY, label: 'Distillery & Bottler', desc: 'Excise Bottling & Pass Serial Generation', icon: Factory },
        { role: UserRole.BONDED_WAREHOUSE, label: 'Bonded Warehouse', desc: 'Inter-State Stock Transit & Permit Clearance', icon: Truck },
        { role: UserRole.EXCISE_OFFICIAL, label: 'State Excise Officer', desc: 'Tax Duty Verification & E-Pass Auditing', icon: ShieldCheck },
        { role: UserRole.AUDITOR, label: 'CA & Tax Auditor', desc: 'Audit & GST/Excise Duty Reconciliation', icon: Landmark },
      ];
    } else {
      return [
        { role: UserRole.MANUFACTURER, label: 'FMCG Manufacturer', desc: 'Consumer Goods Serialization & Parent-Child Packing', icon: Factory },
        { role: UserRole.DISTRIBUTOR, label: 'Distribution Partner', desc: 'Warehouse Logistics & Dispatch Verification', icon: Truck },
        { role: UserRole.AUDITOR, label: 'CA & Financial Auditor', desc: 'Financial & Supply Chain Audit', icon: Landmark },
      ];
    }
  }, [formData.sector]);

  // Generate random GLN if empty
  const generateRandomGLN = () => {
    const gln = '089' + Math.floor(100000000 + Math.random() * 900000000);
    setFormData(prev => ({ ...prev, gln }));
  };

  // Generate random Cryptographic Key
  const generateKey = () => {
    const key = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setFormData(prev => ({ ...prev, publicKey: key }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNextStep = () => {
    setError('');
    
    // Step 1 Validation
    if (currentStep === 1) {
      if (!formData.name.trim()) return setError('Please enter your full name.');
      if (!formData.email.trim()) return setError('Please enter a valid email address.');
    }

    // Step 2 Validation
    if (currentStep === 2) {
      if (!formData.role) return setError('Please select an operational role.');
    }

    // Step 3 Validation
    if (currentStep === 3) {
      if (formData.role === UserRole.AUDITOR) {
        if (!formData.caFirmName.trim()) return setError('Please enter your CA Firm Name.');
        if (!formData.membershipNumber.trim()) return setError('Please enter your ICAI Membership Number.');
      } else if (formData.role === UserRole.REGULATOR) {
        if (!formData.departmentName.trim()) return setError('Please enter your Regulatory Department Name.');
      } else {
        if (!formData.orgName.trim()) return setError('Please enter your Organization / Business Name.');
      }

      if (!formData.gln.trim()) {
        generateRandomGLN();
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setError('');
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters long.');
    }
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    try {
      const glnToUse = formData.gln || '089' + Math.floor(100000000 + Math.random() * 900000000);
      const orgNameToUse = formData.orgName || formData.caFirmName || formData.departmentName || `${formData.name} Entity`;

      const user = await AuthService.signup(
        formData.name,
        orgNameToUse,
        glnToUse,
        formData.role,
        formData.password,
        {
          country: formData.country,
          state: formData.state,
          sector: formData.sector,
          positionLabel: formData.positionLabel,
          erpType: formData.erpType,
          erpStatus: 'CONNECTED',
          drugLicenseNo: formData.drugLicenseNo,
          pharmacistRegNo: formData.pharmacistRegNo,
          gstin: formData.gstin
        }
      );

      // Auto login
      localStorage.setItem('eledger_active_session', JSON.stringify({ ...user, caFirmName: formData.caFirmName, membershipNumber: formData.membershipNumber }));
      window.location.href = '#/dashboard';
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-x-hidden font-sans">
      {/* Top Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-800">
        <Link to="/" className="flex items-center gap-3">
          <Logo size="md" />
          <span className="font-serif-editorial text-2xl font-semibold tracking-tight text-white">Pharma Ledger India</span>
        </Link>
        <Link to="/" className="text-xs font-mono text-slate-400 hover:text-white transition-colors">
          Back to Login
        </Link>
      </header>

      {/* Main Form Container */}
      <main className="relative z-10 max-w-3xl w-full mx-auto px-6 py-10 flex-1 flex flex-col justify-center">
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          
          {/* Wizard Step Progress Header */}
          <div className="mb-8">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-teal-400 mb-2">Node Onboarding Wizard</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Create Grid Partner Account</h1>
            
            {/* Step Indicators */}
            <div className="grid grid-cols-4 gap-2 mt-6">
              {[
                { step: 1, name: 'Basic Info', icon: UserCircle },
                { step: 2, name: 'Operational Role', icon: ShieldCheck },
                { step: 3, name: 'Legal Identity', icon: Building2 },
                { step: 4, name: 'System Link', icon: Cpu }
              ].map((s) => {
                const Icon = s.icon;
                const isComplete = currentStep > s.step;
                const isCurrent = currentStep === s.step;
                return (
                  <div
                    key={s.step}
                    onClick={() => s.step < currentStep && setCurrentStep(s.step)}
                    className={`p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-teal-500/10 border-teal-500 text-white ring-2 ring-teal-500/20'
                        : isComplete
                        ? 'bg-slate-900 border-teal-500/40 text-teal-400 cursor-pointer'
                        : 'bg-slate-900/40 border-slate-800 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] font-bold">0{s.step}</span>
                      {isComplete ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-xs font-bold truncate">{s.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs font-medium flex items-center gap-3">
              <span className="font-bold shrink-0">Error:</span>
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCircle className="text-teal-400" size={20} />
                  Step 1: Personal & Basic Details
                </h3>
                <p className="text-xs text-slate-400 mt-1">Enter authorized user profile credentials for grid access.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Dr. Ananya Sharma"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Official Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="ananya@pharmafirm.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Age / Position Experience
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="35"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-teal-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary / Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Phone Number (Mobile OTP Enabled)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Operational Role */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="text-teal-400" size={20} />
                  Step 2: Operational Sector & Grid Role
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Select your Industry Sector and Operational Role. Your selection customizes the legal compliance and smart contract permissions required in Step 3.
                </p>
              </div>

              {/* Sector Switcher */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-2">
                  Industry Sector
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: Sector.PHARMA, name: 'Pharmaceuticals', desc: 'CDSCO & iVEDA Track & Trace' },
                    { key: Sector.EXCISE, name: 'State Excise & Spirits', desc: 'Excise Duty & E-Pass Grid' },
                    { key: Sector.FMCG, name: 'FMCG & Consumer Goods', desc: 'Parent-Child Serialization' }
                  ].map((sec) => (
                    <button
                      type="button"
                      key={sec.key}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, sector: sec.key }));
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        formData.sector === sec.key
                          ? 'bg-teal-500/10 border-teal-500 text-white ring-2 ring-teal-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-sm text-white">{sec.name}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{sec.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role Cards List */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-2">
                  Operational Grid Role
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {availableRoles.map((r) => {
                    const RoleIcon = r.icon;
                    const isSelected = formData.role === r.role;
                    return (
                      <div
                        key={r.role}
                        onClick={() => setFormData(prev => ({ ...prev, role: r.role, positionLabel: r.label }))}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-teal-500/10 border-teal-500 text-white ring-2 ring-teal-500/20'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-teal-500 text-slate-950' : 'bg-slate-800 text-slate-300'}`}>
                            <RoleIcon size={20} />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-white">{r.label}</div>
                            <div className="text-xs text-slate-400">{r.desc}</div>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-teal-500 bg-teal-500 text-slate-950' : 'border-slate-700'}`}>
                          {isSelected && <Check size={12} className="stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Legal Identity */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="text-teal-400" size={20} />
                  Step 3: Legal & Regulatory KYC Identity
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tailored fields for operational role: <span className="text-teal-400 font-bold uppercase">{formData.positionLabel || formData.role}</span>
                </p>
              </div>

              {/* DYNAMIC FIELDS BASED ON ROLE */}

              {/* 1. CA / AUDITOR SPECIFIC FIELDS */}
              {formData.role === UserRole.AUDITOR && (
                <div className="space-y-4 bg-emerald-950/40 p-4 rounded-xl border border-emerald-500/30">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                    <Landmark size={16} />
                    <span>Chartered Accountant & Statutory Audit Verification</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                        CA Firm / Practice Name *
                      </label>
                      <input
                        type="text"
                        name="caFirmName"
                        value={formData.caFirmName}
                        onChange={handleChange}
                        placeholder="e.g. Varma & Associates CAs"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                        ICAI Membership No. *
                      </label>
                      <input
                        type="text"
                        name="membershipNumber"
                        value={formData.membershipNumber}
                        onChange={handleChange}
                        placeholder="e.g. ICAI-512890"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. REGULATOR SPECIFIC FIELDS */}
              {formData.role === UserRole.REGULATOR && (
                <div className="space-y-4 bg-blue-950/40 p-4 rounded-xl border border-blue-500/30">
                  <div className="text-xs font-bold text-blue-400 flex items-center gap-2">
                    <ShieldCheck size={16} />
                    <span>Regulatory Officer & Department Identity</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                        Regulatory Body / Dept Name *
                      </label>
                      <input
                        type="text"
                        name="departmentName"
                        value={formData.departmentName}
                        onChange={handleChange}
                        placeholder="e.g. CDSCO HQ / Maharashtra FDA"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                        Officer Designation
                      </label>
                      <input
                        type="text"
                        name="officerDesignation"
                        value={formData.officerDesignation}
                        onChange={handleChange}
                        placeholder="e.g. Senior Drug Inspector"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. STANDARD CORPORATE / ENTITY FIELDS */}
              {formData.role !== UserRole.AUDITOR && formData.role !== UserRole.REGULATOR && (
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Organization / Corporate Name *
                  </label>
                  <input
                    type="text"
                    name="orgName"
                    value={formData.orgName}
                    onChange={handleChange}
                    placeholder="e.g. Global Life Sciences Pvt Ltd"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
              )}

              {/* GS1 GLN Identifier */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300">
                      GS1 Global Location Number (GLN)
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomGLN}
                      className="text-[10px] font-mono text-teal-400 hover:underline"
                    >
                      Generate GLN
                    </button>
                  </div>
                  <input
                    type="text"
                    name="gln"
                    value={formData.gln}
                    onChange={handleChange}
                    placeholder="e.g. 0890001234567"
                    maxLength={13}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    GSTIN / Business Registration Code
                  </label>
                  <input
                    type="text"
                    name="gstin"
                    value={formData.gstin}
                    onChange={handleChange}
                    placeholder="e.g. 27AAPCA1234A1Z5"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Drug License for Pharma Supply Chain */}
              {formData.sector === Sector.PHARMA && formData.role !== UserRole.AUDITOR && formData.role !== UserRole.REGULATOR && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                      Drug License No. (Form 20/21)
                    </label>
                    <input
                      type="text"
                      name="drugLicenseNo"
                      value={formData.drugLicenseNo}
                      onChange={handleChange}
                      placeholder="DL-MH-102938"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                      Pharmacist Registration No.
                    </label>
                    <input
                      type="text"
                      name="pharmacistRegNo"
                      value={formData.pharmacistRegNo}
                      onChange={handleChange}
                      placeholder="PRN-88201"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              )}

              {/* Address / Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    State Jurisdiction
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-teal-500"
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Delhi">Delhi NCR</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Registered Facility Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Plot 42, MIDC Industrial Area"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: System Link & Security */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Cpu className="text-teal-400" size={20} />
                  Step 4: System Linkage & Node Keys
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Connect your internal ERP system and initialize cryptographic keys for the blockchain network.
                </p>
              </div>

              {/* ERP Linkage */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-2">
                  Enterprise ERP Integration
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { key: ERPType.SAP, name: 'SAP S/4HANA' },
                    { key: ERPType.ORACLE, name: 'Oracle NetSuite' },
                    { key: ERPType.TALLY, name: 'Tally Prime' },
                    { key: ERPType.MANUAL, name: 'Manual / Portal' }
                  ].map((erp) => (
                    <button
                      type="button"
                      key={erp.key}
                      onClick={() => setFormData(prev => ({ ...prev, erpType: erp.key }))}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        formData.erpType === erp.key
                          ? 'bg-teal-500/10 border-teal-500 text-white font-bold ring-2 ring-teal-500/20'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs">{erp.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cryptographic Node Key */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300">
                    RSA/ECC Cryptographic Public Key
                  </label>
                  <button
                    type="button"
                    onClick={generateKey}
                    className="text-[10px] font-mono text-teal-400 hover:underline"
                  >
                    Generate Key Pair
                  </button>
                </div>
                <input
                  type="text"
                  name="publicKey"
                  value={formData.publicKey || '0x8f3c71a9b24e0513982e442a8b9f123456789abc'}
                  onChange={handleChange}
                  readOnly
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs font-mono text-teal-300 placeholder-slate-600 focus:outline-none"
                />
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Account Access Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-slate-800">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-5 py-3 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-900 text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft size={16} />
                <span>PREVIOUS STEP</span>
              </button>
            ) : <div />}

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                <span>NEXT STEP</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>INITIALIZE NODE</span>
                    <CheckCircle2 size={16} />
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-6 text-center text-[11px] font-mono text-slate-500 uppercase tracking-widest">
        National Supply Chain Grid © {new Date().getFullYear()} — CDSCO, SLA & iVEDA Compliant
      </footer>
    </div>
  );
};

export default Signup;
