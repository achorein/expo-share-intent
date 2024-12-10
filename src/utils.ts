import Constants from "expo-constants";
import { createURL } from "expo-linking";

import {
  AndroidShareIntent,
  IosShareIntent,
  ShareIntent,
  ShareIntentFile,
  ShareIntentOptions,
} from "./ExpoShareIntentModule.types";
import { SHAREINTENT_DEFAULTVALUE } from "./useShareIntent";

export const getScheme = (options?: ShareIntentOptions) => {
  if (options?.scheme !== undefined) {
    options?.debug &&
      console.debug("expoShareIntent[scheme] from option:", options.scheme);
    return options.scheme;
  }
  if (Constants.expoConfig?.scheme) {
    let updatedScheme = Constants.expoConfig?.scheme;
    if (Array.isArray(Constants.expoConfig?.scheme)) {
      updatedScheme = updatedScheme[0];
      options?.debug &&
        console.debug(
          `expoShareIntent[scheme] from expoConfig: multiple scheme detected (${Constants.expoConfig?.scheme.join(",")}), using:${updatedScheme}`,
        );
    } else {
      options?.debug &&
        console.debug(
          "expoShareIntent[scheme] from expoConfig:",
          updatedScheme,
        );
    }
    return updatedScheme;
  }
  const deepLinkUrl = createURL("dataUrl=");
  const extracted = deepLinkUrl.match(/^([^:]+)/gi)?.[0] || null;
  options?.debug &&
    console.debug(
      "expoShareIntent[scheme] from linking url:",
      deepLinkUrl,
      extracted,
    );
  return extracted;
};

export const getShareExtensionKey = (options?: ShareIntentOptions) => {
  const scheme = getScheme(options);
  return `${scheme}ShareKey`;
};

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
