import { create } from 'zustand';
import type { ProductSelection } from '../types/product';

interface SelectionStore {
  // 选品数据
  selections: ProductSelection[];
  
  // 操作方法
  setSelections: (selections: ProductSelection[]) => void;
  addSelection: (selection: ProductSelection) => void;
  updateSelection: (selection: ProductSelection) => void;
  removeSelection: (selectionId: string) => void;
  updateSelectionStatus: (selectionId: string, status: ProductSelection['status']) => void;
  
  // 查询方法
  getPendingSelections: () => ProductSelection[];
  getDistributedSelections: () => ProductSelection[];
  getSelectionById: (id: string) => ProductSelection | undefined;
}

const useSelectionStore = create<SelectionStore>((set, get) => ({
  selections: [],
  
  setSelections: (selections) => set({ selections }),
  
  addSelection: (selection) => set((state) => ({
    selections: [...state.selections, selection]
  })),
  
  updateSelection: (selection) => set((state) => ({
    selections: state.selections.map((s) => 
      s.id === selection.id ? { ...selection, lastUpdated: new Date().toISOString() } : s
    )
  })),
  
  removeSelection: (selectionId) => set((state) => ({
    selections: state.selections.filter((s) => s.id !== selectionId)
  })),

  updateSelectionStatus: (selectionId, status) => set((state) => ({
    selections: state.selections.map((s) =>
      s.id === selectionId ? { ...s, status, lastUpdated: new Date().toISOString() } : s
    )
  })),

  // 查询方法实现
  getPendingSelections: () => {
    const state = get();
    return state.selections.filter(s => s.status === 'pending');
  },

  getDistributedSelections: () => {
    const state = get();
    return state.selections.filter(s => s.status === 'distributed');
  },

  getSelectionById: (id) => {
    const state = get();
    return state.selections.find(s => s.id === id);
  },
}));

export default useSelectionStore; 