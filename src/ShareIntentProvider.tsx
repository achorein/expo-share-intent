import React, { useContext } from "react";

import { ShareIntent, ShareIntentOptions } from "./ExpoShareIntentModule.types";
import useShareIntent, { SHAREINTENT_DEFAULTVALUE } from "./useShareIntent";

type ShareIntentContextState = {
  isReady: boolean;
  hasShareIntent: boolean;
  shareIntent: ShareIntent;
  resetShareIntent: () => void;
  error: string | null;
};

const ShareIntentContext = React.createContext<ShareIntentContextState>({
  isReady: false,
  hasShareIntent: false,
  shareIntent: SHAREINTENT_DEFAULTVALUE,
  resetShareIntent: () => {},
  error: null,
});

export const ShareIntentContextConsumer = ShareIntentContext.Consumer;

export function useShareIntentContext() {
  return useContext(ShareIntentContext);
}

export function ShareIntentProvider({
  options,
  children,
}: {
  options?: ShareIntentOptions;
  children: any;
}) {
  const { isReady, hasShareIntent, shareIntent, resetShareIntent, error } =
    useShareIntent(options);

  return (
    <ShareIntentContext.Provider
      value={{
        isReady,
        hasShareIntent,
        shareIntent,
        resetShareIntent,
        error,
      }}
    >
      {children}
    </ShareIntentContext.Provider>
  );
}
