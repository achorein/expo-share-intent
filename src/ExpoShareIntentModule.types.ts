export type ChangeEventPayload = {
  value: string;
};

export type ErrorEventPayload = {
  value: string;
};

export type StateEventPayload = {
  value: "pending" | "none";
};

/**
 * Options for configuring the `useShareIntent` hook.
 */
export type ShareIntentOptions = {
  /**
   * If `true`, includes additional logs for debugging.
   * @default false
   */
  debug?: boolean;
  /**
   * If `true`, resets the shared content when the
   * app goes into the background / foreground.
   * @default true
   */
  resetOnBackground?: boolean;
  /**
   * If `true`, disables shared intent.
   * @default false
   */
  disabled?: boolean;
  /**
   * Optional force application scheme to retreive ShareIntent on iOS.
   */
  scheme?: string;
  /**
   * Optional callback function that is triggered when the shared media resets.
   */
  onResetShareIntent?: () => void;
};

export type ShareIntentMeta = Record<string, string | undefined> & {
  title?: string;
  extra?: string;
};

/**
 * Base type for what shared content is common between both platforms.
 */
interface BaseShareIntent {
  meta?: ShareIntentMeta | null;
  text?: string | null;
}

/**
 * Shared intent to represent both platforms.
 */
export type ShareIntent = BaseShareIntent & {
  files: ShareIntentFile[] | null;
  type: "media" | "file" | "text" | "weburl" | null;
  webUrl: string | null;
};

/**
 * Shared intent type for Android.
 */
export interface AndroidShareIntent extends BaseShareIntent {
  files?: AndroidShareIntentFile[];
  type: "file" | "text";
}

/**
 * Shared intent type for iOS.
 */
export interface IosShareIntent extends BaseShareIntent {
  files?: IosShareIntentFile[];
  weburls?: { url: string; meta: string }[];
  type: "media" | "file" | "text" | "weburl";
}

/**
 * ShareIntentFile that is common among both platforms
 */
export type ShareIntentFile = {
  fileName: string;
  mimeType: string;
  path: string;
  size: number | null;
  width: number | null;
  height: number | null;
  duration: number | null;
};

/**
 * ShareIntentFile in iOS
 */
export interface IosShareIntentFile {
  fileSize?: number; // in octet
  fileName: string; // original filename
  mimeType: string; // ex: image/png
  path: string; // computed full path of file
  type: "0" | "1" | "2" | "3"; // native type ("0": media, "1": text, "2": weburl, "3": file)
  width: number | null;
  height: number | null;
  duration: number | null; // in ms
}

/**
 * ShareIntentFile in Android
 */
export interface AndroidShareIntentFile {
  contentUri: string; // original android uri of file
  mimeType: string; // ex: image/png
  fileName: string; // original filename
  filePath: string; // computed full path of file
  fileSize?: string; // in octet
  width: number | null;
  height: number | null;
  duration: number | null; // in ms
}

export type NativeShareIntent = AndroidShareIntent | IosShareIntent;
export type NativeShareIntentFile = AndroidShareIntentFile | IosShareIntentFile;
