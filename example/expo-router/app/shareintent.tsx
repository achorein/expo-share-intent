import { Button, Image, StyleSheet, Text, View } from "react-native";

import { useRouter } from "expo-router";
import {
  ShareIntent as ShareIntentType,
  useShareIntentContext,
} from "expo-share-intent";

const WebUrlComponent = ({ shareIntent }: { shareIntent: ShareIntentType }) => {
  return (
    <View
      style={[
        styles.gap,
        styles.row,
        { borderWidth: 1, borderRadius: 5, height: 102 },
      ]}
    >
      <Image
        source={
          shareIntent.meta?.["og:image"]
            ? { uri: shareIntent.meta?.["og:image"] }
            : undefined
        }
        style={[styles.icon, styles.gap, { borderRadius: 5 }]}
      />
      <View style={{ flexShrink: 1, padding: 5 }}>
        <Text style={[styles.gap]}>
          {shareIntent.meta?.title || "<NO TITLE>"}
        </Text>
        <Text style={styles.gap}>{shareIntent.webUrl}</Text>
      </View>
    </View>
  );
};

export default function ShareIntent() {
  const router = useRouter();
  const { hasShareIntent, shareIntent, error, resetShareIntent } =
    useShareIntentContext();

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/icon.png")}
        style={[styles.logo, styles.gap]}
      />
      {!hasShareIntent && <Text>No Share intent detected</Text>}
      {hasShareIntent && (
        <Text style={[styles.gap, { fontSize: 20 }]}>
          Congratz, a share intent value is available
        </Text>
      )}
      {!!shareIntent.text && <Text style={styles.gap}>{shareIntent.text}</Text>}
      {shareIntent?.type === "weburl" && (
        <WebUrlComponent shareIntent={shareIntent} />
      )}
      {shareIntent?.files?.map((file) => (
        <Image
          key={file.path}
          source={{ uri: file.path }}
          style={[styles.image, styles.gap]}
        />
      ))}
      {hasShareIntent && (
        <Button onPress={() => resetShareIntent()} title="Reset" />
      )}
      <Text style={[styles.error]}>{error}</Text>
      <Button onPress={() => router.replace("/")} title="Go home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  logo: {
    width: 75,
    height: 75,
    resizeMode: "contain",
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  icon: {
    width: 100,
    height: 100,
    resizeMode: "contain",
    backgroundColor: "lightgray",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  gap: {
    marginBottom: 20,
  },
  error: {
    color: "red",
  },
});
