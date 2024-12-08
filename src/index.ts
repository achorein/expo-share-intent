import { AppRegistry } from "react-native";
import { ShareIntentViewComponent } from "./ShareIntentViewComponent";

export type {
  ShareIntent,
  ShareIntentFile,
} from "./ExpoShareIntentModule.types";

export { default as ShareIntentModule } from "./ExpoShareIntentModule";

export { default as useShareIntent, parseShareIntent } from "./useShareIntent";

export { getScheme, getShareExtensionKey } from "./utils";

AppRegistry.registerComponent(
  "ShareIntentViewComponent",
  () => ShareIntentViewComponent,
);

export {
  ShareIntentProvider,
  useShareIntentContext,
} from "./ShareIntentProvider";
