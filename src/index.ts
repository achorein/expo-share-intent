import Constants from "expo-constants";

export { ShareIntent } from "./ExpoShareIntentModule.types";

export const SHARE_EXTENSION_KEY = `${Constants.expoConfig?.scheme}Key`;

export {
  getShareIntent,
  addChangeListener,
  addErrorListener,
} from "./ExpoShareIntentModule";

export { default as useShareIntent } from "./useShareIntent";
