const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const sharedPackagesRoot = path.resolve(projectRoot, "../../packages");
const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders ?? []), sharedPackagesRoot];

module.exports = config;
