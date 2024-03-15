import {
  requireNativeModule,
  NativeModulesProxy,
  EventEmitter,
  Subscription,
} from "expo-modules-core";

import { SHARE_EXTENSION_KEY } from ".";
import { ChangeEventPayload } from "./ExpoShareIntentModule.types";

// Import the native module. it will be resolved on native platforms to ExpoShareIntentModule.ts
// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
const ExpoShareIntentModule = requireNativeModule("ExpoShareIntentModule");
export default ExpoShareIntentModule;

export function getShareIntent(url = ""): string {
  return ExpoShareIntentModule.getShareIntent(url);
}

export function clearShareIntent(key = SHARE_EXTENSION_KEY): string {
  return ExpoShareIntentModule.clearShareIntent(key);
}

const emitter = new EventEmitter(
  ExpoShareIntentModule ?? NativeModulesProxy.ExpoShareIntentModule,
);

export function addErrorListener(
  listener: (event: ChangeEventPayload) => void,
): Subscription {
  return emitter.addListener<ChangeEventPayload>("onError", listener);
}

export function addChangeListener(
  listener: (event: ChangeEventPayload) => void,
): Subscription {
  return emitter.addListener<ChangeEventPayload>("onChange", listener);
}
