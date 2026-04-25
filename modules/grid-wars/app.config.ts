export default {
  expo: {
    name: "grid-wars",
    slug: "gridwars",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "gridwars",
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/expo.icon",
    },
    android: {
      permissions: ["INTERNET", "ACCESS_BACKGROUND_LOCATION"],
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      predictiveBackGestureEnabled: false,
      package: "com.anonymous.gridwars",
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "@rnmapbox/maps",
      "expo-router",
      [
        "expo-splash-screen",
        {
          backgroundColor: "#208AEF",
          android: {
            image: "./assets/images/splash-icon.png",
            imageWidth: 76,
          },
        },
      ],
      [
        "react-native-maps",
        {
          iosGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
          androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_API_KEY,
        },
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "Allow $(PRODUCT_NAME) to use your location.",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "9ceda314-0130-4776-96de-09e8d9bda912",
      },
    },
    owner: "mikisheeshs-organization",
  },
};
