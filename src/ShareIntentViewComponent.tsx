import { Fragment } from "react";
import { Button, Image, StyleSheet, Text, View } from "react-native";

import { ShareIntentFile } from "./ExpoShareIntentModule.types";
import { parseShareIntent } from "./utils";

export const ShareIntentViewComponent = ({
  logoSource,
  rawShareIntent,
}: any) => {
  // const hasShareIntent = !!text || !!files;
  const shareIntent = parseShareIntent(JSON.stringify(rawShareIntent), {
    debug: true,
  });

  const hasShareIntent = !!(shareIntent?.text || shareIntent?.files);
  return (
    <View style={styles.container}>
      <Image source={logoSource} style={[styles.logo, styles.gap]} />
      <Text style={[styles.gap, styles.bold]}>
        {hasShareIntent ? "SHARE INTENT FOUND !" : "LOADING..."}
      </Text>

      {/* TEXT and URL */}
      {!!shareIntent.text && <Text style={styles.gap}>{shareIntent.text}</Text>}
      {!!shareIntent.meta?.title && (
        <Text style={styles.gap}>{JSON.stringify(shareIntent.meta)}</Text>
      )}

      {/* FILES */}
      {shareIntent?.files?.map((file) => (
        <Fragment key={file.path}>
          {file.mimeType.startsWith("image/") && (
            <Image source={{ uri: file.path }} style={[styles.image]} />
          )}
          <FileMeta file={file} />
        </Fragment>
      ))}

      {/* FOOTER */}
      <Button title="Close" />
    </View>
  );
};

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
      {file.duration && <Text>{file.duration}ms</Text>}
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
