import { ShareIntentProvider } from "expo-share-intent";
import Navigator, { navigationRef } from "./app/Navigator";

export default function App() {
  return (
    <ShareIntentProvider
      options={{
        debug: true,
        // @ts-ignore
        onResetShareIntent: () => navigationRef.current?.navigate("Home"),
      }}
    >
      <Navigator />
    </ShareIntentProvider>
  );
}
