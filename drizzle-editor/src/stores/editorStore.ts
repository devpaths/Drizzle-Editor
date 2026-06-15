import { create } from "zustand";

interface EditorState {
  selectedTableId: string | null;
  openTableEditor: (tableId: string) => void;
  closeTableEditor: () => void;
  fitViewRequest: number;
  requestFitView: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedTableId: null,
  openTableEditor: (tableId) => set({ selectedTableId: tableId }),
  closeTableEditor: () => set({ selectedTableId: null }),

  fitViewRequest: 0,
  requestFitView: () => set((s) => ({ fitViewRequest: s.fitViewRequest + 1 })),
}));
