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
  NativeShareIntent,
  ShareIntent,
  ShareIntentFile,
  ShareIntentOptions,
} from "./ExpoShareIntentModule.types";

export const SHAREINTENT_DEFAULTVALUE: ShareIntent = {
  files: null,
  text: null,
  webUrl: null,
  type: null,
};

export const SHAREINTENT_OPTIONS_DEFAULT: ShareIntentOptions = {
  debug: false,
  resetOnBackground: true,
  disabled: false,
};

const IOS_SHARE_TYPE_MAPPING = {
  0: "media",
  1: "text",
  2: "weburl",
  3: "file",
};

const parseShareIntent = (value, options): ShareIntent => {
  let result = SHAREINTENT_DEFAULTVALUE;
  if (!value) return result;
  let shareIntent: NativeShareIntent;
  if (typeof value === "string") {
    shareIntent = JSON.parse(value.replaceAll("\n", "\\n")); // iOS
  } else {
    shareIntent = value; // Android
  }
  if (shareIntent.text) {
    const webUrl =
      shareIntent.text.match(
        /[(http(s)?)://(www.)?-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/gi,
      )?.[0] || null;
    result = {
      ...SHAREINTENT_DEFAULTVALUE,
      text: shareIntent.text,
      webUrl,
      type: webUrl ? "weburl" : "text",
    };
  } else {
    const files =
      // @ts-ignore
      shareIntent?.files?.filter((f: any) => f.path || f.contentUri) || [];
    const isMedia = files.every(
      (f) => f.mimeType.startsWith("image/") || f.mimeType.startsWith("video/"),
    );
    result = {
      ...SHAREINTENT_DEFAULTVALUE,
      files: shareIntent?.files
        ? // @ts-ignore
          shareIntent.files.reduce((acc: ShareIntentFile[], f: any) => {
            if (!f.path && !f.contentUri) return acc;
            return [
              ...acc,
              {
                path: f.path || f.contentUri || null,
                mimeType: f.mimeType || null,
                fileName: f.fileName || null,
                size: f.fileSize ? Number(f.fileSize) : null,
              },
            ];
          }, [])
        : null,
      type: isMedia ? "media" : "file",
    };
  }
  options.debug && console.debug("useShareIntent[parsed] ", result);
  return result;
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

  const resetShareIntent = (clearNativeModule = true) => {
    if (options.disabled) return;
    setError(null);
    clearNativeModule &&
      clearShareIntent(`${Constants.expoConfig?.scheme}ShareKey`);
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
    if (options.disabled) return;
    options.debug &&
      console.debug(
        "useShareIntent[mount]",
        Constants.expoConfig?.scheme,
        options,
      );
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
      options.debug && console.debug("useShareIntent[onChange]", event);
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
      changeSubscription.remove();
      errorSubscription.remove();
    };
  }, [options.disabled]);

  return {
    isReady,
    hasShareIntent: !!(shareIntent?.text || shareIntent?.files),
    shareIntent,
    resetShareIntent,
    error,
  };
}
