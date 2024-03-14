import Constants from "expo-constants";
import { useURL } from "expo-linking";
import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import {
  addChangeListener,
  addErrorListener,
  getShareIntent,
} from "./ExpoShareIntentModule";
import {
  AndroidShareIntent,
  IosShareIntent,
  ShareIntent,
} from "./ExpoShareIntentModule.types";

const detaultValue: ShareIntent = { files: null, text: null };

const parseShareIntent = (value): ShareIntent => {
  if (!value) return detaultValue;
  let shareIntent: AndroidShareIntent | IosShareIntent;
  if (typeof value === "string") {
    shareIntent = JSON.parse(value); // iOS
  } else if (Array.isArray(value)) {
    shareIntent = { files: value }; // Android
  } else {
    shareIntent = value;
  }
  if (shareIntent.text) {
    return {
      ...detaultValue,
      text: shareIntent.text,
    };
  }
  return {
    ...detaultValue,
    files:
      shareIntent?.files?.map((f) => ({
        path: f.path || f.contentUri,
        type: f.type || f.mimeType,
        fileName: f.fileName,
      })) || null,
  };
};

export default function useShareIntent(
  options: { debug: boolean } = { debug: false },
) {
  const url = useURL();

  const appState = useRef(AppState.currentState);
  const [shareIntent, setSharedIntent] = useState<ShareIntent>(detaultValue);
  const [error, setError] = useState<string>();

  const resetShareIntent = () => setSharedIntent(detaultValue);

  /**
   * Call native module on universal linking url change
   */
  const refreshShareIntent = () => {
    if (url?.startsWith(`${Constants.expoConfig?.scheme}://dataUrl`)) {
      // iOS only
      getShareIntent(url);
    } else if (Platform.OS === "android") {
      getShareIntent();
    }
  };

  useEffect(() => {
    options.debug &&
      console.debug("useShareIntent[mount]", Constants.expoConfig?.scheme);
    refreshShareIntent();
  }, [url]);

  /**
   * Handle application state (active, background, inactive)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        options.debug && console.debug("useShareIntent[active] refresh intent");
        refreshShareIntent();
      } else if (
        appState.current === "active" &&
        ["inactive", "background"].includes(nextAppState)
      ) {
        options.debug &&
          console.debug("useShareIntent[to-background] reset intent");
        resetShareIntent();
      }
      appState.current = nextAppState;
    });
    return () => {
      subscription.remove();
    };
  }, [url]);

  /**
   * Detect Native Module response
   */
  useEffect(() => {
    const changeSubscription = addChangeListener((event) => {
      options.debug && console.debug("useShareIntent[onChange]", event);
      setSharedIntent(parseShareIntent(event.value));
    });
    const errorSubscription = addErrorListener((event) => {
      options.debug && console.debug("useShareIntent[error]", event?.value);
      setError(event?.value);
    });
    return () => {
      changeSubscription.remove();
      errorSubscription.remove();
    };
  }, []);

  return {
    hasShareIntent: !!(shareIntent?.text || shareIntent?.files),
    shareIntent,
    resetShareIntent,
    error,
  };
}
