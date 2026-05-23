import { create } from 'zustand';
import type {
  InfectionCase,
  WarningRecord,
  EnvironmentalMonitor,
  SterilizationMonitor,
  OccupationalExposure,
  AntibioticUsage,
  HandHygiene,
  InfectionReport,
  DashboardStats,
  PaginatedResponse,
  InfectionCaseFilter,
  WarningRecordFilter,
  EnvironmentalMonitorFilter,
  SterilizationMonitorFilter,
  OccupationalExposureFilter,
  AntibioticUsageFilter,
  HandHygieneFilter,
  InfectionReportFilter,
  InfectionCaseFormData,
  WarningRecordFormData,
  EnvironmentalMonitorFormData,
  SterilizationMonitorFormData,
  OccupationalExposureFormData,
  AntibioticUsageFormData,
  HandHygieneFormData,
  InfectionReportFormData,
} from '@/types';

// ============ Generic fetch helper ============

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T; success: boolean; message?: string }> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errorData.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

function buildQueryString(params?: Record<string, unknown>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

// ============ Data Store State ============

interface DataState {
  // Data caches for each module
  infectionCases: PaginatedResponse<InfectionCase>;
  warningRecords: PaginatedResponse<WarningRecord>;
  environmentalMonitors: PaginatedResponse<EnvironmentalMonitor>;
  sterilizationMonitors: PaginatedResponse<SterilizationMonitor>;
  occupationalExposures: PaginatedResponse<OccupationalExposure>;
  antibioticUsages: PaginatedResponse<AntibioticUsage>;
  handHygienes: PaginatedResponse<HandHygiene>;
  infectionReports: PaginatedResponse<InfectionReport>;
  dashboardStats: DashboardStats | null;

  // Loading states for each module
  infectionCasesLoading: boolean;
  warningRecordsLoading: boolean;
  environmentalMonitorsLoading: boolean;
  sterilizationMonitorsLoading: boolean;
  occupationalExposuresLoading: boolean;
  antibioticUsagesLoading: boolean;
  handHygienesLoading: boolean;
  infectionReportsLoading: boolean;
  dashboardStatsLoading: boolean;

  // Current detail items
  currentInfectionCase: InfectionCase | null;
  currentWarningRecord: WarningRecord | null;
  currentEnvironmentalMonitor: EnvironmentalMonitor | null;
  currentSterilizationMonitor: SterilizationMonitor | null;
  currentOccupationalExposure: OccupationalExposure | null;
  currentAntibioticUsage: AntibioticUsage | null;
  currentHandHygiene: HandHygiene | null;
  currentInfectionReport: InfectionReport | null;

  // Detail loading
  detailLoading: boolean;

  // Error state
  error: string | null;

  // ---- Fetch list actions ----
  fetchInfectionCases: (filter?: InfectionCaseFilter) => Promise<void>;
  fetchWarningRecords: (filter?: WarningRecordFilter) => Promise<void>;
  fetchEnvironmentalMonitors: (filter?: EnvironmentalMonitorFilter) => Promise<void>;
  fetchSterilizationMonitors: (filter?: SterilizationMonitorFilter) => Promise<void>;
  fetchOccupationalExposures: (filter?: OccupationalExposureFilter) => Promise<void>;
  fetchAntibioticUsages: (filter?: AntibioticUsageFilter) => Promise<void>;
  fetchHandHygienes: (filter?: HandHygieneFilter) => Promise<void>;
  fetchInfectionReports: (filter?: InfectionReportFilter) => Promise<void>;
  fetchDashboardStats: () => Promise<void>;

  // ---- Fetch detail actions ----
  fetchInfectionCaseById: (id: string) => Promise<void>;
  fetchWarningRecordById: (id: string) => Promise<void>;
  fetchEnvironmentalMonitorById: (id: string) => Promise<void>;
  fetchSterilizationMonitorById: (id: string) => Promise<void>;
  fetchOccupationalExposureById: (id: string) => Promise<void>;
  fetchAntibioticUsageById: (id: string) => Promise<void>;
  fetchHandHygieneById: (id: string) => Promise<void>;
  fetchInfectionReportById: (id: string) => Promise<void>;

  // ---- Create actions ----
  createInfectionCase: (data: InfectionCaseFormData) => Promise<InfectionCase | null>;
  createWarningRecord: (data: WarningRecordFormData) => Promise<WarningRecord | null>;
  createEnvironmentalMonitor: (data: EnvironmentalMonitorFormData) => Promise<EnvironmentalMonitor | null>;
  createSterilizationMonitor: (data: SterilizationMonitorFormData) => Promise<SterilizationMonitor | null>;
  createOccupationalExposure: (data: OccupationalExposureFormData) => Promise<OccupationalExposure | null>;
  createAntibioticUsage: (data: AntibioticUsageFormData) => Promise<AntibioticUsage | null>;
  createHandHygiene: (data: HandHygieneFormData) => Promise<HandHygiene | null>;
  createInfectionReport: (data: InfectionReportFormData) => Promise<InfectionReport | null>;

  // ---- Update actions ----
  updateInfectionCase: (id: string, data: Partial<InfectionCaseFormData>) => Promise<InfectionCase | null>;
  updateWarningRecord: (id: string, data: Partial<WarningRecordFormData>) => Promise<WarningRecord | null>;
  updateEnvironmentalMonitor: (id: string, data: Partial<EnvironmentalMonitorFormData>) => Promise<EnvironmentalMonitor | null>;
  updateSterilizationMonitor: (id: string, data: Partial<SterilizationMonitorFormData>) => Promise<SterilizationMonitor | null>;
  updateOccupationalExposure: (id: string, data: Partial<OccupationalExposureFormData>) => Promise<OccupationalExposure | null>;
  updateAntibioticUsage: (id: string, data: Partial<AntibioticUsageFormData>) => Promise<AntibioticUsage | null>;
  updateHandHygiene: (id: string, data: Partial<HandHygieneFormData>) => Promise<HandHygiene | null>;
  updateInfectionReport: (id: string, data: Partial<InfectionReportFormData>) => Promise<InfectionReport | null>;

  // ---- Delete actions ----
  deleteInfectionCase: (id: string) => Promise<boolean>;
  deleteWarningRecord: (id: string) => Promise<boolean>;
  deleteEnvironmentalMonitor: (id: string) => Promise<boolean>;
  deleteSterilizationMonitor: (id: string) => Promise<boolean>;
  deleteOccupationalExposure: (id: string) => Promise<boolean>;
  deleteAntibioticUsage: (id: string) => Promise<boolean>;
  deleteHandHygiene: (id: string) => Promise<boolean>;
  deleteInfectionReport: (id: string) => Promise<boolean>;

  // ---- Utility actions ----
  clearError: () => void;
  clearCurrentDetail: () => void;
}

const emptyPaginatedResponse: PaginatedResponse<never> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 0,
};

export const useDataStore = create<DataState>()((set, get) => ({
  // Initial data state
  infectionCases: { ...emptyPaginatedResponse },
  warningRecords: { ...emptyPaginatedResponse },
  environmentalMonitors: { ...emptyPaginatedResponse },
  sterilizationMonitors: { ...emptyPaginatedResponse },
  occupationalExposures: { ...emptyPaginatedResponse },
  antibioticUsages: { ...emptyPaginatedResponse },
  handHygienes: { ...emptyPaginatedResponse },
  infectionReports: { ...emptyPaginatedResponse },
  dashboardStats: null,

  // Initial loading state
  infectionCasesLoading: false,
  warningRecordsLoading: false,
  environmentalMonitorsLoading: false,
  sterilizationMonitorsLoading: false,
  occupationalExposuresLoading: false,
  antibioticUsagesLoading: false,
  handHygienesLoading: false,
  infectionReportsLoading: false,
  dashboardStatsLoading: false,
  detailLoading: false,

  // Initial detail state
  currentInfectionCase: null,
  currentWarningRecord: null,
  currentEnvironmentalMonitor: null,
  currentSterilizationMonitor: null,
  currentOccupationalExposure: null,
  currentAntibioticUsage: null,
  currentHandHygiene: null,
  currentInfectionReport: null,

  // Initial error state
  error: null,

  // ============ Fetch list actions ============

  fetchInfectionCases: async (filter?: InfectionCaseFilter) => {
    set({ infectionCasesLoading: true, error: null });
    try {
      const qs = buildQueryString(filter as Record<string, unknown>);
      const result = await apiFetch<PaginatedResponse<InfectionCase>>(`/api/infection-cases${qs}`);
      if (result.success) {
        set({ infectionCases: result.data, infectionCasesLoading: false });
      } else {
        set({ error: result.message ?? '获取感染病例失败', infectionCasesLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, infectionCasesLoading: false });
    }
  },

  fetchWarningRecords: async (filter?: WarningRecordFilter) => {
    set({ warningRecordsLoading: true, error: null });
    try {
      const qs = buildQueryString(filter as Record<string, unknown>);
      const result = await apiFetch<PaginatedResponse<WarningRecord>>(`/api/warnings${qs}`);
      if (result.success) {
        set({ warningRecords: result.data, warningRecordsLoading: false });
      } else {
        set({ error: result.message ?? '获取预警记录失败', warningRecordsLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, warningRecordsLoading: false });
    }
  },

  fetchEnvironmentalMonitors: async (filter?: EnvironmentalMonitorFilter) => {
    set({ environmentalMonitorsLoading: true, error: null });
    try {
      const qs = buildQueryString(filter as Record<string, unknown>);
      const result = await apiFetch<PaginatedResponse<EnvironmentalMonitor>>(`/api/environmental-monitors${qs}`);
      if (result.success) {
        set({ environmentalMonitors: result.data, environmentalMonitorsLoading: false });
      } else {
        set({ error: result.message ?? '获取环境监测数据失败', environmentalMonitorsLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, environmentalMonitorsLoading: false });
    }
  },

  fetchSterilizationMonitors: async (filter?: SterilizationMonitorFilter) => {
    set({ sterilizationMonitorsLoading: true, error: null });
    try {
      const qs = buildQueryString(filter as Record<string, unknown>);
      const result = await apiFetch<PaginatedResponse<SterilizationMonitor>>(`/api/sterilization-monitors${qs}`);
      if (result.success) {
        set({ sterilizationMonitors: result.data, sterilizationMonitorsLoading: false });
      } else {
        set({ error: result.message ?? '获取灭菌监测数据失败', sterilizationMonitorsLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, sterilizationMonitorsLoading: false });
    }
  },

  fetchOccupationalExposures: async (filter?: OccupationalExposureFilter) => {
    set({ occupationalExposuresLoading: true, error: null });
    try {
      const qs = buildQueryString(filter as Record<string, unknown>);
      const result = await apiFetch<PaginatedResponse<OccupationalExposure>>(`/api/occupational-exposures${qs}`);
      if (result.success) {
        set({ occupationalExposures: result.data, occupationalExposuresLoading: false });
      } else {
        set({ error: result.message ?? '获取职业暴露数据失败', occupationalExposuresLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, occupationalExposuresLoading: false });
    }
  },

  fetchAntibioticUsages: async (filter?: AntibioticUsageFilter) => {
    set({ antibioticUsagesLoading: true, error: null });
    try {
      const qs = buildQueryString(filter as Record<string, unknown>);
      const result = await apiFetch<PaginatedResponse<AntibioticUsage>>(`/api/antibiotic-usages${qs}`);
      if (result.success) {
        set({ antibioticUsages: result.data, antibioticUsagesLoading: false });
      } else {
        set({ error: result.message ?? '获取抗菌药物使用数据失败', antibioticUsagesLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, antibioticUsagesLoading: false });
    }
  },

  fetchHandHygienes: async (filter?: HandHygieneFilter) => {
    set({ handHygienesLoading: true, error: null });
    try {
      const qs = buildQueryString(filter as Record<string, unknown>);
      const result = await apiFetch<PaginatedResponse<HandHygiene>>(`/api/hand-hygienes${qs}`);
      if (result.success) {
        set({ handHygienes: result.data, handHygienesLoading: false });
      } else {
        set({ error: result.message ?? '获取手卫生数据失败', handHygienesLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, handHygienesLoading: false });
    }
  },

  fetchInfectionReports: async (filter?: InfectionReportFilter) => {
    set({ infectionReportsLoading: true, error: null });
    try {
      const qs = buildQueryString(filter as Record<string, unknown>);
      const result = await apiFetch<PaginatedResponse<InfectionReport>>(`/api/infection-reports${qs}`);
      if (result.success) {
        set({ infectionReports: result.data, infectionReportsLoading: false });
      } else {
        set({ error: result.message ?? '获取感染报告失败', infectionReportsLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, infectionReportsLoading: false });
    }
  },

  fetchDashboardStats: async () => {
    set({ dashboardStatsLoading: true, error: null });
    try {
      const result = await apiFetch<DashboardStats>('/api/dashboard');
      if (result.success) {
        set({ dashboardStats: result.data, dashboardStatsLoading: false });
      } else {
        set({ error: result.message ?? '获取仪表盘数据失败', dashboardStatsLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, dashboardStatsLoading: false });
    }
  },

  // ============ Fetch detail actions ============

  fetchInfectionCaseById: async (id: string) => {
    set({ detailLoading: true, error: null });
    try {
      const result = await apiFetch<InfectionCase>(`/api/infection-cases/${id}`);
      if (result.success) {
        set({ currentInfectionCase: result.data, detailLoading: false });
      } else {
        set({ error: result.message ?? '获取感染病例详情失败', detailLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, detailLoading: false });
    }
  },

  fetchWarningRecordById: async (id: string) => {
    set({ detailLoading: true, error: null });
    try {
      const result = await apiFetch<WarningRecord>(`/api/warnings/${id}`);
      if (result.success) {
        set({ currentWarningRecord: result.data, detailLoading: false });
      } else {
        set({ error: result.message ?? '获取预警记录详情失败', detailLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, detailLoading: false });
    }
  },

  fetchEnvironmentalMonitorById: async (id: string) => {
    set({ detailLoading: true, error: null });
    try {
      const result = await apiFetch<EnvironmentalMonitor>(`/api/environmental-monitors/${id}`);
      if (result.success) {
        set({ currentEnvironmentalMonitor: result.data, detailLoading: false });
      } else {
        set({ error: result.message ?? '获取环境监测详情失败', detailLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, detailLoading: false });
    }
  },

  fetchSterilizationMonitorById: async (id: string) => {
    set({ detailLoading: true, error: null });
    try {
      const result = await apiFetch<SterilizationMonitor>(`/api/sterilization-monitors/${id}`);
      if (result.success) {
        set({ currentSterilizationMonitor: result.data, detailLoading: false });
      } else {
        set({ error: result.message ?? '获取灭菌监测详情失败', detailLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, detailLoading: false });
    }
  },

  fetchOccupationalExposureById: async (id: string) => {
    set({ detailLoading: true, error: null });
    try {
      const result = await apiFetch<OccupationalExposure>(`/api/occupational-exposures/${id}`);
      if (result.success) {
        set({ currentOccupationalExposure: result.data, detailLoading: false });
      } else {
        set({ error: result.message ?? '获取职业暴露详情失败', detailLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, detailLoading: false });
    }
  },

  fetchAntibioticUsageById: async (id: string) => {
    set({ detailLoading: true, error: null });
    try {
      const result = await apiFetch<AntibioticUsage>(`/api/antibiotic-usages/${id}`);
      if (result.success) {
        set({ currentAntibioticUsage: result.data, detailLoading: false });
      } else {
        set({ error: result.message ?? '获取抗菌药物使用详情失败', detailLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, detailLoading: false });
    }
  },

  fetchHandHygieneById: async (id: string) => {
    set({ detailLoading: true, error: null });
    try {
      const result = await apiFetch<HandHygiene>(`/api/hand-hygienes/${id}`);
      if (result.success) {
        set({ currentHandHygiene: result.data, detailLoading: false });
      } else {
        set({ error: result.message ?? '获取手卫生详情失败', detailLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, detailLoading: false });
    }
  },

  fetchInfectionReportById: async (id: string) => {
    set({ detailLoading: true, error: null });
    try {
      const result = await apiFetch<InfectionReport>(`/api/infection-reports/${id}`);
      if (result.success) {
        set({ currentInfectionReport: result.data, detailLoading: false });
      } else {
        set({ error: result.message ?? '获取感染报告详情失败', detailLoading: false });
      }
    } catch (e) {
      set({ error: (e as Error).message, detailLoading: false });
    }
  },

  // ============ Create actions ============

  createInfectionCase: async (data: InfectionCaseFormData) => {
    set({ error: null });
    try {
      const result = await apiFetch<InfectionCase>('/api/infection-cases', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.success) {
        // Refresh the list after creation
        get().fetchInfectionCases();
        return result.data;
      }
      set({ error: result.message ?? '创建感染病例失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  createWarningRecord: async (data: WarningRecordFormData) => {
    set({ error: null });
    try {
      const result = await apiFetch<WarningRecord>('/api/warnings', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchWarningRecords();
        return result.data;
      }
      set({ error: result.message ?? '创建预警记录失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  createEnvironmentalMonitor: async (data: EnvironmentalMonitorFormData) => {
    set({ error: null });
    try {
      const result = await apiFetch<EnvironmentalMonitor>('/api/environmental-monitors', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchEnvironmentalMonitors();
        return result.data;
      }
      set({ error: result.message ?? '创建环境监测记录失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  createSterilizationMonitor: async (data: SterilizationMonitorFormData) => {
    set({ error: null });
    try {
      const result = await apiFetch<SterilizationMonitor>('/api/sterilization-monitors', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchSterilizationMonitors();
        return result.data;
      }
      set({ error: result.message ?? '创建灭菌监测记录失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  createOccupationalExposure: async (data: OccupationalExposureFormData) => {
    set({ error: null });
    try {
      const result = await apiFetch<OccupationalExposure>('/api/occupational-exposures', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchOccupationalExposures();
        return result.data;
      }
      set({ error: result.message ?? '创建职业暴露记录失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  createAntibioticUsage: async (data: AntibioticUsageFormData) => {
    set({ error: null });
    try {
      const result = await apiFetch<AntibioticUsage>('/api/antibiotic-usages', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchAntibioticUsages();
        return result.data;
      }
      set({ error: result.message ?? '创建抗菌药物使用记录失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  createHandHygiene: async (data: HandHygieneFormData) => {
    set({ error: null });
    try {
      const result = await apiFetch<HandHygiene>('/api/hand-hygienes', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchHandHygienes();
        return result.data;
      }
      set({ error: result.message ?? '创建手卫生记录失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  createInfectionReport: async (data: InfectionReportFormData) => {
    set({ error: null });
    try {
      const result = await apiFetch<InfectionReport>('/api/infection-reports', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchInfectionReports();
        return result.data;
      }
      set({ error: result.message ?? '创建感染报告失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  // ============ Update actions ============

  updateInfectionCase: async (id: string, data: Partial<InfectionCaseFormData>) => {
    set({ error: null });
    try {
      const result = await apiFetch<InfectionCase>(`/api/infection-cases/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchInfectionCases();
        return result.data;
      }
      set({ error: result.message ?? '更新感染病例失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  updateWarningRecord: async (id: string, data: Partial<WarningRecordFormData>) => {
    set({ error: null });
    try {
      const result = await apiFetch<WarningRecord>(`/api/warnings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchWarningRecords();
        return result.data;
      }
      set({ error: result.message ?? '更新预警记录失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  updateEnvironmentalMonitor: async (id: string, data: Partial<EnvironmentalMonitorFormData>) => {
    set({ error: null });
    try {
      const result = await apiFetch<EnvironmentalMonitor>(`/api/environmental-monitors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchEnvironmentalMonitors();
        return result.data;
      }
      set({ error: result.message ?? '更新环境监测记录失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  updateSterilizationMonitor: async (id: string, data: Partial<SterilizationMonitorFormData>) => {
    set({ error: null });
    try {
      const result = await apiFetch<SterilizationMonitor>(`/api/sterilization-monitors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchSterilizationMonitors();
        return result.data;
      }
      set({ error: result.message ?? '更新灭菌监测记录失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  updateOccupationalExposure: async (id: string, data: Partial<OccupationalExposureFormData>) => {
    set({ error: null });
    try {
      const result = await apiFetch<OccupationalExposure>(`/api/occupational-exposures/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchOccupationalExposures();
        return result.data;
      }
      set({ error: result.message ?? '更新职业暴露记录失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  updateAntibioticUsage: async (id: string, data: Partial<AntibioticUsageFormData>) => {
    set({ error: null });
    try {
      const result = await apiFetch<AntibioticUsage>(`/api/antibiotic-usages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchAntibioticUsages();
        return result.data;
      }
      set({ error: result.message ?? '更新抗菌药物使用记录失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  updateHandHygiene: async (id: string, data: Partial<HandHygieneFormData>) => {
    set({ error: null });
    try {
      const result = await apiFetch<HandHygiene>(`/api/hand-hygienes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchHandHygienes();
        return result.data;
      }
      set({ error: result.message ?? '更新手卫生记录失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  updateInfectionReport: async (id: string, data: Partial<InfectionReportFormData>) => {
    set({ error: null });
    try {
      const result = await apiFetch<InfectionReport>(`/api/infection-reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      if (result.success) {
        get().fetchInfectionReports();
        return result.data;
      }
      set({ error: result.message ?? '更新感染报告失败' });
      return null;
    } catch (e) {
      set({ error: (e as Error).message });
      return null;
    }
  },

  // ============ Delete actions ============

  deleteInfectionCase: async (id: string) => {
    set({ error: null });
    try {
      const result = await apiFetch<null>(`/api/infection-cases/${id}`, {
        method: 'DELETE',
      });
      if (result.success) {
        get().fetchInfectionCases();
        return true;
      }
      set({ error: result.message ?? '删除感染病例失败' });
      return false;
    } catch (e) {
      set({ error: (e as Error).message });
      return false;
    }
  },

  deleteWarningRecord: async (id: string) => {
    set({ error: null });
    try {
      const result = await apiFetch<null>(`/api/warnings/${id}`, {
        method: 'DELETE',
      });
      if (result.success) {
        get().fetchWarningRecords();
        return true;
      }
      set({ error: result.message ?? '删除预警记录失败' });
      return false;
    } catch (e) {
      set({ error: (e as Error).message });
      return false;
    }
  },

  deleteEnvironmentalMonitor: async (id: string) => {
    set({ error: null });
    try {
      const result = await apiFetch<null>(`/api/environmental-monitors/${id}`, {
        method: 'DELETE',
      });
      if (result.success) {
        get().fetchEnvironmentalMonitors();
        return true;
      }
      set({ error: result.message ?? '删除环境监测记录失败' });
      return false;
    } catch (e) {
      set({ error: (e as Error).message });
      return false;
    }
  },

  deleteSterilizationMonitor: async (id: string) => {
    set({ error: null });
    try {
      const result = await apiFetch<null>(`/api/sterilization-monitors/${id}`, {
        method: 'DELETE',
      });
      if (result.success) {
        get().fetchSterilizationMonitors();
        return true;
      }
      set({ error: result.message ?? '删除灭菌监测记录失败' });
      return false;
    } catch (e) {
      set({ error: (e as Error).message });
      return false;
    }
  },

  deleteOccupationalExposure: async (id: string) => {
    set({ error: null });
    try {
      const result = await apiFetch<null>(`/api/occupational-exposures/${id}`, {
        method: 'DELETE',
      });
      if (result.success) {
        get().fetchOccupationalExposures();
        return true;
      }
      set({ error: result.message ?? '删除职业暴露记录失败' });
      return false;
    } catch (e) {
      set({ error: (e as Error).message });
      return false;
    }
  },

  deleteAntibioticUsage: async (id: string) => {
    set({ error: null });
    try {
      const result = await apiFetch<null>(`/api/antibiotic-usages/${id}`, {
        method: 'DELETE',
      });
      if (result.success) {
        get().fetchAntibioticUsages();
        return true;
      }
      set({ error: result.message ?? '删除抗菌药物使用记录失败' });
      return false;
    } catch (e) {
      set({ error: (e as Error).message });
      return false;
    }
  },

  deleteHandHygiene: async (id: string) => {
    set({ error: null });
    try {
      const result = await apiFetch<null>(`/api/hand-hygienes/${id}`, {
        method: 'DELETE',
      });
      if (result.success) {
        get().fetchHandHygienes();
        return true;
      }
      set({ error: result.message ?? '删除手卫生记录失败' });
      return false;
    } catch (e) {
      set({ error: (e as Error).message });
      return false;
    }
  },

  deleteInfectionReport: async (id: string) => {
    set({ error: null });
    try {
      const result = await apiFetch<null>(`/api/infection-reports/${id}`, {
        method: 'DELETE',
      });
      if (result.success) {
        get().fetchInfectionReports();
        return true;
      }
      set({ error: result.message ?? '删除感染报告失败' });
      return false;
    } catch (e) {
      set({ error: (e as Error).message });
      return false;
    }
  },

  // ============ Utility actions ============

  clearError: () => set({ error: null }),

  clearCurrentDetail: () =>
    set({
      currentInfectionCase: null,
      currentWarningRecord: null,
      currentEnvironmentalMonitor: null,
      currentSterilizationMonitor: null,
      currentOccupationalExposure: null,
      currentAntibioticUsage: null,
      currentHandHygiene: null,
      currentInfectionReport: null,
    }),
}));
