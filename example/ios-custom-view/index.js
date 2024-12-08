import { registerRootComponent } from "expo";
import { addShareIntentCustomView } from "expo-share-intent";

import App from "./App";

addShareIntentCustomView({ logoSource: require("./assets/icon.png") });

registerRootComponent(App);
