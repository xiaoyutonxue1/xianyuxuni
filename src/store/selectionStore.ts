import { create } from 'zustand';
import type { ProductSelection } from '../types/product';

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
  addSelection: (selection: ProductSelection) => void;
  updateSelectionStatus: (id: string, status: ProductSelection['status'], distributedAt?: string) => void;
  deleteSelections: (ids: string[]) => void;
}

const useSelectionStore = create<SelectionStore>((set) => ({
  selections: getInitialSelections(),
  
  addSelection: (selection) => 
    set((state) => {
      const newSelections = [...state.selections, selection];
      saveSelections(newSelections);
      return { selections: newSelections };
    }),
  
  updateSelectionStatus: (id, status, distributedAt) =>
    set((state) => {
      const newSelections = state.selections.map(selection =>
        selection.id === id
          ? { ...selection, status, distributedAt }
          : selection
      );
      saveSelections(newSelections);
      return { selections: newSelections };
    }),
  
  deleteSelections: (ids) =>
    set((state) => {
      const newSelections = state.selections.filter(selection => !ids.includes(selection.id));
      saveSelections(newSelections);
      return { selections: newSelections };
    })
}));

export default useSelectionStore; 