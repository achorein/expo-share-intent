import { useEffect } from "react";

import { Slot, useRouter } from "expo-router";

import { useShareIntent } from "expo-share-intent";

export default function Layout() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent({
    debug: true,
    resetOnBackground: true,
  });

  useEffect(() => {
    if (hasShareIntent) {
      router.replace({
        pathname: "shareintent",
        params: { shareIntent: JSON.stringify(shareIntent) },
      });
      resetShareIntent();
    }
  }, [hasShareIntent]);

  return <Slot />;
}
