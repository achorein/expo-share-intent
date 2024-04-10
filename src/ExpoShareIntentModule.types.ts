export type ChangeEventPayload = {
  value: string;
};

export type StateEventPayload = {
  value: "pending" | "none";
};

export type ShareIntentOptions = {
  debug?: boolean;
  resetOnBackground?: boolean;
  disabled?: boolean;
  scheme?: string;
  onResetShareIntent?: () => void;
};

export type ShareIntentMeta = {
  title?: string;
};

export type ShareIntent = {
  files: ShareIntentFile[] | null;
  text: string | null;
  webUrl: string | null;
  type: "media" | "file" | "text" | "weburl" | null;
  meta?: ShareIntentMeta;
};

export interface ShareIntentFile {
  path: string;
  mimeType: string;
  fileName: string;
  size: number | null;
}

interface BaseNativeShareIntent {
  text?: string;
  meta?: ShareIntentMeta;
}

export type IosShareIntent = BaseNativeShareIntent & {
  files?: IosShareIntentFile[];
  type: "media" | "file" | "text" | "weburl";
};

export interface IosShareIntentFile {
  path: string;
  type: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
}

export type AndroidShareIntent = BaseNativeShareIntent & {
  files?: AndroidShareIntentFile[];
  type: "file" | "text";
};

export interface AndroidShareIntentFile {
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize?: string;
  contentUri: string;
}

export type NativeShareIntent = IosShareIntent | AndroidShareIntent;
export type NativeShareIntentFile = IosShareIntentFile | AndroidShareIntentFile;
