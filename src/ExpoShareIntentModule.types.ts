export type ChangeEventPayload = {
  value: string;
};

export type ShareIntentOptions = {
  debug?: boolean;
  resetOnBackground?: boolean;
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
};

export type IosShareIntent = {
  text?: string;
  files?: {
    path: string;
    type: string;
  }[];
};

export type AndroidShareIntent = {
  text?: string;
  files?: {
    fileName: string;
    filePath: string;
    mimeType: string;
    contentUri: string;
  }[];
};
