const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');

// Step 1: Get the default Expo Metro configuration
const config = getDefaultConfig(__dirname);

// Step 2: Apply NativeWind configuration
const nativeWindConfig = withNativeWind(config, { input: './global.css' });

// Step 3: Wrap the configuration with Reanimated
module.exports = wrapWithReanimatedMetroConfig(nativeWindConfig);