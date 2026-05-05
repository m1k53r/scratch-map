import { Light } from "@rnmapbox/maps";
import { defaultConfig } from "@tamagui/config/v5";
import { createTamagui } from "tamagui";

// default config for now, should we customize it?
export const config = createTamagui({
  ...defaultConfig,
  themes: {
    light: {
      name: "light",
      background: "#fff",
      color: "red",
    },
    dark: {
      name: "dark",
      background: "#000",
      color: "#fff",
    },
  },
});
