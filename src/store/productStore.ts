import create from 'zustand';
import type { Product, ProductSelection, DeliveryMethod } from '../types/product';

// 从localStorage获取初始数据
const getInitialState = () => {
  try {
    const savedProducts = localStorage.getItem('products');
    const savedSelections = localStorage.getItem('selections');
    return {
      products: savedProducts ? JSON.parse(savedProducts) : [],
      selections: savedSelections ? JSON.parse(savedSelections) : [],
    };
  } catch (error) {
    console.error('Failed to load data from localStorage:', error);
    return {
      products: [],
      selections: [],
    };
  }
};

// 保存数据到localStorage
const saveToLocalStorage = (state: { products: Product[]; selections: ProductSelection[] }) => {
  try {
    localStorage.setItem('products', JSON.stringify(state.products));
    localStorage.setItem('selections', JSON.stringify(state.selections));
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
  }
};

export interface ProductStore {
  // 商品数据
  products: Product[];
  selections: ProductSelection[];
  
  // 操作方法
  addProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  setSelections: (selections: ProductSelection[]) => void;
  updateSelection: (selection: ProductSelection) => void;
  addSelection: (selection: ProductSelection) => void;
  updateDeliveryMethods: () => void;
}

const useProductStore = create<ProductStore>((set) => {
  // 获取初始数据
  const initialState = getInitialState();
  
  return {
    ...initialState,
    
    // 更新所有商品的发货方式格式
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
        selections: updatedSelections
      };
      saveToLocalStorage(newState);
      return newState;
    }),

    addProducts: (products) => set((state) => {
      const newState = {
        ...state,
        products: [...state.products, ...products]
      };
      saveToLocalStorage(newState);
      return newState;
    }),
    
    addProduct: (product) => set((state) => {
      const newState = {
        ...state,
        products: [...state.products, product]
      };
      saveToLocalStorage(newState);
      return newState;
    }),
    
    updateProduct: (product) => set((state) => {
      const newState = {
        ...state,
        products: state.products.map((p) => 
          p.id === product.id ? {
            ...p,
            ...product,
            lastUpdated: new Date().toISOString(),
          } : p
        )
      };
      saveToLocalStorage(newState);
      return newState;
    }),
    
    removeProduct: (productId) => set((state) => {
      const newState = {
        ...state,
        products: state.products.filter((p) => p.id !== productId)
      };
      saveToLocalStorage(newState);
      return newState;
    }),
    
    setSelections: (selections) => set((state) => {
      const newState = { ...state, selections };
      saveToLocalStorage(newState);
      return newState;
    }),
    
    updateSelection: (selection) => set((state) => {
      const newState = {
        ...state,
        selections: state.selections.map((s) =>
          s.id === selection.id ? {
            ...s,
            ...selection,
            lastUpdated: new Date().toISOString(),
          } : s
        )
      };
      saveToLocalStorage(newState);
      return newState;
    }),

    addSelection: (selection) => set((state) => {
      const newState = {
        ...state,
        selections: [...state.selections, selection]
      };
      saveToLocalStorage(newState);
      return newState;
    }),
  };
});

export type State = ReturnType<typeof useProductStore>;
export default useProductStore; 