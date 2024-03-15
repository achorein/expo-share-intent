import Constants from "expo-constants";

export { ShareIntent } from "./ExpoShareIntentModule.types";

export const SHARE_EXTENSION_KEY = `${Constants.expoConfig?.scheme}ShareKey`;
export {
  getShareIntent,
  clearShareIntent,
  addChangeListener,
  addErrorListener,
} from "./ExpoShareIntentModule";

export { default as useShareIntent } from "./useShareIntent";
