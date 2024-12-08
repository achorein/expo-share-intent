import { AppRegistry } from "react-native";
import { ShareIntentViewWrapper } from "./ShareIntentViewWrapper";

export type {
  ShareIntent,
  ShareIntentFile,
} from "./ExpoShareIntentModule.types";

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

export const addShareIntentCustomView = ShareIntentViewWrapper;

export {
  ShareIntentProvider,
  useShareIntentContext,
} from "./ShareIntentProvider";
