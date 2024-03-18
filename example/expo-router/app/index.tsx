import { useRouter } from "expo-router";
import { useShareIntentContext } from "expo-share-intent";
import { useEffect } from "react";
import { Text, View, StyleSheet } from "react-native";

export default function Home() {
  const router = useRouter();

  const { hasShareIntent } = useShareIntentContext();

  useEffect(() => {
    if (hasShareIntent) {
      // we want to handle share intent event in a specific page
      router.replace({
        pathname: "shareintent",
      });
    }
  }, [hasShareIntent]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to Expo Share Intent Demo !</Text>
      <Text>Try to share a content to access specific page</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
});
