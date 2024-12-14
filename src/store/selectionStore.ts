import { create } from 'zustand';
import type { ProductSelection } from '../types/product';

interface SelectionStore {
  selections: ProductSelection[];
  addSelection: (selection: ProductSelection) => void;
  updateSelectionStatus: (id: string, status: ProductSelection['status'], distributedAt?: string) => void;
  deleteSelections: (ids: string[]) => void;
}

const useSelectionStore = create<SelectionStore>((set) => ({
  selections: [],
  
  addSelection: (selection) => 
    set((state) => ({
      selections: [...state.selections, selection]
    })),
  
  updateSelectionStatus: (id, status, distributedAt) =>
    set((state) => ({
      selections: state.selections.map(selection =>
        selection.id === id
          ? { ...selection, status, distributedAt }
          : selection
      )
    })),
  
  deleteSelections: (ids) =>
    set((state) => ({
      selections: state.selections.filter(selection => !ids.includes(selection.id))
    }))
}));

export default useSelectionStore; 