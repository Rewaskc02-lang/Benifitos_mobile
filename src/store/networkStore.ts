import { create } from 'zustand';

type NetworkState = {
  isOffline: boolean;
  setIsOffline: (status: boolean) => void;
};

export const useNetworkStore = create<NetworkState>((set) => ({
  isOffline: false,
  setIsOffline: (isOffline) => set({ isOffline }),
}));
