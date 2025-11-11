// CLIENT-end/metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ajoute shared-api aux racines
config.watchFolders = [...config.watchFolders, "../shared-api"];

// Résout les modules depuis shared-api
config.resolver.extraNodeModules = {
	...config.resolver.extraNodeModules,
	"shared-api": "../shared-api",
};

module.exports = config;
