import { mergeContents } from "@expo/config-plugins/build/utils/generateCode";
import { ConfigPlugin, withDangerousMod } from "@expo/config-plugins";
import fs from "fs";
import path from "path";
import semver from "semver";

import { Parameters } from "../types";
import { getShareExtensionName } from "./constants";

export const withPodfile: ConfigPlugin<Parameters> = (config, parameters) => {
  if (!parameters.experimentialIosCustomView) {
    return config;
  }
  const targetName = getShareExtensionName(parameters);
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const podFilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile",
      );
      let podfileContent = fs.readFileSync(podFilePath).toString();

      const postInstallBuildSettings = `    installer.pods_project.targets.each do |target|
      unless target.name == 'Sentry'
        target.build_configurations.each do |config|
          config.build_settings['APPLICATION_EXTENSION_API_ONLY'] = 'No'
        end
      end
    end`;

      podfileContent = mergeContents({
        tag: "post-install-build-settings",
        src: podfileContent,
        newSrc: postInstallBuildSettings,
        anchor: `react_native_post_install`,
        offset: 7,
        comment: "#",
      }).contents;

      // exclude expo-updates because it throws this error when the share extension is triggered
      const exclude = ["expo-updates"];

      const useExpoModules = `exclude = ["${exclude.join(`", "`)}"]
  use_expo_modules!(exclude: exclude)`;

      const expoVersion = semver.parse(config.sdkVersion);
      const majorVersion = expoVersion?.major ?? 0;

      const shareExtensionTarget = `

target '${targetName}' do     
  ${useExpoModules}
  
  if ENV['EXPO_USE_COMMUNITY_AUTOLINKING'] == '1'
    config_command = ['node', '-e', "process.argv=['', '', 'config'];require('@react-native-community/cli').run()"];
  else
    config_command = [
      'node',
      '--no-warnings',
      '--eval',
      'require(require.resolve(\\'expo-modules-autolinking\\', { paths: [require.resolve(\\'expo/package.json\\')] }))(process.argv.slice(1))',
      'react-native-config',
      '--json',
      '--platform',
      'ios'
    ]
  end

  config = use_native_modules!(config_command)
          
  use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym if podfile_properties['ios.useFrameworks']
  use_frameworks! :linkage => ENV['USE_FRAMEWORKS'].to_sym if ENV['USE_FRAMEWORKS']
          
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => podfile_properties['expo.jsEngine'] == nil || podfile_properties['expo.jsEngine'] == 'hermes',
    # An absolute path to your application root.
    :app_path => "#{Pod::Config.instance.installation_root}/..",${
      majorVersion >= 51
        ? `
    # Temporarily disable privacy file aggregation by default, until React
    # Native 0.74.2 is released with fixes.
    :privacy_file_aggregation_enabled => podfile_properties['apple.privacyManifestAggregationEnabled'] == 'true',`
        : ""
    }
  )
end`;

      // Find the very last 'end' in the file
      const lastEndIndex = podfileContent.lastIndexOf("end");
      if (lastEndIndex === -1) {
        throw new Error("Could not find the last 'end' in Podfile");
      }

      // Insert the share extension target after the last 'end'
      podfileContent =
        podfileContent.slice(0, lastEndIndex + 3) + // +3 to include "end"
        shareExtensionTarget +
        podfileContent.slice(lastEndIndex + 3);

      fs.writeFileSync(podFilePath, podfileContent);

      return config;
    },
  ]);
};
