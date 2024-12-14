import create from 'zustand';
import type { Product, ProductSelection } from '../types/product';

interface ProductStore {
  // 商品数据
  products: Product[];
  selections: ProductSelection[];
  
  // 操作方法
  addProducts: (products: Product[]) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (productId: string) => void;
  setSelections: (selections: ProductSelection[]) => void;
  updateSelection: (selection: ProductSelection) => void;
}

const useProductStore = create<ProductStore>((set) => ({
  products: [],
  selections: [],
  
  addProducts: (products) => set((state) => ({
    products: [...state.products, ...products]
  })),
  
  updateProduct: (product) => set((state) => ({
    products: state.products.map((p) => 
      p.id === product.id ? product : p
    )
  })),
  
  removeProduct: (productId) => set((state) => ({
    products: state.products.filter((p) => p.id !== productId)
  })),
  
  setSelections: (selections) => set({ selections }),
  
  updateSelection: (selection) => set((state) => ({
    selections: state.selections.map((s) =>
      s.id === selection.id ? selection : s
    )
  })),
}));

export default useProductStore; 