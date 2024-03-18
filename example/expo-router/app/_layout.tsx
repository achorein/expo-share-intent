import { Slot, useRouter } from "expo-router";

import { ShareIntentProvider } from "expo-share-intent";

export default function Layout() {
  const router = useRouter();

  return (
    <ShareIntentProvider
      options={{
        debug: true,
        resetOnBackground: true,
        onResetShareIntent: () =>
          // used when app going in background and when the reset button is pressed
          router.replace({
            pathname: "/",
          }),
      }}
    >
      <Slot />
    </ShareIntentProvider>
  );
}
