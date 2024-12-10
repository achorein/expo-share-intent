export type CustomParameter = { [key: string]: string };

export type Parameters = {
  iosActivationRules?: { [key: string]: number | boolean | string } | string;
  iosShareExtensionName?: string;
  iosAppGroupIdentifier?: string;
  iosShareExtensionBundleIdentifier?: string;
  experimentialIosCustomView?: boolean;
  androidMainActivityAttributes?: CustomParameter;
  androidIntentFilters?: ("text/*" | "image/*" | "video/*" | "*/*")[];
  androidMultiIntentFilters?: ("image/*" | "video/*" | "*/*")[];
  disableExperimental?: boolean;
  disableAndroid?: boolean;
  disableIOS?: boolean;
};
