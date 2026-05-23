// ============ System Management Types ============

export interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  phone?: string;
  email?: string;
  dept?: string;
  status: number;
  roles: Role[];
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  type: string;
  module?: string;
}

export interface MenuItem {
  id: string;
  parentId?: string;
  name: string;
  code: string;
  path?: string;
  icon?: string;
  component?: string;
  sort: number;
  type: string;
  visible: number;
  status: number;
  children: MenuItem[];
}

// ============ Infection Monitoring Types ============

export interface InfectionCase {
  id: string;
  patientId: string;
  patientName: string;
  gender: string;
  age: number;
  dept: string;
  bedNo?: string;
  admissionDate: string;
  infectionDate: string;
  infectionSite: string;
  infectionType?: string;
  pathogen?: string;
  outcome?: string;
  outcomeDate?: string;
  reporter?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarningRecord {
  id: string;
  patientId: string;
  patientName: string;
  dept: string;
  warningType: string;
  warningLevel: string;
  description: string;
  status: string;
  handler?: string;
  handleResult?: string;
  handleTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnvironmentalMonitor {
  id: string;
  dept: string;
  samplePoint: string;
  sampleType: string;
  sampleDate: string;
  sampler?: string;
  result?: string;
  colonyCount?: number;
  standardLimit?: number;
  reviewer?: string;
  reviewStatus: string;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SterilizationMonitor {
  id: string;
  batchNo: string;
  sterilizer?: string;
  method: string;
  temperature?: number;
  pressure?: number;
  duration?: number;
  operator?: string;
  sterilizeDate: string;
  bioResult?: string;
  chemResult?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface OccupationalExposure {
  id: string;
  staffName: string;
  staffDept: string;
  exposureType: string;
  exposureSource?: string;
  exposurePart: string;
  exposureDate: string;
  emergencyAction?: string;
  riskLevel?: string;
  followUpPlan?: string;
  followUpResult?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface AntibioticUsage {
  id: string;
  dept: string;
  month: string;
  totalPatients: number;
  antibioticPatients: number;
  usageRate: number;
  ddd?: number;
  preOpProphylaxisRate?: number;
  preOpTimingRate?: number;
  postOp24hStopRate?: number;
  pathogenSendRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface HandHygiene {
  id: string;
  dept: string;
  month: string;
  totalOpportunities: number;
  compliantActions: number;
  complianceRate: number;
  beforeContact?: number;
  beforeAseptic?: number;
  afterContact?: number;
  afterFluid?: number;
  afterSurrounding?: number;
  createdAt: string;
  updatedAt: string;
}

export interface InfectionReport {
  id: string;
  title: string;
  type: string;
  period: string;
  content: string;
  author?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// ============ Dashboard Types ============

export interface DashboardStats {
  totalInfections: number;
  monthInfections: number;
  pendingWarnings: number;
  mdroCount: number;
  antibioticUsageRate: number;
  handHygieneRate: number;
  envHygieneRate: number;
  exposureCount: number;
  infectionTrend: { month: string; count: number }[];
  siteDistribution: { site: string; count: number }[];
  deptInfectionRate: { dept: string; rate: number }[];
}

// ============ API Response Types ============

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============ Filter Types ============

export interface InfectionCaseFilter extends PaginationParams {
  dept?: string;
  status?: string;
  infectionSite?: string;
  startDate?: string;
  endDate?: string;
}

export interface WarningRecordFilter extends PaginationParams {
  dept?: string;
  status?: string;
  warningType?: string;
  warningLevel?: string;
  startDate?: string;
  endDate?: string;
}

export interface EnvironmentalMonitorFilter extends PaginationParams {
  dept?: string;
  sampleType?: string;
  reviewStatus?: string;
  startDate?: string;
  endDate?: string;
}

export interface SterilizationMonitorFilter extends PaginationParams {
  method?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface OccupationalExposureFilter extends PaginationParams {
  staffDept?: string;
  exposureType?: string;
  riskLevel?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface AntibioticUsageFilter extends PaginationParams {
  dept?: string;
  month?: string;
}

export interface HandHygieneFilter extends PaginationParams {
  dept?: string;
  month?: string;
}

export interface InfectionReportFilter extends PaginationParams {
  type?: string;
  status?: string;
}

// ============ Form Data Types (for create/update) ============

export interface InfectionCaseFormData {
  patientId: string;
  patientName: string;
  gender: string;
  age: number;
  dept: string;
  bedNo?: string;
  admissionDate: string;
  infectionDate: string;
  infectionSite: string;
  infectionType?: string;
  pathogen?: string;
  outcome?: string;
  outcomeDate?: string;
  reporter?: string;
  status?: string;
}

export interface WarningRecordFormData {
  patientId: string;
  patientName: string;
  dept: string;
  warningType: string;
  warningLevel: string;
  description: string;
  status?: string;
  handler?: string;
  handleResult?: string;
  handleTime?: string;
}

export interface EnvironmentalMonitorFormData {
  dept: string;
  samplePoint: string;
  sampleType: string;
  sampleDate: string;
  sampler?: string;
  result?: string;
  colonyCount?: number;
  standardLimit?: number;
  reviewer?: string;
  reviewStatus?: string;
  reviewComment?: string;
}

export interface SterilizationMonitorFormData {
  batchNo: string;
  sterilizer?: string;
  method: string;
  temperature?: number;
  pressure?: number;
  duration?: number;
  operator?: string;
  sterilizeDate: string;
  bioResult?: string;
  chemResult?: string;
  status?: string;
}

export interface OccupationalExposureFormData {
  staffName: string;
  staffDept: string;
  exposureType: string;
  exposureSource?: string;
  exposurePart: string;
  exposureDate: string;
  emergencyAction?: string;
  riskLevel?: string;
  followUpPlan?: string;
  followUpResult?: string;
  status?: string;
}

export interface AntibioticUsageFormData {
  dept: string;
  month: string;
  totalPatients: number;
  antibioticPatients: number;
  usageRate: number;
  ddd?: number;
  preOpProphylaxisRate?: number;
  preOpTimingRate?: number;
  postOp24hStopRate?: number;
  pathogenSendRate?: number;
}

export interface HandHygieneFormData {
  dept: string;
  month: string;
  totalOpportunities: number;
  compliantActions: number;
  complianceRate: number;
  beforeContact?: number;
  beforeAseptic?: number;
  afterContact?: number;
  afterFluid?: number;
  afterSurrounding?: number;
}

export interface InfectionReportFormData {
  title: string;
  type: string;
  period: string;
  content: string;
  author?: string;
  status?: string;
}
