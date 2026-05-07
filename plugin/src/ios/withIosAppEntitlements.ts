"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAppEntitlements = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const constants_1 = require("./constants");
const withAppEntitlements = (config, parameters) => {
    return (0, config_plugins_1.withEntitlementsPlist)(config, async (config) => {
      const appIdentifier = config.ios?.bundleIdentifier;
      const existing = config.modResults["com.apple.security.application-groups"] ?? [];
      config.modResults["com.apple.security.application-groups"] = [
        (0, constants_1.getAppGroup)(appIdentifier, parameters),
        ...existing,
      ];
      return config;
    });
};
exports.withAppEntitlements = withAppEntitlements;
