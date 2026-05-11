import { create } from 'zustand';
import type { Branch } from '../../models/branch';
import type { ChildProfile } from '../../models/child';
import type { DurationPackage } from '../../models/durationPackage';
import type { EntryPass } from '../../models/entryPass';
import type { ParentProfile } from '../../models/parent';

export interface WalkInDraft {
  location?: Branch;
  phone: string;
  parent?: ParentProfile | null;
  selectedChildren: ChildProfile[];
  newChildNames: string[];
  customerName: string;
  durationPackage?: DurationPackage;
  passes: EntryPass[];
  passIds: string[];
}

interface WalkInState extends WalkInDraft {
  updateDraft: (draft: Partial<WalkInDraft>) => void;
  resetDraft: () => void;
}

const initialState: WalkInDraft = {
  phone: '',
  parent: null,
  selectedChildren: [],
  newChildNames: [''],
  customerName: '',
  passes: [],
  passIds: []
};

export const useWalkInStore = create<WalkInState>((set) => ({
  ...initialState,
  updateDraft: (draft) => set((state) => ({ ...state, ...draft })),
  resetDraft: () => set(initialState)
}));
