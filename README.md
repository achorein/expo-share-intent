# Expo Share Intent 🚀

> This is not an official Expo SDK package.

Allow sharing **URL, text, images, videos and files** to your **iOS** and **Android** app, using a simple native module for Expo (React Native)

## Versioning

Ensure you use versions that work together

| Expo       | Supported `expo-share-intent` version |
| ---------- | ------------------------------------- |
| **SDK 51** | 2.0+                                  |
| **SDK 50** | 1.0+                                  |
| **SDK 49** | 0.2+                                  |

> iOS privacy manifest is available since v1.4.1

[<img src="https://badge.fury.io/js/expo-share-intent.svg">](https://www.npmjs.com/package/expo-share-intent)

![share-intent-1](https://github.com/achorein/expo-share-intent/assets/6529851/47c38ed0-060f-49d7-94ef-d0c59504ee43)
![share-intent-2](https://github.com/achorein/expo-share-intent/assets/6529851/c1f5382a-7934-4ae3-9cef-734a71d23933)
![share-intent-3](https://github.com/achorein/expo-share-intent/assets/6529851/e6734ace-36d5-4036-ab89-1a60afb2c703)

## Table of Contents

- [Usage](#usage)
  - [Configure Content Types](#customize-content-types-in-appjson)
  - [Share Intent content](#share-intent-content)
  - [Expo Router](#expo-router)
  - [React Navigation](#react-navigation)
- [Troubleshooting / FAQ](#troubleshooting---faq)
- [Support](#support)

## Installation

**Install npm package**

```bash
yarn add expo-share-intent
# or
npm install expo-share-intent
```

**Requirement**

For the moment this package need a post-install script

- copy the [xcode patch](https://github.com/achorein/expo-share-intent/blob/main/example/basic/patches/xcode%2B3.0.1.patch) in you `patches` project directory (like example)
- add post-install script to `package.json`

```json
  "scripts": {
    ...
    "postinstall": "patch-package"
  },
```

- add `patch-package` for auto patching

```bash
yarn add patch-package
```

> More info in [#13](https://github.com/achorein/expo-share-intent/issues/13) and [FAQ](https://github.com/achorein/expo-share-intent/edit/main/README.md#config-sync-failed)

# <<<<<<< HEAD

**Requirement: `expo-linking`**

Since Expo52, you also need to install `expo-linking` in your app :

```
expo install expo-linking
```

> > > > > > > 107225c (feat: handle custom ios identifiers (#117))
> > > > > > > **Into your `app.json`:**

- add expo plugin

```json
  "plugins": [
      "expo-share-intent"
  ],
```

> by default only text and url sharing is activated

- configure a custom URL scheme

```json
  "scheme": "my-app"
```

> More info here : [Linking to your app](https://docs.expo.dev/guides/linking/#linking-to-your-app)

**Run your app in dev-client**

```
expo prebuild --no-install --clean
expo run:ios
expo run:android
```

> We cannot use expo go with this package, more info [here](https://github.com/achorein/expo-share-intent?tab=readme-ov-file#expo-go-)

## Usage

#### Use the hook in your App

Make sure to use the hook in your main `App.tsx` component before any other Provider :

```ts
import { useShareIntent } from "expo-share-intent";

const { hasShareIntent, shareIntent, resetShareIntent, error } =
  useShareIntent();
```

See [App.tsx ](https://github.com/achorein/expo-share-intent/blob/main/example/basic/App.tsx) for more details

#### Use the Provider in your App

When dealing with multiple screens and providers your may use `ShareIntentProvider` and it's specific hook `useShareIntentContext`. Must be in your top component (`App.tsx`) before any other Provider :

```tsx
import { ShareIntentProvider, useShareIntentContext } from "expo-share-intent";


const Home = () => {
  const { hasShareIntent, shareIntent, resetShareIntent, error } = useShareIntentContext();
  return ...
}

export default const App = () => {
  return (
    <ShareIntentProvider>
      <ThirdPartyExtraProvider>
        <Home />
      </ThirdPartyExtraProvider>
    </ShareIntentProvider>
  )
}

```

#### Share intent content

```ts
const { shareIntent } = useShareIntent();
```

| attribute                | description                                                                                                                   | example                                                                                                                                                                                                                                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shareIntent.text`       | raw text from text/weburl (ios) and text/\* (android)                                                                         | "`some text`", "`http://example.com`", "`Hey, Click on my link : http://example.com/nickname`"                                                                                                                                                                                                           |
| `shareIntent.webUrl`     | link extracted from raw text                                                                                                  | `null`, "`http://example.com`", "`http://example.com/nickname`"                                                                                                                                                                                                                                          |
| `shareIntent.files`      | image / movies / audio / files with name, path, mimetype, size (in octets) and image/video dimensions (width/height/duration) | `[{ path: "file:///local/path/filename", mimeType: "image/jpeg", fileName: "originalFilename.jpg", size: 2567402, width: 800, height: 600 }, { path: "file:///local/path/filename", mimeType: "video/mp4", fileName: "originalFilename.mp4", size: 2567402, width: 800, height: 600, duration: 20000 }]` |
| `shareIntent.meta`       | meta object which contains extra information about the share intent                                                           | `{ title: "My cool blog article" }`                                                                                                                                                                                                                                                                      |
| `shareIntent.meta.title` | optional title property sent by other app. Currently only filled on Android                                                   | `My cool blog article`                                                                                                                                                                                                                                                                                   |

#### Customize Content Types in `app.json`

Simply choose content types you need :

```json
  "plugins": [
      [
        "expo-share-intent",
        {
          "iosActivationRules": {
            "NSExtensionActivationSupportsWebURLWithMaxCount": 1,
            "NSExtensionActivationSupportsWebPageWithMaxCount": 1,
            "NSExtensionActivationSupportsImageWithMaxCount": 1,
            "NSExtensionActivationSupportsMovieWithMaxCount": 1,
          },
          "androidIntentFilters": ["text/*", "image/*"]
        }
      ],
  ],
```

| Option                        | Values                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| iosActivationRules            | Allow **text** sharing with `"NSExtensionActivationSupportsText": true`<br/>**Url** sharing with `"NSExtensionActivationSupportsWebURLWithMaxCount": 1` and `"NSExtensionActivationSupportsWebPageWithMaxCount": 1`<br/>**Images** sharing with `"NSExtensionActivationSupportsImageWithMaxCount": 1`<br/>**Videos** sharing with `"NSExtensionActivationSupportsMovieWithMaxCount": 1`<br/>**Files and audio** sharing with `"NSExtensionActivationSupportsFileWithMaxCount": 1`<br/>_default value_: `{ "NSExtensionActivationSupportsWebURLWithMaxCount": 1, "NSExtensionActivationSupportsWebPageWithMaxCount": 1 }"`<br/>_More info in apple developper doc [here](https://developer.apple.com/documentation/bundleresources/information_property_list/nsextension/nsextensionattributes/nsextensionactivationrule)_<br/>you can also provide a custom query (ex: `"iosActivationRules": "SUBQUERY (...)"`) |
| iosShareExtensionName         | override `CFBundleDisplayName` the extension `info.plist`, also used as extension name for xcode target (ex: `ExpoShareIntent Example Extension`, folder: `ExpoShareIntentExampleExtension`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| iosAppGroupIdentifier         | custom application group identifier for `com.apple.security.application-groups` (ex: `group.custom.exposhareintent.example`) cf [#94](https://github.com/achorein/expo-share-intent/issues/94)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| androidIntentFilters          | **one file sharing** array of MIME types :`"text/*"` / `"image/*"` / `"video/*"` / `"*/*"`<br/>_default value_: `["text/*"]` (text and url)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| androidMultiIntentFilters     | **multiple files sharing** array of MIME types : `"image/*"` / `"video/*"` / `"audio/*`/ `"*/*"`<br/>_default value_: `[]`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| androidMainActivityAttributes | _default value_: `{ "android:launchMode": "singleTask" }`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| disableAndroid                | Disable the android share intent. Useful if you want to use a custom implementation. _default value_: `false`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| disableIOS                    | Disable the ios share extension. Useful if you want to use a custom implementation (ex: iOS custom view). _default value_: `false`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

### Expo Router

With `expo-router` you need to handle loading elements on [Layout](https://docs.expo.dev/routing/appearance/). It's the only way to call the native module using deeplink url.

An example is available with Expo Router v3 in [example/expo-router](https://github.com/achorein/expo-share-intent/tree/main/example/expo-router/)

### React Navigation

If you want to handle share intent with React Navigation v6, you must use the `ShareIntentProvider` and add a custom mapping function in your linking configuration.

Take a look at the example in [example/react-navigation](https://github.com/achorein/expo-share-intent/tree/main/example/react-navigation/)

## Troubleshooting - FAQ

### iOS Extension Target

When building on EAS you should only have **one** extension target (during credentials setting process).

To avoid expo auto configuration to add an experimental "appExtensions" to `app.json` you must manually configure your eas build (projectId in `app.json` and a `eas.json` file).

More details in [#1](https://github.com/achorein/expo-share-intent-demo/issues/1)

### Config sync failed

```bash
$ yarn prebuild
⠧ Running prebuild[expo-share-intent] add ios share extension (scheme:exposhareintentexample appIdentifier:expo.modules.exposhareintent.example)
⠇ Running prebuild[expo-share-intent] add android filters text/* image/*
✖ Config sync failed
TypeError: [ios.xcodeproj]: withIosXcodeprojBaseMod: Cannot read properties of null (reading 'path')
```

This package need a post-install script, see `xcode+3.0.1.patch` file in [example/patches](https://github.com/achorein/expo-share-intent/tree/main/example/basic/patches) (more info [#31](https://github.com/achorein/expo-share-intent-demo/issues/31) and [#13](https://github.com/achorein/expo-share-intent/issues/13))

### Expo Go ?

We are using native code to make share intent works, so we can't use Expo Go and have to use a custom dev client, that's why the demo use `expo prebuild --no-install` command and then `expo run:ios`, instead of a simple `expo start --ios`
-> More information [here](https://docs.expo.dev/workflow/customizing/)

That way you can test your share intent into simulator, but that does not exempt you to test a complete build on device at the end of your development process to make sure all works as excepted.

NB: don't commit your ios/ and android/ folder, rebuild it before EAS build.

> If you want to open your application in expo go with this package your can **disable** the native module call with `useShareIntent({ disabled: true })`. Allowing to speed test other features on your app without share intent.

### Google Signin and CFBundleURLSchemes

When using `@react-native-google-signin/google-signin` you need to configure a custom scheme in your app.json to handle google signin fallback. By doing this, the original app scheme is deleted and must be manually reassigned :

```json
 "scheme": "exposhareintentexample",
 "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "expo.modules.exposhareintent.example",
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLSchemes": [
              "com.googleusercontent.apps.xxxxxxxx-xxxxxxxxx",
              "exposhareintentexample"
            ]
          }
        ]
      }
    },
```

### Custom view ?

At the moment, this project does not support iOS custom view (native view in share intent context).
Everything must be handle into React Native code.

I am considering adding the implementation of this custom view in the future !

> if it's a must have feature for you, take a look at [react-native-share-menu](https://github.com/Expensify/react-native-share-menu)

## Support

Enjoying this project? Wanna show some love? Drop a star and consider buying me a coffee to keep me fueled and motivated for the next releases

<a href="https://www.buymeacoffee.com/achorein" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

Are you using expo-share-intent at work? Please consider [sponsoring me](https://github.com/sponsors/achorein)!

## Thanks

Special thanks to [expo-config-plugin-ios-share-extension](https://github.com/timedtext/expo-config-plugin-ios-share-extension) and [react-native-receive-sharing-intent](https://github.com/ajith-ab/react-native-receive-sharing-intent), on which this one is very inspired.
