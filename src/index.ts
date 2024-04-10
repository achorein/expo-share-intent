import Constants from "expo-constants";

export { ShareIntent } from "./ExpoShareIntentModule.types";

export {
  hasShareIntent,
  getShareIntent,
  clearShareIntent,
  addChangeListener,
  addStateListener,
  addErrorListener,
} from "./ExpoShareIntentModule";

export { default as useShareIntent } from "./useShareIntent";

export { getScheme, getShareExtensionKey } from "./utils";

export {
  ShareIntentProvider,
  useShareIntentContext,
} from "./ShareIntentProvider";
