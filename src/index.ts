import Constants from "expo-constants";

export { ShareIntent } from "./ExpoShareIntentModule.types";

export const SHARE_EXTENSION_KEY = `${Constants.expoConfig?.scheme}ShareKey`;
export {
  hasShareIntent,
  getShareIntent,
  clearShareIntent,
  addChangeListener,
  addStateListener,
  addErrorListener,
} from "./ExpoShareIntentModule";

export { default as useShareIntent } from "./useShareIntent";
export {
  ShareIntentProvider,
  useShareIntentContext,
} from "./ShareIntentProvider";
