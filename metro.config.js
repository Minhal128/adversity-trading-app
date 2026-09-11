const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Add buffer polyfill for react-native-svg
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer/'),
};

// Leaflet HTML asset for react-native-leaflet-view
config.resolver.assetExts = [...new Set([...(config.resolver.assetExts || []), 'html'])];

module.exports = withNativeWind(config, { input: "./global.css" });
