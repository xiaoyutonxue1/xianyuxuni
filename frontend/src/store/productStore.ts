import create from 'zustand';
import type { Product, ProductSelection, DeliveryMethod } from '../types/product';

export interface ProductStore {
  // 商品数据
  products: Product[];
  selections: ProductSelection[];
  loading: boolean;
  
  // 操作方法
  addProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  setSelections: (selections: ProductSelection[]) => void;
  updateSelection: (selection: ProductSelection) => void;
  addSelection: (selection: ProductSelection) => void;
  removeSelection: (selectionId: string) => void;
  updateDeliveryMethods: () => void;
  setLoading: (loading: boolean) => void;
}

// 从localStorage获取初始数据
const getInitialState = () => {
  try {
    const savedProducts = localStorage.getItem('products');
    const savedSelections = localStorage.getItem('selections');
    return {
      products: savedProducts ? JSON.parse(savedProducts) : [],
      selections: savedSelections ? JSON.parse(savedSelections) : [],
      loading: false,
    };
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return {
      products: [],
      selections: [],
      loading: false,
    };
  }
};

// 保存数据到localStorage
const saveToLocalStorage = (key: string, value: any) => {
  try {
    // 尝试压缩数据以减少存储空间
    const serializedValue = JSON.stringify(value);
    localStorage.setItem(key, serializedValue);
  } catch (error) {
    if (error instanceof Error) {
      console.warn(`Failed to save to localStorage: ${error.message}`);
      
      try {
        // 如果是配额超出错误，尝试清理一些旧数据
        if (error.name === 'QuotaExceededError') {
          // 清理其他不重要的数据
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && !key.includes('products')) {
              localStorage.removeItem(key);
            }
          }
          
          // 再次尝试保存
          const serializedValue = JSON.stringify(value);
          localStorage.setItem(key, serializedValue);
        }
      } catch (e) {
        console.error('Failed to save even after clearing storage:', e);
        // 如果还是失败，可以考虑只保存最新的 n 条数据
        if (Array.isArray(value)) {
          const reducedValue = value.slice(-50); // 只保留最新的 50 条数据
          try {
            localStorage.setItem(key, JSON.stringify(reducedValue));
          } catch (e2) {
            console.error('Failed to save even with reduced data');
          }
        }
      }
    }
  }
};

const useProductStore = create<ProductStore>((set) => ({
  ...getInitialState(),
  addProducts: (products) => set((state) => {
    const newState = {
      ...state,
      products: [...state.products, ...products],
    };
    saveToLocalStorage('products', newState.products);
    return newState;
  }),
  addProduct: (product) => set((state) => {
    const newState = {
      ...state,
      products: [...state.products, product],
    };
    saveToLocalStorage('products', newState.products);
    return newState;
  }),
  updateProduct: (product) => set((state) => {
    const newState = {
      ...state,
      products: state.products.map((p) => (p.id === product.id ? product : p)),
    };
    saveToLocalStorage('products', newState.products);
    return newState;
  }),
  removeProduct: (productId) => set((state) => {
    const newState = {
      ...state,
      products: state.products.filter((p) => p.id !== productId),
    };
    saveToLocalStorage('products', newState.products);
    return newState;
  }),
  setSelections: (selections) => set((state) => {
    const newState = {
      ...state,
      selections,
    };
    saveToLocalStorage('selections', newState.selections);
    return newState;
  }),
  updateSelection: (selection) => set((state) => {
    const newState = {
      ...state,
      selections: state.selections.map((s) => (s.id === selection.id ? selection : s)),
    };
    saveToLocalStorage('selections', newState.selections);
    return newState;
  }),
  addSelection: (selection) => set((state) => {
    const newState = {
      ...state,
      selections: [...state.selections, selection],
    };
    saveToLocalStorage('selections', newState.selections);
    return newState;
  }),
  removeSelection: (selectionId) => set((state) => {
    const newState = {
      ...state,
      selections: state.selections.filter((s) => s.id !== selectionId),
    };
    saveToLocalStorage('selections', newState.selections);
    return newState;
  }),
  updateDeliveryMethods: () => set((state) => {
    const deliveryMethodMap: Record<string, DeliveryMethod> = {
      'baiduDisk': '百度网盘链接',
      'baiduDiskGroup': '百度网盘群链接',
      'baiduDiskGroupCode': '百度网盘群口令',
      'quarkDisk': '夸克网盘链接',
      'quarkDiskGroup': '夸克网盘群链接'
    };

    const updatedProducts = state.products.map(product => {
      if (product.deliveryMethod && product.deliveryMethod in deliveryMethodMap) {
        return {
          ...product,
          deliveryMethod: deliveryMethodMap[product.deliveryMethod as keyof typeof deliveryMethodMap],
          lastUpdated: new Date().toISOString()
        };
      }
      return product;
    });

    const updatedSelections = state.selections.map(selection => {
      if (selection.deliveryMethod && selection.deliveryMethod in deliveryMethodMap) {
        return {
          ...selection,
          deliveryMethod: deliveryMethodMap[selection.deliveryMethod as keyof typeof deliveryMethodMap]
        };
      }
      if (selection.specs) {
        return {
          ...selection,
          specs: selection.specs.map(spec => {
            if (spec.deliveryMethod && spec.deliveryMethod in deliveryMethodMap) {
              return {
                ...spec,
                deliveryMethod: deliveryMethodMap[spec.deliveryMethod as keyof typeof deliveryMethodMap]
              };
            }
            return spec;
          })
        };
      }
      return selection;
    });

    const newState = {
      ...state,
      products: updatedProducts,
      selections: updatedSelections,
    };
    saveToLocalStorage('products', newState.products);
    saveToLocalStorage('selections', newState.selections);
    return newState;
  }),
  setLoading: (loading) => set({ loading }),
}));

export type State = ReturnType<typeof useProductStore>;
export default useProductStore; 