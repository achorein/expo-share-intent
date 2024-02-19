export type ChangeEventPayload = {
  value: string;
};

export type ShareIntent = {
  files: Array<{ path?: string }> | null;
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
