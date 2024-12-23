import create from 'zustand';
import type { ProductSelection } from '../types/product';

interface ProductSelectionStore {
  productSelections: ProductSelection[];
  loading: boolean;
  setProductSelections: (selections: ProductSelection[]) => void;
  setLoading: (loading: boolean) => void;
  updateSelection: (selection: ProductSelection) => void;
}

const useProductSelectionStore = create<ProductSelectionStore>((set) => ({
  productSelections: [],
  loading: false,
  setProductSelections: (selections) => set({ productSelections: selections }),
  setLoading: (loading) => set({ loading }),
  updateSelection: (selection) => set((state) => ({
    productSelections: state.productSelections.map((item) =>
      item.id === selection.id ? selection : item
    ),
  })),
}));

export default useProductSelectionStore; 