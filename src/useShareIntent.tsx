import { useURL } from "expo-linking";
import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import {
  addChangeListener,
  addErrorListener,
  clearShareIntent,
  getShareIntent,
} from "./ExpoShareIntentModule";
import { ShareIntent, ShareIntentOptions } from "./ExpoShareIntentModule.types";
import { getScheme, getShareExtensionKey, parseShareIntent } from "./utils";

export const SHAREINTENT_DEFAULTVALUE: ShareIntent = {
  files: null,
  text: null,
  webUrl: null,
  type: null,
};

export const SHAREINTENT_OPTIONS_DEFAULT: ShareIntentOptions = {
  debug: false,
  resetOnBackground: true,
  disabled: Platform.OS === "web",
};

const isValueAvailable = (shareIntent: ShareIntent) =>
  !!(shareIntent?.text || shareIntent?.webUrl || shareIntent?.files);

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

  const resetShareIntent = (clearNativeModule = true) => {
    if (options.disabled) return;
    setError(null);
    clearNativeModule && clearShareIntent(getShareExtensionKey(options));
    if (isValueAvailable(shareIntent)) {
      setSharedIntent(SHAREINTENT_DEFAULTVALUE);
      options.onResetShareIntent?.();
    }
  };

  /**
   * Call native module on universal linking url change
   */
  const refreshShareIntent = () => {
    options.debug && console.debug("useShareIntent[refresh]", url);
    if (url?.includes(`${getScheme(options)}://dataUrl=`)) {
      // iOS only
      getShareIntent(url);
    } else if (Platform.OS === "android") {
      getShareIntent();
    }
  };

  useEffect(() => {
    if (options.disabled) return;
    options.debug &&
      console.debug("useShareIntent[mount]", getScheme(options), options);
    refreshShareIntent();
  }, [url, options.disabled]);

  /**
   * Handle application state (active, background, inactive)
   */
  useEffect(() => {
    if (options.disabled) return;
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
  }, [url, shareIntent, options.disabled]);

  /**
   * Detect Native Module response
   */
  useEffect(() => {
    if (options.disabled) {
      options.debug &&
        console.debug("expo-share-intent module is disabled by configuration!");
      return;
    }
    const changeSubscription = addChangeListener((event) => {
      options.debug &&
        console.debug(
          "useShareIntent[onChange]",
          JSON.stringify(event, null, 2),
        );
      try {
        setSharedIntent(parseShareIntent(event.value, options));
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
      changeSubscription?.remove();
      errorSubscription?.remove();
    };
  }, [options.disabled]);

  return {
    isReady,
    hasShareIntent: isValueAvailable(shareIntent),
    shareIntent,
    resetShareIntent,
    error,
  };
}
