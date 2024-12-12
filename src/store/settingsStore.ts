import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface StoreAccount {
  id: string;
  name: string;
  platform: string;
  features: {
    priceAdjustment: number;
    customFields?: {
      slogan?: string;
      servicePromise?: string;
    };
  };
}

export interface StoreGroup {
  id: string;
  name: string;
  storeIds: string[];
}

export interface DeliveryMethod {
  id: string;
  name: string;
  value: string;
  isEnabled: boolean;
  fields: {
    id: string;
    name: string;
    key: string;
    type: 'text' | 'password' | 'textarea';
    placeholder?: string;
    required?: boolean;
  }[];
}

interface ProductSettings {
  defaultDistributeAccounts: string[];
  distributeSettings: {
    defaultStatus: 'draft' | 'ready' | 'pending';
    copyFields: string[];
    priceStrategy: {
      useAccountAdjustment: boolean;
      roundingRule: 'up' | 'down' | 'nearest';
      minimumMargin: number;
    };
    enableSmartContent: boolean;
  };
  categories: string[];
  deliveryMethods: DeliveryMethod[];
  defaultSpecName: string;
}

interface SettingsState {
  storeAccounts: StoreAccount[];
  storeGroups: StoreGroup[];
  productSettings: ProductSettings;
  addStoreAccount: (account: StoreAccount) => void;
  removeStoreAccount: (id: string) => void;
  updateStoreAccount: (id: string, account: Partial<StoreAccount>) => void;
  updateProductSettings: (settings: Partial<ProductSettings>) => void;
  addCategory: (category: string) => void;
  removeCategory: (category: string) => void;
  addStoreGroup: (group: StoreGroup) => void;
  updateStoreGroup: (id: string, group: Partial<StoreGroup>) => void;
  removeStoreGroup: (id: string) => void;
}

const defaultDeliveryMethods: DeliveryMethod[] = [
  {
    id: 'baidu_link',
    name: '百度网盘链接',
    value: 'baidu_link',
    isEnabled: true,
    fields: [
      {
        id: 'link',
        name: '网盘链接',
        key: 'link',
        type: 'text',
        placeholder: '请输入百度网盘链接',
        required: true,
      },
      {
        id: 'password',
        name: '提取码',
        key: 'password',
        type: 'text',
        placeholder: '请输入提取码',
        required: true,
      }
    ]
  },
  {
    id: 'baidu_group_link',
    name: '百度网盘群链接',
    value: 'baidu_group_link',
    isEnabled: true,
    fields: [
      {
        id: 'link',
        name: '群链接',
        key: 'link',
        type: 'text',
        placeholder: '请输入百度网盘群链接',
        required: true,
      }
    ]
  },
  {
    id: 'baidu_group_code',
    name: '百度网盘群口令',
    value: 'baidu_group_code',
    isEnabled: true,
    fields: [
      {
        id: 'code',
        name: '群口令',
        key: 'code',
        type: 'text',
        placeholder: '请输入百度网盘群口令',
        required: true,
      }
    ]
  },
  {
    id: 'quark_link',
    name: '夸克网盘链接',
    value: 'quark_link',
    isEnabled: true,
    fields: [
      {
        id: 'link',
        name: '网盘链接',
        key: 'link',
        type: 'text',
        placeholder: '请输入夸克网盘链接',
        required: true,
      },
      {
        id: 'password',
        name: '提取码',
        key: 'password',
        type: 'text',
        placeholder: '请输入提取码',
        required: true,
      }
    ]
  },
  {
    id: 'quark_group_link',
    name: '夸克网盘群链接',
    value: 'quark_group_link',
    isEnabled: true,
    fields: [
      {
        id: 'link',
        name: '群链接',
        key: 'link',
        type: 'text',
        placeholder: '请输入夸克网盘群链接',
        required: true,
      }
    ]
  }
];

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      storeAccounts: [],
      storeGroups: [],
      productSettings: {
        defaultDistributeAccounts: [],
        distributeSettings: {
          defaultStatus: 'draft',
          copyFields: [],
          priceStrategy: {
            useAccountAdjustment: true,
            roundingRule: 'up',
            minimumMargin: 0.1,
          },
          enableSmartContent: false,
        },
        categories: [],
        deliveryMethods: defaultDeliveryMethods,
        defaultSpecName: '发货网盘',
      },
      addStoreAccount: (account) =>
        set((state) => ({
          storeAccounts: [...state.storeAccounts, account],
        })),
      removeStoreAccount: (id) =>
        set((state) => ({
          storeAccounts: state.storeAccounts.filter((a) => a.id !== id),
          storeGroups: state.storeGroups.map(group => ({
            ...group,
            storeIds: group.storeIds.filter(storeId => storeId !== id)
          }))
        })),
      updateStoreAccount: (id, account) =>
        set((state) => ({
          storeAccounts: state.storeAccounts.map((a) =>
            a.id === id ? { ...a, ...account } : a
          ),
        })),
      updateProductSettings: (settings) =>
        set((state) => ({
          productSettings: {
            ...state.productSettings,
            ...settings,
          },
        })),
      addCategory: (category) =>
        set((state) => ({
          productSettings: {
            ...state.productSettings,
            categories: [...new Set([...state.productSettings.categories, category])].sort(),
          },
        })),
      removeCategory: (category) =>
        set((state) => ({
          productSettings: {
            ...state.productSettings,
            categories: state.productSettings.categories.filter((c) => c !== category),
          },
        })),
      addStoreGroup: (group) =>
        set((state) => ({
          storeGroups: [...state.storeGroups, group],
        })),
      updateStoreGroup: (id, group) =>
        set((state) => ({
          storeGroups: state.storeGroups.map((g) =>
            g.id === id ? { ...g, ...group } : g
          ),
        })),
      removeStoreGroup: (id) =>
        set((state) => ({
          storeGroups: state.storeGroups.filter((g) => g.id !== id),
        })),
    }),
    {
      name: 'settings-storage',
      version: 1,
    }
  )
);

export default useSettingsStore; 