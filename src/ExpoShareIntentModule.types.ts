export type ChangeEventPayload = {
  value: string;
};

export type StateEventPayload = {
  value: "pending" | "none";
};

export type ShareIntentOptions = {
  debug?: boolean;
  resetOnBackground?: boolean;
  onResetShareIntent?: () => void;
};

export type ShareIntent = {
  files:
    | {
        path: string;
        type: string;
        fileName?: string;
      }[]
    | null;
  text: string | null;
  webUrl: string | null;
  type: "media" | "file" | "text" | "weburl" | null;
};

export type IosShareIntent = {
  text?: string;
  files?: {
    path: string;
    type: string;
  }[];
  type: "media" | "file" | "text" | "weburl";
};

export type AndroidShareIntent = {
  text?: string;
  files?: {
    fileName: string;
    filePath: string;
    mimeType: string;
    contentUri: string;
  }[];
  type: "media" | "file" | "text" | "weburl";
};
