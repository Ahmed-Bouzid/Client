const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Chemin absolu vers shared-api LOCAL (restauré depuis backup)
const sharedApiPath = path.resolve(__dirname, "./shared-api");

config.watchFolders = [sharedApiPath];

config.resolver = {
	...config.resolver,
	extraNodeModules: {
		...config.resolver.extraNodeModules,
		"shared-api": sharedApiPath,
	},
	// Permettre à Metro de résoudre les modules depuis CLIENT-end/node_modules
	// même quand il est dans shared-api/
	nodeModulesPaths: [
		path.resolve(__dirname, "node_modules"),
		path.resolve(__dirname, "shared-api/node_modules"),
	],
};

module.exports = config;
