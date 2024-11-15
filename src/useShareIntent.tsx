import { useEventListener } from "expo";
import { useLinkingURL } from "expo-linking";
import { useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

import ExpoShareIntentModule from "./ExpoShareIntentModule";
import {
  AndroidShareIntent,
  IosShareIntent,
  ShareIntent,
  ShareIntentFile,
  ShareIntentOptions,
} from "./ExpoShareIntentModule.types";
import { getScheme, getShareExtensionKey } from "./utils";

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

// const IOS_SHARE_TYPE_MAPPING = {
//   0: "media",
//   1: "text",
//   2: "weburl",
//   3: "file",
// };

export const parseShareIntent = (
  value: string | AndroidShareIntent,
  options: ShareIntentOptions,
): ShareIntent => {
  let result = SHAREINTENT_DEFAULTVALUE;
  if (!value) return result;
  let shareIntent;
  // ios native module send a raw string of the json, try to parse it
  if (typeof value === "string") {
    shareIntent = JSON.parse(value) as IosShareIntent; // iOS
  } else {
    shareIntent = value; // Android
  }

  if (shareIntent.text) {
    // Try to find the webURL in the SharedIntent text
    const webUrl =
      shareIntent.text.match(
        /[(http(s)?)://(www.)?-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&//=]*)/gi,
      )?.[0] || null;

    result = {
      ...SHAREINTENT_DEFAULTVALUE,
      text: shareIntent.text,
      webUrl,
      type: webUrl ? "weburl" : "text",
      meta: {
        title: shareIntent.meta?.title ?? undefined,
      },
    };
  } else {
    // Ensure we got a valid file. some array value are emply
    const files =
      shareIntent?.files?.filter((file: any) => file.path || file.contentUri) ||
      [];
    const isMedia = files.every(
      (file) =>
        file.mimeType.startsWith("image/") ||
        file.mimeType.startsWith("video/"),
    );
    result = {
      ...SHAREINTENT_DEFAULTVALUE,
      files: shareIntent?.files
        ? shareIntent.files.reduce((acc: ShareIntentFile[], file: any) => {
            if (!file.path && !file.contentUri) return acc;
            return [
              ...acc,
              {
                path:
                  file.path ||
                  (file.filePath ? `file://${file.filePath}` : null) ||
                  file.contentUri ||
                  null,
                mimeType: file.mimeType || null,
                fileName: file.fileName || null,
                width: file.width ? Number(file.width) : null,
                height: file.height ? Number(file.height) : null,
                size: file.fileSize ? Number(file.fileSize) : null,
                duration: file.duration ? Number(file.duration) : null,
              },
            ];
          }, [])
        : null,
      type: isMedia ? "media" : "file",
    };
  }
  options.debug &&
    console.debug("useShareIntent[parsed] ", JSON.stringify(result, null, 2));
  return result;
};

export default function useShareIntent(
  options: ShareIntentOptions = SHAREINTENT_OPTIONS_DEFAULT,
) {
  const url = useLinkingURL();

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
      ExpoShareIntentModule?.clearShareIntent(getShareExtensionKey(options));
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
    if (url?.includes(`${getScheme(options)}://dataUrl=`)) {
      // iOS only
      ExpoShareIntentModule?.getShareIntent(url);
    } else if (Platform.OS === "android") {
      ExpoShareIntentModule?.getShareIntent("");
    } else if (Platform.OS === "ios") {
      options.debug &&
        console.debug("useShareIntent[refresh] not a valid refresh url");
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
    } else if (!ExpoShareIntentModule) {
      options.debug &&
        console.warn(
          "expo-share-intent module is disabled: ExpoShareIntentModule not found!",
        );
      return;
    }
    const changeSubscription = ExpoShareIntentModule.addListener(
      "onChange",
      (event) => {
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
      },
    );
    const errorSubscription = ExpoShareIntentModule.addListener(
      "onError",
      (event) => {
        options.debug && console.debug("useShareIntent[error]", event?.value);
        setError(event?.value);
      },
    );
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
