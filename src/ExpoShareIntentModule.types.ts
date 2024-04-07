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
  onResetShareIntent?: () => void;
};

export type ShareIntent = {
  files: ShareIntentFile[] | null;
  text: string | null;
  webUrl: string | null;
  type: "media" | "file" | "text" | "weburl" | null;
};

export interface ShareIntentFile {
  path: string;
  mimeType: string;
  fileName: string;
}

export type IosShareIntent = {
  text?: string;
  files?: IosShareIntentFile[];
  type: "media" | "file" | "text" | "weburl";
};

export interface IosShareIntentFile {
  path: string;
  type: string;
  fileName: string;
  mimeType: string;
}

export type AndroidShareIntent = {
  text?: string;
  files?: AndroidShareIntentFile[];
  type: "file" | "text";
};

export interface AndroidShareIntentFile {
  fileName: string;
  filePath: string;
  mimeType: string;
  contentUri: string;
}

export type NativeShareIntent = IosShareIntent | AndroidShareIntent;
export type NativeShareIntentFile = IosShareIntentFile | AndroidShareIntentFile;
