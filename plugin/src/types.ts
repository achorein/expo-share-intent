export type CustomParameter = { [key: string]: string };

export type Parameters = {
  iosActivationRules?: { [key: string]: number | boolean | string } | string;
  iosShareExtensionName?: string;
  iosAppGroupIdentifier?: string;
  androidMainActivityAttributes?: CustomParameter;
  androidIntentFilters?: ("text/*" | "image/*" | "video/*" | "*/*")[];
  androidMultiIntentFilters?: ("image/*" | "video/*" | "*/*")[];
  disableExperimental?: boolean;
  disableAndroid?: boolean;
  disableIOS?: boolean;
};
