import Constants from "expo-constants";
import { useURL } from "expo-linking";
import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import {
  addChangeListener,
  addErrorListener,
  clearShareIntent,
  getShareIntent,
} from "./ExpoShareIntentModule";
import {
  AndroidShareIntent,
  IosShareIntent,
  ShareIntent,
  ShareIntentOptions,
} from "./ExpoShareIntentModule.types";

export const SHAREINTENT_DEFAULTVALUE: ShareIntent = {
  files: null,
  text: null,
};

export const SHAREINTENT_OPTIONS_DEFAULT: ShareIntentOptions = {
  debug: false,
  resetOnBackground: true,
};

const parseShareIntent = (value): ShareIntent => {
  if (!value) return SHAREINTENT_DEFAULTVALUE;
  let shareIntent: AndroidShareIntent | IosShareIntent;
  if (typeof value === "string") {
    shareIntent = JSON.parse(value.replaceAll("\n", "\\n")); // iOS
  } else if (Array.isArray(value)) {
    shareIntent = { files: value }; // Android
  } else {
    shareIntent = value;
  }
  if (shareIntent.text) {
    return {
      ...SHAREINTENT_DEFAULTVALUE,
      text: shareIntent.text,
    };
  }
  return {
    ...SHAREINTENT_DEFAULTVALUE,
    files:
      shareIntent?.files?.map((f) => ({
        path: f.path || f.contentUri,
        type: f.type || f.mimeType,
        fileName: f.fileName,
      })) || null,
  };
};

export default function useShareIntent(
  options: ShareIntentOptions = SHAREINTENT_OPTIONS_DEFAULT,
) {
  const url = useURL();

  const appState = useRef(AppState.currentState);
  const [shareIntent, setSharedIntent] = useState<ShareIntent>(
    SHAREINTENT_DEFAULTVALUE,
  );
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const resetShareIntent = () => {
    setError(null);
    clearShareIntent();
    if (shareIntent?.text || shareIntent?.files) {
      setSharedIntent(SHAREINTENT_DEFAULTVALUE);
      options.onResetShareIntent?.();
    }
  };

  /**
   * Call native module on universal linking url change
   */
  const refreshShareIntent = () => {
    options.debug && console.debug("useShareIntent[refresh]", url);
    if (url?.startsWith(`${Constants.expoConfig?.scheme}://dataUrl`)) {
      // iOS only
      getShareIntent(url);
    } else if (Platform.OS === "android") {
      getShareIntent();
    }
  };

  useEffect(() => {
    options.debug &&
      console.debug(
        "useShareIntent[mount]",
        Constants.expoConfig?.scheme,
        options,
      );
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
        options.resetOnBackground !== false &&
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
  }, [url, shareIntent]);

  /**
   * Detect Native Module response
   */
  useEffect(() => {
    const changeSubscription = addChangeListener((event) => {
      options.debug && console.debug("useShareIntent[onChange]", event);
      try {
        setSharedIntent(parseShareIntent(event.value));
      } catch (e) {
        options.debug && console.error("useShareIntent[onChange]", e);
        setError("Cannot parse share intent value !");
      }
    });
    const errorSubscription = addErrorListener((event) => {
      options.debug && console.debug("useShareIntent[error]", event?.value);
      setError(event?.value);
    });
    setIsReady(true);
    return () => {
      changeSubscription.remove();
      errorSubscription.remove();
    };
  }, []);

  return {
    isReady,
    hasShareIntent: !!(shareIntent?.text || shareIntent?.files),
    shareIntent,
    resetShareIntent,
    error,
  };
}
