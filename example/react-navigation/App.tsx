import { ShareIntentProvider } from "expo-share-intent";
import Navigator from "./app/Navigator";

export default function App() {
  return (
    <ShareIntentProvider options={{ debug: true }}>
      <Navigator />
    </ShareIntentProvider>
  );
}
