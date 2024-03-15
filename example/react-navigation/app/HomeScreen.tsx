import { useShareIntentContext } from "expo-share-intent";
import { Text, View, StyleSheet } from "react-native";

export default function HomeScreen() {
  const { shareIntent } = useShareIntentContext();
  console.log("HomeScreen", shareIntent);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to Expo Share Intent Example !</Text>
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
