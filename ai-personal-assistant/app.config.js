export default {
  expo: {
    name: "AI Personal Assistant",
    slug: "ai-personal-assistant",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.anonymous.aipersonalassistant"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.anonymous.aipersonalassistant"
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "webpack"
    },
    scheme: "ai-personal-assistant",
    extra: {
      eas: {
        projectId: "ce671093-4733-4813-86f1-b827ac4bb199"
      }
    },
    plugins: [
      "expo-camera",
      "expo-image-picker",
      "expo-av",
      "expo-notifications",
      "expo-file-system",
      "expo-document-picker"
    ]
  }
}; 