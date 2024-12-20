import type { ProductSelection, ProductSelectionStatus } from '../types/product';
import create from 'zustand';

// 从localStorage获取初始数据
const getInitialSelections = (): ProductSelection[] => {
  try {
    const savedSelections = localStorage.getItem('selections');
    return savedSelections ? JSON.parse(savedSelections) : [];
  } catch (error) {
    console.error('Failed to load selections from localStorage:', error);
    return [];
  }
};

// 保存数据到localStorage
const saveSelections = (selections: ProductSelection[]) => {
  try {
    localStorage.setItem('selections', JSON.stringify(selections));
  } catch (error) {
    console.error('Failed to save selections to localStorage:', error);
  }
};

interface SelectionStore {
  selections: ProductSelection[];
  setSelections: (selections: ProductSelection[]) => void;
  updateSelectionStatus: (id: string, status: ProductSelectionStatus) => void;
  deleteSelections: (ids: string[]) => void;
  updateSelection: (selection: ProductSelection) => void;
}

const useSelectionStore = create<SelectionStore>((set) => ({
  selections: getInitialSelections(),
  
  setSelections: (selections) => set({ selections }),
  
  updateSelectionStatus: (id, status) => set((state) => ({
    selections: state.selections.map((s) =>
      s.id === id ? { ...s, status } : s
    ),
  })),
  
  deleteSelections: (ids) => set((state) => ({
    selections: state.selections.filter((s) => !ids.includes(s.id))
  })),

  updateSelection: (selection) => set((state) => ({
    selections: state.selections.map((s) =>
      s.id === selection.id ? {
        ...s,
        ...selection,
        lastUpdated: new Date().toISOString(),
      } : s
    )
  })),
}));

export default useSelectionStore; 