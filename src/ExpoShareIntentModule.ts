import {
  requireNativeModule,
  NativeModulesProxy,
  EventEmitter,
  Subscription,
} from "expo-modules-core";

import {
  ChangeEventPayload,
  StateEventPayload,
} from "./ExpoShareIntentModule.types";
import { getShareExtensionKey } from "./utils";

// Import the native module. it will be resolved on native platforms to ExpoShareIntentModule.ts
// It loads the native module object from the JSI or falls back to
// the bridge module (from NativeModulesProxy) if the remote debugger is on.
const ExpoShareIntentModule = requireNativeModule("ExpoShareIntentModule");
export default ExpoShareIntentModule;

export function getShareIntent(url = ""): string {
  return ExpoShareIntentModule.getShareIntent(url);
}

export function clearShareIntent(key: string) {
  return ExpoShareIntentModule.clearShareIntent(key ?? getShareExtensionKey());
}

export function hasShareIntent(key: string): boolean {
  return ExpoShareIntentModule.hasShareIntent(key ?? getShareExtensionKey());
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

export function addStateListener(
  listener: (event: StateEventPayload) => void,
): Subscription {
  return emitter.addListener<StateEventPayload>("onStateChange", listener);
}
