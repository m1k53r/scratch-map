import { create } from "zustand";

type Theme = "light" | "dark";

type State = {
  theme: Theme;
};

type Action = {
  setTheme: (theme: Theme) => void;
};

export const useTheme = create<State & Action>((set) => ({
  theme: "light",
  setTheme: (theme) => set({ theme }),
}));
