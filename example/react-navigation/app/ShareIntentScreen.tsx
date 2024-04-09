import { Button, Image, StyleSheet, Text, View } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";

import { useShareIntentContext } from "expo-share-intent";
import { RootStackParamList } from "./types";

interface Props {
  navigation: StackNavigationProp<RootStackParamList, "ShareIntent">;
}

export default function ShareIntentScreen({ navigation }: Props) {
  const { hasShareIntent, shareIntent, resetShareIntent, error } =
    useShareIntentContext();

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/icon.png")}
        style={[styles.logo, styles.gap]}
      />
      <Text style={[styles.gap, { fontWeight: "bold" }]}>
        {hasShareIntent ? "SHARE INTENT FOUND !" : "NO SHARE INTENT DETECTED"}
      </Text>
      {!!shareIntent.text && <Text style={styles.gap}>{shareIntent.text}</Text>}
      {!!shareIntent.meta?.title && (
        <Text style={styles.gap}>{JSON.stringify(shareIntent.meta)}</Text>
      )}
      {shareIntent?.files?.map((file) => (
        <Image
          key={file.path}
          source={{ uri: file.path }}
          style={[styles.image, styles.gap]}
        />
      ))}
      {!!shareIntent && (
        <Button onPress={() => resetShareIntent()} title="Reset" />
      )}
      <Text style={[styles.error]}>{error}</Text>
      {/* @ts-ignore */}
      <Button onPress={() => navigation.navigate("Home")} title="Go home" />
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
  error: {
    color: "red",
  },
});
