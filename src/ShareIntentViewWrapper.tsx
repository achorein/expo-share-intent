import { AppRegistry } from "react-native";
import { ShareIntentViewComponent } from "./ShareIntentViewComponent";

export const ShareIntentViewWrapper = (props: { logoSource?: any } = {}) => {
  AppRegistry.registerComponent(
    "ShareIntentViewComponent",
    () => (extensionProps) => (
      <ShareIntentViewComponent {...props} rawShareIntent={extensionProps} />
    ),
  );
};
