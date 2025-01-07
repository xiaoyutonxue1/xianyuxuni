import { create } from 'zustand';
import { Product, Template, Store } from '../types';

interface State {
  products: Product[];
  templates: Template[];
  stores: Store[];
  setProducts: (products: Product[]) => void;
  setTemplates: (templates: Template[]) => void;
  setStores: (stores: Store[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  removeProduct: (id: string) => void;
  addTemplate: (template: Template) => void;
  updateTemplate: (id: string, template: Partial<Template>) => void;
  removeTemplate: (id: string) => void;
  updateStore: (id: string, store: Partial<Store>) => void;
}

export const useStore = create<State>((set) => ({
  products: [],
  templates: [],
  stores: [],
  setProducts: (products) => set({ products }),
  setTemplates: (templates) => set({ templates }),
  setStores: (stores) => set({ stores }),
  addProduct: (product) =>
    set((state) => ({ products: [...state.products, product] })),
  updateProduct: (id, product) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id ? { ...p, ...product } : p
      ),
    })),
  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),
  addTemplate: (template) =>
    set((state) => ({ templates: [...state.templates, template] })),
  updateTemplate: (id, template) =>
    set((state) => ({
      templates: state.templates.map((t) =>
        t.id === id ? { ...t, ...template } : t
      ),
    })),
  removeTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    })),
  updateStore: (id, store) =>
    set((state) => ({
      stores: state.stores.map((s) =>
        s.id === id ? { ...s, ...store } : s
      ),
    })),
}));