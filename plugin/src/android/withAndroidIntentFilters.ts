/*!
 * Plugin created for Expo Share Intent (https://github.com/achorein/expo-share-intent)
 * author: achorein (https://github.com/achorein)
 *
 * inspired by: https://github.com/expo/expo/blob/main/packages/%40expo/config-plugins/src/android/IntentFilters.ts
 */
import {
  AndroidManifest,
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
} from "@expo/config-plugins";
import type { AndroidIntentFiltersData, Android } from "@expo/config-types";

import { Parameters } from "../types";

type AndroidIntentFilters = NonNullable<Android["intentFilters"]>;

// const GENERATED_TAG = "data-generated";

function renderIntentFilters(
  intentFilters: AndroidIntentFilters,
): AndroidConfig.Manifest.ManifestIntentFilter[] {
  return intentFilters.map((intentFilter) => {
    // <intent-filter>
    return {
      $: {
        "android:autoVerify": intentFilter.autoVerify ? "true" : undefined,
        // Add a custom "generated" tag that we can query later to remove.
        // [GENERATED_TAG]: "true",
      },
      action: [
        // <action android:name="android.intent.action.VIEW"/>
        {
          $: {
            "android:name": `${intentFilter.action}`,
          },
        },
      ],
      data: renderIntentFilterData(intentFilter.data),
      category: renderIntentFilterCategory(intentFilter.category),
    };
  });
}

function renderIntentFilterData(
  data: AndroidIntentFiltersData | AndroidIntentFiltersData[] | undefined,
) {
  return (Array.isArray(data) ? data : [data]).filter(Boolean).map((datum) => ({
    $: Object.entries(datum ?? {}).reduce(
      (prev, [key, value]) => ({ ...prev, [`android:${key}`]: value }),
      {},
    ),
  }));
}

function renderIntentFilterCategory(category: string | string[] | undefined) {
  return (Array.isArray(category) ? category : [category])
    .filter(Boolean)
    .map((category) => ({
      $: {
        "android:name": `${category}`,
      },
    }));
}

function addIntentFilters(
  androidManifest: AndroidManifest,
  currentIntentFilters: AndroidIntentFilters,
  filters: Parameters["androidIntentFilters"],
  multiFilters: Parameters["androidIntentFilters"],
) {
  const mainActivity =
    AndroidConfig.Manifest.getMainActivityOrThrow(androidManifest);

  // DEFAULT VALUE (text and url)
  const newFilters: Parameters["androidIntentFilters"] = filters || ["text/*"];

  console.debug(
    `[expo-share-intent] add android filters (${newFilters.join(" ")}) and multi-filters (${multiFilters ? multiFilters.join(" ") : ""})`,
  );
  const newIntentFilters = [
    {
      action: "android.intent.action.SEND",
      category: "android.intent.category.DEFAULT",
      data: newFilters.map((filter) => ({
        mimeType: filter,
      })),
    },
  ];
  const newMultiIntentFilters = multiFilters
    ? [
        {
          action: "android.intent.action.SEND_MULTIPLE",
          category: "android.intent.category.DEFAULT",
          data: multiFilters.map((filter) => ({
            mimeType: filter,
          })),
        },
      ]
    : [];

  const renderedNewIntentFilters = renderIntentFilters([
    ...newIntentFilters,
    ...newMultiIntentFilters,
  ]);

  // adds them properly to the manifest
  mainActivity["intent-filter"] = mainActivity["intent-filter"]?.concat(
    renderedNewIntentFilters,
  );

  return androidManifest;
}

export const withAndroidIntentFilters: ConfigPlugin<Parameters> = (
  config,
  parameters,
) => {
  return withAndroidManifest(config, (config) => {
    config.modResults = addIntentFilters(
      config.modResults,
      AndroidConfig.IntentFilters.getIntentFilters(config),
      parameters?.androidIntentFilters,
      parameters?.androidMultiIntentFilters,
    );
    return config;
  });
};
