import { requireOptionalNativeModule, NativeModule } from "expo-modules-core";

import {
  ChangeEventPayload,
  ErrorEventPayload,
  StateEventPayload,
} from "./ExpoShareIntentModule.types";

type ExpoShareIntentModuleEvents = {
  onError: (event: ErrorEventPayload) => void;
  onChange: (event: ChangeEventPayload) => void;
  onStateChange: (event: StateEventPayload) => void;
};

declare class ExpoShareIntentModuleType extends NativeModule<ExpoShareIntentModuleEvents> {
  getShareIntent(url: string): string;
  clearShareIntent(key: string): Promise<void>;
  hasShareIntent(key: string): Promise<boolean>;
}

// Import the native module. it will be resolved on native platforms to ExpoShareIntentModule.ts
// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
const ExpoShareIntentModule =
  requireOptionalNativeModule<ExpoShareIntentModuleType>(
    "ExpoShareIntentModule",
  );
export default ExpoShareIntentModule;
