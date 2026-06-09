import { create } from 'zustand';

// ============ Types ============
export interface Department {
  id: string;
  code: string;
  name: string;
  type: string;
  building: string | null;
  floor: string | null;
  phone: string | null;
  headName: string | null;
  bedCount: number;
  sort: number;
  status: number;
}

export interface DictItem {
  id: string;
  category: string;
  code: string;
  name: string;
  color: string | null;
  icon: string | null;
  extra: string | null;
  sort: number;
  status: number;
}

export interface DiseaseCategory {
  id: string;
  diseaseName: string;
  diseaseCode: string | null;
  category: string;
  isNotifiable: number;
  reportTimeLimit: number | null;
  isolationType: string | null;
  description: string | null;
  sort: number;
  status: number;
}

export interface MdroRuleTemplate {
  id: string;
  name: string;
  mdroType: string;
  bacteriaName: string;
  description: string;
  conditionValue: string;
  timeWindow: number;
  warningLevel: string;
  targetDepts: string | null;
  cooldownMinutes: number;
  priority: number;
  riskNote: string | null;
  sort: number;
  status: number;
}

export interface TargetMonitoringItem {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  targetRate: number;
  currentRate: number;
  rateUnit: string;
  category: string;
  sort: number;
  status: number;
}

// ============ Store Interface ============
interface ConfigState {
  // Data
  departments: Department[];
  dictItemsGrouped: Record<string, DictItem[]>;
  diseaseCategories: DiseaseCategory[];
  systemConfigs: Record<string, string>;
  mdroRuleTemplates: MdroRuleTemplate[];
  targetMonitoringItems: TargetMonitoringItem[];

  // Loading
  loading: boolean;
  loaded: boolean;

  // Actions
  loadAllConfigs: () => Promise<void>;

  // Helper getters
  getDeptNames: (type?: string) => string[];
  getDictNames: (category: string) => string[];
  getDictItems: (category: string) => DictItem[];
  getDiseaseCategory: (diseaseName: string) => string;
  getSystemConfig: (key: string, defaultValue?: string) => string;
}

// ============ Store ============
export const useConfigStore = create<ConfigState>((set, get) => ({
  // Data
  departments: [],
  dictItemsGrouped: {},
  diseaseCategories: [],
  systemConfigs: {},
  mdroRuleTemplates: [],
  targetMonitoringItems: [],

  // Loading
  loading: false,
  loaded: false,

  // Actions
  loadAllConfigs: async () => {
    if (get().loaded || get().loading) return;
    set({ loading: true });

    try {
      const [
        deptRes,
        dictRes,
        diseaseCatRes,
        sysConfigRes,
        mdroTemplateRes,
        targetMonitorRes,
      ] = await Promise.all([
        fetch('/api/departments?pageSize=100'),
        fetch('/api/dict-items?grouped=1'),
        fetch('/api/disease-categories?pageSize=200'),
        fetch('/api/system-configs?asMap=1'),
        fetch('/api/mdro-rule-templates?pageSize=50'),
        fetch('/api/target-monitoring-items?pageSize=50'),
      ]);

      const [deptData, dictData, diseaseCatData, sysConfigData, mdroTemplateData, targetMonitorData] =
        await Promise.all([
          deptRes.json(),
          dictRes.json(),
          diseaseCatRes.json(),
          sysConfigRes.json(),
          mdroTemplateRes.json(),
          targetMonitorRes.json(),
        ]);

      set({
        departments: deptData.success ? deptData.data.items : [],
        dictItemsGrouped: dictData.success ? dictData.data : {},
        diseaseCategories: diseaseCatData.success ? diseaseCatData.data.items : [],
        systemConfigs: sysConfigData.success ? sysConfigData.data : {},
        mdroRuleTemplates: mdroTemplateData.success ? mdroTemplateData.data.items : [],
        targetMonitoringItems: targetMonitorData.success ? targetMonitorData.data.items : [],
        loading: false,
        loaded: true,
      });
    } catch (error) {
      console.warn('Failed to load config data:', error);
      set({ loading: false, loaded: true });
    }
  },

  // Helper getters
  getDeptNames: (type?: string) => {
    const { departments } = get();
    const filtered = type
      ? departments.filter(d => d.type === type)
      : departments;
    return filtered.map(d => d.name);
  },

  getDictNames: (category: string) => {
    const { dictItemsGrouped } = get();
    const items = dictItemsGrouped[category] || [];
    return items.map(item => item.name);
  },

  getDictItems: (category: string) => {
    const { dictItemsGrouped } = get();
    return dictItemsGrouped[category] || [];
  },

  getDiseaseCategory: (diseaseName: string) => {
    const { diseaseCategories } = get();
    const found = diseaseCategories.find(dc => dc.diseaseName === diseaseName);
    return found?.category || '其他';
  },

  getSystemConfig: (key: string, defaultValue?: string) => {
    const { systemConfigs } = get();
    return systemConfigs[key] ?? defaultValue ?? '';
  },
}));
