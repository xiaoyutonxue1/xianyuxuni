import type { ProductSelection, ProductSelectionStatus, ProductSourceStatus } from '../types/product';
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
  updateSourceStatus: (id: string, source_status: ProductSourceStatus) => void;
  deleteSelections: (ids: string[]) => void;
  updateSelection: (selection: ProductSelection) => void;
  addSelection: (selection: Partial<ProductSelection> & { id: string }) => void;
}

const useSelectionStore = create<SelectionStore>((set) => ({
  selections: getInitialSelections(),
  
  setSelections: (selections) => set({ selections }),
  
  updateSelectionStatus: (id, status) => set((state) => ({
    selections: state.selections.map((s) =>
      s.id === id ? { ...s, status } : s
    ),
  })),
  
  updateSourceStatus: (id, source_status) => set((state) => {
    const newSelections = state.selections.map((s) =>
      s.id === id ? { ...s, source_status } : s
    );
    saveSelections(newSelections);
    return { selections: newSelections };
  }),
  
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

  addSelection: (selection) => set((state) => {
    const existingSelection = state.selections.find(s => s.id === selection.id);
    if (existingSelection) {
      // 如果已存在，则更新
      const newSelections = state.selections.map(s =>
        s.id === selection.id ? { ...s, ...selection } : s
      );
      saveSelections(newSelections);
      return { selections: newSelections };
    } else {
      // 如果不存在，则添加新的
      const newSelections = [...state.selections, selection as ProductSelection];
      saveSelections(newSelections);
      return { selections: newSelections };
    }
  }),
}));

export default useSelectionStore; 