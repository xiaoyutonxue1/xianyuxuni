import create from 'zustand';
import type { Product, ProductSelection } from '../types/product';

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
}

const useProductStore = create<ProductStore>((set) => {
  // 获取初始数据
  const initialState = getInitialState();
  
  return {
    ...initialState,
    
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