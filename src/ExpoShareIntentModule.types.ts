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
  link: string | null;
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
