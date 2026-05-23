'use client';

import { useDataStore } from '@/store/data-store';
import type {
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

/**
 * Hook for Infection Case module
 */
export function useInfectionCases() {
  const infectionCases = useDataStore((s) => s.infectionCases);
  const loading = useDataStore((s) => s.infectionCasesLoading);
  const currentCase = useDataStore((s) => s.currentInfectionCase);
  const detailLoading = useDataStore((s) => s.detailLoading);
  const fetchList = useDataStore((s) => s.fetchInfectionCases);
  const fetchById = useDataStore((s) => s.fetchInfectionCaseById);
  const create = useDataStore((s) => s.createInfectionCase);
  const update = useDataStore((s) => s.updateInfectionCase);
  const remove = useDataStore((s) => s.deleteInfectionCase);

  return {
    items: infectionCases.items,
    total: infectionCases.total,
    page: infectionCases.page,
    pageSize: infectionCases.pageSize,
    totalPages: infectionCases.totalPages,
    loading,
    currentCase,
    detailLoading,
    fetchList: (filter?: InfectionCaseFilter) => fetchList(filter),
    fetchById,
    create: (data: InfectionCaseFormData) => create(data),
    update: (id: string, data: Partial<InfectionCaseFormData>) => update(id, data),
    remove,
  };
}

/**
 * Hook for Warning Record module
 */
export function useWarningRecords() {
  const warningRecords = useDataStore((s) => s.warningRecords);
  const loading = useDataStore((s) => s.warningRecordsLoading);
  const currentRecord = useDataStore((s) => s.currentWarningRecord);
  const detailLoading = useDataStore((s) => s.detailLoading);
  const fetchList = useDataStore((s) => s.fetchWarningRecords);
  const fetchById = useDataStore((s) => s.fetchWarningRecordById);
  const create = useDataStore((s) => s.createWarningRecord);
  const update = useDataStore((s) => s.updateWarningRecord);
  const remove = useDataStore((s) => s.deleteWarningRecord);

  return {
    items: warningRecords.items,
    total: warningRecords.total,
    page: warningRecords.page,
    pageSize: warningRecords.pageSize,
    totalPages: warningRecords.totalPages,
    loading,
    currentRecord,
    detailLoading,
    fetchList: (filter?: WarningRecordFilter) => fetchList(filter),
    fetchById,
    create: (data: WarningRecordFormData) => create(data),
    update: (id: string, data: Partial<WarningRecordFormData>) => update(id, data),
    remove,
  };
}

/**
 * Hook for Environmental Monitor module
 */
export function useEnvironmentalMonitors() {
  const environmentalMonitors = useDataStore((s) => s.environmentalMonitors);
  const loading = useDataStore((s) => s.environmentalMonitorsLoading);
  const currentMonitor = useDataStore((s) => s.currentEnvironmentalMonitor);
  const detailLoading = useDataStore((s) => s.detailLoading);
  const fetchList = useDataStore((s) => s.fetchEnvironmentalMonitors);
  const fetchById = useDataStore((s) => s.fetchEnvironmentalMonitorById);
  const create = useDataStore((s) => s.createEnvironmentalMonitor);
  const update = useDataStore((s) => s.updateEnvironmentalMonitor);
  const remove = useDataStore((s) => s.deleteEnvironmentalMonitor);

  return {
    items: environmentalMonitors.items,
    total: environmentalMonitors.total,
    page: environmentalMonitors.page,
    pageSize: environmentalMonitors.pageSize,
    totalPages: environmentalMonitors.totalPages,
    loading,
    currentMonitor,
    detailLoading,
    fetchList: (filter?: EnvironmentalMonitorFilter) => fetchList(filter),
    fetchById,
    create: (data: EnvironmentalMonitorFormData) => create(data),
    update: (id: string, data: Partial<EnvironmentalMonitorFormData>) => update(id, data),
    remove,
  };
}

/**
 * Hook for Sterilization Monitor module
 */
export function useSterilizationMonitors() {
  const sterilizationMonitors = useDataStore((s) => s.sterilizationMonitors);
  const loading = useDataStore((s) => s.sterilizationMonitorsLoading);
  const currentMonitor = useDataStore((s) => s.currentSterilizationMonitor);
  const detailLoading = useDataStore((s) => s.detailLoading);
  const fetchList = useDataStore((s) => s.fetchSterilizationMonitors);
  const fetchById = useDataStore((s) => s.fetchSterilizationMonitorById);
  const create = useDataStore((s) => s.createSterilizationMonitor);
  const update = useDataStore((s) => s.updateSterilizationMonitor);
  const remove = useDataStore((s) => s.deleteSterilizationMonitor);

  return {
    items: sterilizationMonitors.items,
    total: sterilizationMonitors.total,
    page: sterilizationMonitors.page,
    pageSize: sterilizationMonitors.pageSize,
    totalPages: sterilizationMonitors.totalPages,
    loading,
    currentMonitor,
    detailLoading,
    fetchList: (filter?: SterilizationMonitorFilter) => fetchList(filter),
    fetchById,
    create: (data: SterilizationMonitorFormData) => create(data),
    update: (id: string, data: Partial<SterilizationMonitorFormData>) => update(id, data),
    remove,
  };
}

/**
 * Hook for Occupational Exposure module
 */
export function useOccupationalExposures() {
  const occupationalExposures = useDataStore((s) => s.occupationalExposures);
  const loading = useDataStore((s) => s.occupationalExposuresLoading);
  const currentExposure = useDataStore((s) => s.currentOccupationalExposure);
  const detailLoading = useDataStore((s) => s.detailLoading);
  const fetchList = useDataStore((s) => s.fetchOccupationalExposures);
  const fetchById = useDataStore((s) => s.fetchOccupationalExposureById);
  const create = useDataStore((s) => s.createOccupationalExposure);
  const update = useDataStore((s) => s.updateOccupationalExposure);
  const remove = useDataStore((s) => s.deleteOccupationalExposure);

  return {
    items: occupationalExposures.items,
    total: occupationalExposures.total,
    page: occupationalExposures.page,
    pageSize: occupationalExposures.pageSize,
    totalPages: occupationalExposures.totalPages,
    loading,
    currentExposure,
    detailLoading,
    fetchList: (filter?: OccupationalExposureFilter) => fetchList(filter),
    fetchById,
    create: (data: OccupationalExposureFormData) => create(data),
    update: (id: string, data: Partial<OccupationalExposureFormData>) => update(id, data),
    remove,
  };
}

/**
 * Hook for Antibiotic Usage module
 */
export function useAntibioticUsages() {
  const antibioticUsages = useDataStore((s) => s.antibioticUsages);
  const loading = useDataStore((s) => s.antibioticUsagesLoading);
  const currentUsage = useDataStore((s) => s.currentAntibioticUsage);
  const detailLoading = useDataStore((s) => s.detailLoading);
  const fetchList = useDataStore((s) => s.fetchAntibioticUsages);
  const fetchById = useDataStore((s) => s.fetchAntibioticUsageById);
  const create = useDataStore((s) => s.createAntibioticUsage);
  const update = useDataStore((s) => s.updateAntibioticUsage);
  const remove = useDataStore((s) => s.deleteAntibioticUsage);

  return {
    items: antibioticUsages.items,
    total: antibioticUsages.total,
    page: antibioticUsages.page,
    pageSize: antibioticUsages.pageSize,
    totalPages: antibioticUsages.totalPages,
    loading,
    currentUsage,
    detailLoading,
    fetchList: (filter?: AntibioticUsageFilter) => fetchList(filter),
    fetchById,
    create: (data: AntibioticUsageFormData) => create(data),
    update: (id: string, data: Partial<AntibioticUsageFormData>) => update(id, data),
    remove,
  };
}

/**
 * Hook for Hand Hygiene module
 */
export function useHandHygienes() {
  const handHygienes = useDataStore((s) => s.handHygienes);
  const loading = useDataStore((s) => s.handHygienesLoading);
  const currentHygiene = useDataStore((s) => s.currentHandHygiene);
  const detailLoading = useDataStore((s) => s.detailLoading);
  const fetchList = useDataStore((s) => s.fetchHandHygienes);
  const fetchById = useDataStore((s) => s.fetchHandHygieneById);
  const create = useDataStore((s) => s.createHandHygiene);
  const update = useDataStore((s) => s.updateHandHygiene);
  const remove = useDataStore((s) => s.deleteHandHygiene);

  return {
    items: handHygienes.items,
    total: handHygienes.total,
    page: handHygienes.page,
    pageSize: handHygienes.pageSize,
    totalPages: handHygienes.totalPages,
    loading,
    currentHygiene,
    detailLoading,
    fetchList: (filter?: HandHygieneFilter) => fetchList(filter),
    fetchById,
    create: (data: HandHygieneFormData) => create(data),
    update: (id: string, data: Partial<HandHygieneFormData>) => update(id, data),
    remove,
  };
}

/**
 * Hook for Infection Report module
 */
export function useInfectionReports() {
  const infectionReports = useDataStore((s) => s.infectionReports);
  const loading = useDataStore((s) => s.infectionReportsLoading);
  const currentReport = useDataStore((s) => s.currentInfectionReport);
  const detailLoading = useDataStore((s) => s.detailLoading);
  const fetchList = useDataStore((s) => s.fetchInfectionReports);
  const fetchById = useDataStore((s) => s.fetchInfectionReportById);
  const create = useDataStore((s) => s.createInfectionReport);
  const update = useDataStore((s) => s.updateInfectionReport);
  const remove = useDataStore((s) => s.deleteInfectionReport);

  return {
    items: infectionReports.items,
    total: infectionReports.total,
    page: infectionReports.page,
    pageSize: infectionReports.pageSize,
    totalPages: infectionReports.totalPages,
    loading,
    currentReport,
    detailLoading,
    fetchList: (filter?: InfectionReportFilter) => fetchList(filter),
    fetchById,
    create: (data: InfectionReportFormData) => create(data),
    update: (id: string, data: Partial<InfectionReportFormData>) => update(id, data),
    remove,
  };
}

/**
 * Hook for Dashboard statistics
 */
export function useDashboardStats() {
  const dashboardStats = useDataStore((s) => s.dashboardStats);
  const loading = useDataStore((s) => s.dashboardStatsLoading);
  const fetchStats = useDataStore((s) => s.fetchDashboardStats);

  return {
    stats: dashboardStats,
    loading,
    fetchStats,
  };
}

/**
 * Hook for global data store error
 */
export function useDataError() {
  const error = useDataStore((s) => s.error);
  const clearError = useDataStore((s) => s.clearError);

  return {
    error,
    clearError,
    hasError: error !== null,
  };
}
