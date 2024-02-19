import { useMemo } from "react";
import { Button, Image, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";

import { useLocalSearchParams, useRouter } from "expo-router";

export default function ShareIntent() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const shareIntent = useMemo(
    () => (params?.shareIntent ? JSON.parse(params.shareIntent) : null),
    [params],
  );

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/icon.png")}
        style={[styles.logo, styles.gap]}
      />
      {!shareIntent && <Text>No Share intent detected</Text>}
      {!!shareIntent && (
        <Text style={[styles.gap, { fontSize: 20 }]}>
          Congratz, a share intent value is available
        </Text>
      )}
      {!!shareIntent.text && <Text style={styles.gap}>{shareIntent.text}</Text>}
      {shareIntent?.files?.map((file) => (
        <Image
          key={file.path}
          source={{ uri: file.path }}
          style={[styles.image, styles.gap]}
        />
      ))}
      {!!shareIntent && (
        <Button onPress={() => router.replace("/")} title="Go home" />
      )}
      <StatusBar style="auto" />
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
    width: 200,
    height: 200,
    resizeMode: "contain",
  },
  gap: {
    marginBottom: 20,
  },
});
