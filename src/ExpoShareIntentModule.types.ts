export type ChangeEventPayload = {
  value: string;
};

export type StateEventPayload = {
  value: "pending" | "none";
};
/**
 * The type of shared content that both Android and iOS have in common
 */
export type AndroidSharedMediaType = "file" | "text";

/**
 * The type of shared content that iOS supports.
 */
export type SharedMediaType = AndroidSharedMediaType | "media" | "weburl";

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
}
/**
 * Shared intent to represent both platforms.
 */
export interface ShareIntent extends BaseShareIntent {
  files: ShareIntentFile[] | null;
  type: SharedMediaType | null;
  webUrl: string | null;
  meta?: ShareIntentMeta;
}

/**
 * Shared intent type for Android.
 */
export interface AndroidShareIntent extends BaseShareIntent {
  files?: AndroidShareIntentFile[];
  type: AndroidSharedMediaType;
}

/**
 * Shared intent type for iOS.
 */
export interface IosShareIntent extends BaseShareIntent {
  files?: IosShareIntentFile[];
  type: SharedMediaType;
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
  fileSize?: number; //TODO: Consolidate with size from ShareIntentFile
  fileName: string;
  mimeType: string;
  path: string; //TODO: Consolidate all 3 into filePath/path
  type: string; //TODO: Eliminate? Duplicate with mimeType
}

export interface AndroidShareIntentFile {
  contentUri: string; // What is the difference between this and filePath?
  filePath: string; // TODO: Consolidate with other filePath/path to make consistent
  fileSize?: string; // TODO: Consolidate with size from ShareIntent
  fileName: string;
  mimeType: string;
}

export type NativeShareIntent = AndroidShareIntent | IosShareIntent;
export type NativeShareIntentFiles =
  | AndroidShareIntentFile
  | IosShareIntentFile;
