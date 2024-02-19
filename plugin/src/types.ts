export type CustomParameter = { [key: string]: string };

export type Parameters = {
  iosActivationRules?: { [key: string]: number | boolean | string };
  androidMainActivityAttributes?: CustomParameter;
  androidIntentFilters?: Array<"text/*" | "image/*" | "*/*">;
  androidMultiIntentFilters?: Array<"text/*" | "image/*" | "*/*">;
};
