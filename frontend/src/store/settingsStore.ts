import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ProductTemplate {
  id: string;
  name: string;
  title: string;
  description: string;
  isDefault?: boolean;
}

export interface StoreAccount {
  id: string;
  name: string;
  platform: string;
  watermarkText?: string;
  watermarkSettings?: {
    fontSize?: number;
    opacity?: number;
    position?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    rotation?: number;
    mode?: 'single' | 'tile';
    color?: string;
  };
  features: {
    templates: ProductTemplate[];
  };
}

export interface StoreGroup {
  id: string;
  name: string;
  storeIds: string[];
}

export interface DeliveryMethodSetting {
  id: string;
  name: string;
  value: string;
  isEnabled: boolean;
  pattern?: string;
  example?: string;
  placeholder?: string;
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
  deliveryMethods: DeliveryMethodSetting[];
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

const defaultDeliveryMethods: DeliveryMethodSetting[] = [
  {
    id: 'baiduDisk',
    name: '百度网盘链接',
    value: 'baiduDisk',
    isEnabled: true,
    pattern: '^https?://pan\\.baidu\\.com/s/[a-zA-Z0-9_-]+$',
    example: '示例: https://pan.baidu.com/s/abc123',
    placeholder: '请输入百度网盘分享链接'
  },
  {
    id: 'baiduDiskGroup',
    name: '百度网盘群链接',
    value: 'baiduDiskGroup',
    isEnabled: true,
    pattern: '^https?://pan\\.baidu\\.com/s/[a-zA-Z0-9_-]+$',
    example: '示例: https://pan.baidu.com/s/abc123',
    placeholder: '请输入百度网盘群分享链接'
  },
  {
    id: 'baiduDiskGroupCode',
    name: '百度网盘群口令',
    value: 'baiduDiskGroupCode',
    isEnabled: true,
    pattern: '^[a-zA-Z0-9]{4}$',
    example: '示例: abc1',
    placeholder: '请输入4位提取码'
  },
  {
    id: 'quarkDisk',
    name: '夸克网盘链接',
    value: 'quarkDisk',
    isEnabled: true,
    pattern: '^https?://pan\\.quark\\.cn/s/[a-zA-Z0-9]+$',
    example: '示例: https://pan.quark.cn/s/abc123',
    placeholder: '请输入夸克网盘分享链接'
  },
  {
    id: 'quarkDiskGroup',
    name: '夸克网盘群链接',
    value: 'quarkDiskGroup',
    isEnabled: true,
    pattern: '^https?://pan\\.quark\\.cn/s/[a-zA-Z0-9]+$',
    example: '示例: https://pan.quark.cn/s/abc123',
    placeholder: '请输入夸克网盘群分享链接'
  }
];

const defaultStores: StoreAccount[] = [
  {
    id: '1',
    name: '水城有趣的海鲜',
    platform: '闲鱼',
    features: {
      priceAdjustment: 0.1,
      templates: [
        {
          id: '1',
          name: '标准模板',
          title: '【正版资源】{title}',
          description: '✨ {description}\n\n💫 发货方式：网盘自动发货\n🌟 售后服务：终身有效',
          isDefault: true
        },
        {
          id: '2',
          name: '促销模板',
          title: '【限时特惠】{title}',
          description: '🔥 限时优惠\n✨ {description}\n\n💫 自动发货\n🌟 永久有效'
        }
      ]
    }
  },
  {
    id: '2',
    name: '巨全资料库',
    platform: '闲鱼',
    features: {
      priceAdjustment: 0,
      templates: [
        {
          id: '1',
          name: '默认模板',
          title: '【超值优惠】{title}',
          description: '📚 {description}\n\n⚡ 自动发货\n💎 永久有效',
          isDefault: true
        }
      ]
    }
  }
];

const defaultCategories = [
  '学习资料',
  '日剧',
  '美剧',
  '漫画',
  '韩剧',
  '国内电视剧',
  '动漫',
  '电子书',
  '电影'
];

export const useSettingsStore = create(
  persist<SettingsState & SettingsActions>(
    (set, get) => ({
      storeAccounts: defaultStores,
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
        categories: defaultCategories,
        deliveryMethods: defaultDeliveryMethods,
        defaultSpecName: '发货网盘',
      },
      updateStoreAccount: (id: string, data: Partial<StoreAccount>) => {
        try {
          const storeAccounts = get().storeAccounts;
          const index = storeAccounts.findIndex(account => account.id === id);
          
          if (index === -1) {
            console.warn('Store account not found:', id);
            return false;
          }

          // 深度合并水印设置
          const currentAccount = storeAccounts[index];
          const updatedAccount = {
            ...currentAccount,
            ...data,
            watermarkSettings: {
              ...currentAccount.watermarkSettings,
              ...(data.watermarkSettings || {}),
              lastUpdated: new Date().toISOString()
            }
          };
          
          const updatedAccounts = [
            ...storeAccounts.slice(0, index),
            updatedAccount,
            ...storeAccounts.slice(index + 1)
          ];
          
          // 先更新状态
          set({ storeAccounts: updatedAccounts });
          
          // 再保存到localStorage
          try {
            const currentState = get();
            const stateToSave = {
              storeAccounts: updatedAccounts,
              productSettings: currentState.productSettings,
              storeGroups: currentState.storeGroups
            };

            console.log('Saving state:', stateToSave);

            return true;
          } catch (e) {
            console.error('Failed to save settings:', e);
            return false;
          }
        } catch (error) {
          console.error('Failed to update store account:', error);
          return false;
        }
      }
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        storeAccounts: state.storeAccounts,
        productSettings: state.productSettings,
        storeGroups: state.storeGroups
      })
    }
  )
);

export default useSettingsStore; 