const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;

// Map the old package name used by some libraries (like older aws-amplify bundles)
// to the currently maintained package. This helps Metro resolve imports that
// reference "@react-native-community/netinfo" when the project installs
// "@react-native-netinfo/netinfo" instead.
const extraNodeModules = {
  '@react-native-community/netinfo': path.resolve(
    projectRoot,
    'node_modules',
    '@react-native-netinfo',
    'netinfo'
  ),
};

// Export a plain object. Metro expects a synchronous config object.
const config = getDefaultConfig(projectRoot);
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = Object.assign(
  {},
  config.resolver.extraNodeModules || {},
  extraNodeModules
);

module.exports = config;
