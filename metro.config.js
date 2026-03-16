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
	// Sur web : remplacer les modules natifs incompatibles par des stubs vides
	resolveRequest: (context, moduleName, platform) => {
		if (platform === "web") {
			const webStubs = {
				"@stripe/stripe-react-native": path.resolve(__dirname, "stubs/stripe-react-native.js"),
				"react-native-view-shot": path.resolve(__dirname, "stubs/view-shot.js"),
				"expo-sharing": path.resolve(__dirname, "stubs/expo-sharing.js"),
			};
			if (webStubs[moduleName]) {
				return { filePath: webStubs[moduleName], type: "sourceFile" };
			}
		}
		return context.resolveRequest(context, moduleName, platform);
	},
};

module.exports = config;
