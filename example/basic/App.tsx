import { Button, Image, StyleSheet, Text, View } from "react-native";

import { useShareIntent, ShareIntentFile } from "expo-share-intent";

export default function App() {
  const { hasShareIntent, shareIntent, resetShareIntent, error } =
    useShareIntent({
      debug: true,
      resetOnBackground: true,
    });

  return (
    <View style={styles.container}>
      <Image
        source={require("./assets/icon.png")}
        style={[styles.logo, styles.gap]}
      />
      <Text style={[styles.gap, styles.bold]}>
        {hasShareIntent ? "SHARE INTENT FOUND !" : "NO SHARE INTENT DETECTED"}
      </Text>

      {/* TEXT and URL */}
      {!!shareIntent.text && <Text style={styles.gap}>{shareIntent.text}</Text>}
      {!!shareIntent.meta?.title && (
        <Text style={styles.gap}>{JSON.stringify(shareIntent.meta)}</Text>
      )}

      {/* FILES */}
      {shareIntent?.files?.map((file) => (
        <>
          {file.mimeType.startsWith("image/") && (
            <Image
              key={file.path}
              source={{ uri: file.path }}
              style={[styles.image]}
            />
          )}
          <FileMeta key={file.path} file={file} />
        </>
      ))}

      {/* FOOTER */}
      {!!shareIntent && (
        <Button onPress={() => resetShareIntent()} title="Reset" />
      )}
      <Text style={[styles.error]}>{error}</Text>
    </View>
  );
}

function FileMeta({ file }: { file: ShareIntentFile }) {
  return (
    <View style={[styles.gap, styles.meta]}>
      <Text style={styles.bold}>{file.fileName}</Text>
      <Text>
        {file.mimeType} ({Math.round((file.size || 0) / 1024)}
        ko)
      </Text>
      {file.width && (
        <Text>
          {file.width} x {file.height}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 75,
    height: 75,
    resizeMode: "contain",
  },
  image: {
    width: 300,
    height: 200,
    resizeMode: "contain",
    // backgroundColor: "lightgray",
  },
  gap: {
    marginBottom: 20,
  },
  bold: {
    fontWeight: "bold",
  },
  meta: {
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: "red",
    marginTop: 20,
  },
});
