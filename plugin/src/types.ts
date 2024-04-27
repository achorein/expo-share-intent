export type CustomParameter = { [key: string]: string };

export type Parameters = {
  iosActivationRules?: { [key: string]: number | boolean | string };
  androidMainActivityAttributes?: CustomParameter;
  androidIntentFilters?: ("text/*" | "image/*" | "video/*" | "*/*")[];
  androidMultiIntentFilters?: ("image/*" | "video/*" | "*/*")[];
  disableExperimental?: boolean;
};
