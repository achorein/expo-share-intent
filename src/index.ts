import { AppRegistry } from "react-native";
import { ShareIntentViewComponent } from "./ShareIntentViewComponent";

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

AppRegistry.registerComponent(
  "ShareIntentViewComponent",
  () => ShareIntentViewComponent,
);

export {
  ShareIntentProvider,
  useShareIntentContext,
} from "./ShareIntentProvider";
