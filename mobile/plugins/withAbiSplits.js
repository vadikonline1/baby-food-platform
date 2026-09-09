// Config plugin Expo: imparte APK-ul universal (~85MB, 4 ABI-uri) in APK-uri
// per-arhitectura (~35-45MB). Updaterul din aplicatie alege assetul arm64-v8a.
// Doar ABI-urile reale de telefoane (fara x86/x86_64 de emulator).
const { withAppBuildGradle } = require('@expo/config-plugins');

const SPLITS = `
    splits {
        abi {
            enable true
            reset()
            include 'arm64-v8a', 'armeabi-v7a'
            universalApk false
        }
    }
`;

module.exports = function withAbiSplits(config) {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes('universalApk false')) {
      config.modResults.contents = config.modResults.contents.replace(
        /(\n\s*android\s*\{)/,
        `$1${SPLITS}`
      );
    }
    return config;
  });
};
