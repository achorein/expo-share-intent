import { createRef } from "react";
import { Text, View } from "react-native";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import {
  LinkingOptions,
  NavigationContainer,
  NavigationContainerRef,
  getStateFromPath,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { RootStackParamList } from "./types";

import HomeScreen from "./HomeScreen";
import ShareIntentScreen from "./ShareIntentScreen";
import {
  addStateListener,
  getScheme,
  getShareExtensionKey,
  hasShareIntent,
} from "expo-share-intent";

const Stack = createNativeStackNavigator();

const PREFIX = Linking.createURL("/");
const PACKAGE_NAME =
  Constants.expoConfig?.android?.package ||
  Constants.expoConfig?.ios?.bundleIdentifier;

export const navigationRef =
  createRef<NavigationContainerRef<RootStackParamList>>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [
    `${Constants.expoConfig?.scheme}://`,
    `${PACKAGE_NAME}://`,
    PREFIX,
  ],
  config: {
    initialRouteName: "Home",
    screens: {
      Home: "home",
      ShareIntent: "shareintent",
    },
  },
  // see: https://reactnavigation.org/docs/configuring-links/#advanced-cases
  getStateFromPath(path, config) {
    // REQUIRED FOR iOS FIRST LAUNCH
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      // redirect to the ShareIntent Screen to handle data with the hook
      console.debug(
        "react-navigation[getStateFromPath] redirect to ShareIntent screen",
      );
      return {
        routes: [
          {
            name: "ShareIntent",
          },
        ],
      };
    }
    return getStateFromPath(path, config);
  },
  subscribe(listener: (url: string) => void): undefined | void | (() => void) {
    console.debug("react-navigation[subscribe]", PREFIX, PACKAGE_NAME);
    const onReceiveURL = ({ url }: { url: string }) => {
      if (url.includes(getShareExtensionKey())) {
        // REQUIRED FOR iOS WHEN APP IS IN BACKGROUND
        console.debug(
          "react-navigation[onReceiveURL] Redirect to ShareIntent Screen",
          url,
        );
        listener(`${getScheme()}://shareintent`);
      } else {
        console.debug("react-navigation[onReceiveURL] OPEN URL", url);
        listener(url);
      }
    };
    const shareIntentEventSubscription = addStateListener((event) => {
      // REQUIRED FOR ANDROID WHEN APP IS IN BACKGROUND
      console.debug(
        "react-navigation[subscribe] shareIntentStateListener",
        event.value,
      );
      if (event.value === "pending") {
        listener(`${getScheme()}://shareintent`);
      }
    });
    const urlEventSubscription = Linking.addEventListener("url", onReceiveURL);
    return () => {
      // Clean up the event listeners
      shareIntentEventSubscription.remove();
      urlEventSubscription.remove();
    };
  },
  // https://reactnavigation.org/docs/deep-linking/#third-party-integrations
  async getInitialURL() {
    // REQUIRED FOR ANDROID FIRST LAUNCH
    const needRedirect = hasShareIntent(getShareExtensionKey());
    console.debug(
      "react-navigation[getInitialURL] redirect to ShareIntent screen:",
      needRedirect,
    );
    if (needRedirect) {
      return `${Constants.expoConfig?.scheme}://shareintent`;
    }
    // As a fallback, do the default deep link handling
    const url = await Linking.getInitialURL();
    return url;
  },
};

export default function Navigator() {
  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      fallback={
        <View style={{ flex: 1 }}>
          <Text>Loading...</Text>
        </View>
      }
    >
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="ShareIntent" component={ShareIntentScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
