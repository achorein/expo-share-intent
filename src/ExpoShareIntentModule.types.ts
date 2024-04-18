export type ChangeEventPayload = {
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

export type ShareIntentMeta = {
  title?: string;
};

/**
 * Base type for what shared content is common between both platforms.
 */
interface BaseShareIntent {
  text?: string | null;
  meta?: ShareIntentMeta;
}
/**
 * Shared intent to represent both platforms.
 */
export interface ShareIntent extends BaseShareIntent {
  files: ShareIntentFile[] | null;
  webUrl: string | null;
  type: "media" | "file" | "text" | "weburl" | null;
}

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
  type: "media" | "file" | "text" | "weburl" | null;
}

/**
 * ShareIntentFile that is common among both platforms
 */
export interface ShareIntentFile {
  fileName: string;
  mimeType: string;
  path: string;
  size: number | null;
}
export interface IosShareIntentFile {
  fileSize?: number; // in octet
  fileName: string; // original filename
  mimeType: string; // ex: image/png
  path: string; // computed full path of file
  type: "0" | "1" | "2" | "3"; // native type ("0": media, "1": text, "2": weburl, "3": file)
}

export interface AndroidShareIntentFile {
  contentUri: string; // original android uri of file
  filePath: string; // computed full path of file
  fileSize?: string; // in octet
  fileName: string; // original filename
  mimeType: string; // ex: image/png
}

export type NativeShareIntent = AndroidShareIntent | IosShareIntent;
export type NativeShareIntentFile = AndroidShareIntentFile | IosShareIntentFile;
